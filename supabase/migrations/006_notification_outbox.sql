-- PHENO&CO - Outbox transactionnelle pour les confirmations de réservation.
-- À appliquer uniquement après 005, sur staging isolé puis en production après validation.

begin;

create table if not exists public.notification_jobs (
  job_key text primary key,
  event_type text not null check (event_type in ('rdv_confirmation', 'rdv_group_confirmation', 'location_confirmation')),
  source_id text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'uncertain')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 20),
  retryable boolean not null default true,
  available_at timestamptz not null default (now() + interval '1 minute'),
  lease_token text,
  lease_expires_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(job_key) between 1 and 200),
  check (length(source_id) between 1 and 200),
  check (lease_token is null or lease_token ~ '^[0-9a-f]{64}$'),
  check (last_error_code is null or length(last_error_code) <= 100)
);

create index if not exists notification_jobs_available_idx
  on public.notification_jobs (available_at, created_at)
  where status in ('pending', 'failed', 'uncertain', 'processing');

alter table public.notification_jobs enable row level security;
revoke all on table public.notification_jobs from public, anon, authenticated;
grant select, insert, update, delete on table public.notification_jobs to service_role;

create or replace function public.enqueue_rdv_notification_job()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_job_key text;
  current_event_type text;
  current_source_id text;
begin
  if current_setting('pheno.seed_mode', true) = 'on' then
    return new;
  end if;

  if new.group_id is null then
    current_job_key := 'rdv-confirmation:' || new.id;
    current_event_type := 'rdv_confirmation';
    current_source_id := new.id;
  else
    current_job_key := 'rdv-group-confirmation:' || new.group_id;
    current_event_type := 'rdv_group_confirmation';
    current_source_id := new.group_id;
  end if;

  insert into public.notification_jobs (job_key, event_type, source_id)
  values (current_job_key, current_event_type, current_source_id)
  on conflict (job_key) do nothing;
  return new;
end;
$$;

create or replace function public.enqueue_location_notification_job()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if current_setting('pheno.seed_mode', true) = 'on' then
    return new;
  end if;

  insert into public.notification_jobs (job_key, event_type, source_id)
  values ('location-confirmation:' || new.id, 'location_confirmation', new.id)
  on conflict (job_key) do nothing;
  return new;
end;
$$;

drop trigger if exists rdv_notification_outbox on public.rdv_bookings;
create trigger rdv_notification_outbox
after insert on public.rdv_bookings
for each row execute function public.enqueue_rdv_notification_job();

drop trigger if exists location_notification_outbox on public.reservations;
create trigger location_notification_outbox
after insert on public.reservations
for each row execute function public.enqueue_location_notification_job();

create or replace function public.claim_notification_jobs(p_limit integer, p_lease_seconds integer)
returns table(job_key text, event_type text, source_id text, lease_token text, attempt_count integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_limit not between 1 and 100 or p_lease_seconds not between 30 and 3600 then
    raise exception 'Invalid notification job claim';
  end if;

  return query
  with candidates as (
    select jobs.job_key
    from public.notification_jobs jobs
    where jobs.attempt_count < 10
      and (
        (jobs.status in ('pending', 'failed', 'uncertain') and jobs.retryable and jobs.available_at <= now())
        or (jobs.status = 'processing' and jobs.lease_expires_at <= now())
      )
    order by jobs.available_at, jobs.created_at
    for update skip locked
    limit p_limit
  ), claimed as (
    update public.notification_jobs jobs
    set status = 'processing',
        attempt_count = jobs.attempt_count + 1,
        lease_token = encode(gen_random_bytes(32), 'hex'),
        lease_expires_at = now() + make_interval(secs => p_lease_seconds),
        updated_at = now()
    from candidates
    where jobs.job_key = candidates.job_key
    returning jobs.job_key, jobs.event_type, jobs.source_id, jobs.lease_token, jobs.attempt_count
  )
  select claimed.job_key, claimed.event_type, claimed.source_id, claimed.lease_token, claimed.attempt_count
  from claimed;
end;
$$;

create or replace function public.finalize_notification_job(
  p_job_key text,
  p_lease_token text,
  p_status text,
  p_retryable boolean,
  p_retry_after_seconds integer,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected integer;
begin
  if p_status not in ('sent', 'failed', 'uncertain')
     or p_lease_token !~ '^[0-9a-f]{64}$'
     or p_retry_after_seconds not between 0 and 86400 then
    raise exception 'Invalid notification job finalization';
  end if;

  update public.notification_jobs
  set status = p_status,
      retryable = case when p_status = 'sent' then false else coalesce(p_retryable, false) end,
      available_at = case
        when p_status <> 'sent' and coalesce(p_retryable, false)
          then now() + make_interval(secs => p_retry_after_seconds)
        else available_at
      end,
      lease_token = null,
      lease_expires_at = null,
      last_error_code = left(p_error_code, 100),
      updated_at = now()
  where job_key = p_job_key and status = 'processing' and lease_token = p_lease_token;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

revoke all on function public.enqueue_rdv_notification_job() from public, anon, authenticated;
revoke all on function public.enqueue_location_notification_job() from public, anon, authenticated;
revoke all on function public.claim_notification_jobs(integer, integer) from public, anon, authenticated;
revoke all on function public.finalize_notification_job(text, text, text, boolean, integer, text) from public, anon, authenticated;
grant execute on function public.enqueue_rdv_notification_job() to service_role;
grant execute on function public.enqueue_location_notification_job() to service_role;
grant execute on function public.claim_notification_jobs(integer, integer) to service_role;
grant execute on function public.finalize_notification_job(text, text, text, boolean, integer, text) to service_role;

commit;
