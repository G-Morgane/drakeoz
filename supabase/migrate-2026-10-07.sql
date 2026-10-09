-- À exécuter si schema.sql avait été collé avant le 7 octobre 2026 (sections, types, coches, top départ).
alter table links add column if not exists kind text not null default 'article';
alter table links add column if not exists section text;
alter table links add column if not exists done_at timestamptz;
alter table days add column if not exists started_at timestamptz;
