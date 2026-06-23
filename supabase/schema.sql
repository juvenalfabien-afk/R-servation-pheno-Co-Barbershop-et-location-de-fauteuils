-- À exécuter dans Supabase > SQL Editor

create table reservations (
  id             text primary key,
  created_at     timestamptz not null default now(),
  nom            text not null,
  email          text not null,
  telephone      text not null,
  type_duration  text not null,
  formule        text not null,
  pack           text not null,
  date_debut     text not null,
  date_fin       text,
  heure_debut    text,
  
  heure_fin      text,
  statut_pro     text not null,
  experience     text not null,
  specialites    text[] not null,
  total_ht       numeric(10,2) not null,
  tva            numeric(10,2) not null,
  total_ttc      numeric(10,2) not null,
  acompte        numeric(10,2) not null,
  status         text not null default 'pending',
  notes          text
);

-- Tout accès public bloqué — uniquement la service role key (côté serveur) peut lire/écrire
alter table reservations enable row level security;
