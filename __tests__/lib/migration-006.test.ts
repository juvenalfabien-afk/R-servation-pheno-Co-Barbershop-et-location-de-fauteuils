import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  new URL('../../supabase/migrations/006_notification_outbox.sql', import.meta.url),
  'utf8',
).replace(/\r\n?/g, '\n')

describe('migration 006 notification outbox safety contract', () => {
  it('crée une outbox privée avec les cinq états attendus', () => {
    expect(sql).toContain('create table if not exists public.notification_jobs')
    expect(sql).toContain("status in ('pending', 'processing', 'sent', 'failed', 'uncertain')")
    expect(sql).toContain('alter table public.notification_jobs enable row level security')
    expect(sql).toContain('revoke all on table public.notification_jobs from public, anon, authenticated')
  })

  it('insère les jobs dans la transaction des réservations', () => {
    expect(sql).toContain('after insert on public.rdv_bookings')
    expect(sql).toContain('after insert on public.reservations')
    expect(sql).toContain('on conflict (job_key) do nothing')
    expect(sql.match(/current_setting\('pheno\.seed_mode', true\) = 'on'/g)).toHaveLength(2)
  })

  it('utilise des claims concurrents et réserve les RPC au rôle serveur', () => {
    expect(sql).toContain('for update skip locked')
    expect(sql).toContain('lease_expires_at')
    expect(sql).toContain('finalize_notification_job')
    expect(sql).toContain('to service_role')
    expect(sql).not.toMatch(/grant\s+.+\s+to\s+(?:anon|authenticated)/i)
  })
})
