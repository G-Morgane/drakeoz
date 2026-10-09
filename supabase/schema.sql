-- Schéma Supabase pour drakeoz. À exécuter dans l'éditeur SQL du projet.
-- Le site n'utilise que la clé service côté serveur : pas de RLS nécessaire,
-- mais on la laisse activée et sans policy pour fermer l'accès anon.

create table if not exists days (
  date date primary key,
  title text,
  intro text,
  started_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  date date not null references days(date) on delete cascade,
  url text not null,
  title text not null,
  source text not null,
  note text,
  kind text not null default 'article',
  section text,
  done_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists links_date_idx on links(date);

alter table days enable row level security;
alter table links enable row level security;
