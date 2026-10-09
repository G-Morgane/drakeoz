-- Collections façon Pokédex : chaque carte appartient à une collection, compléter une collection donne un booster cadeau.
-- À exécuter après game.sql.

create table if not exists collections (
  slug text primary key,
  name text not null,
  description text,
  emoji text,
  position integer not null default 0
);

alter table cards add column if not exists collection_slug text references collections(slug);

insert into collections (slug, name, description, emoji, position) values
('matinale', 'La Matinale', 'Le stream, son chat, ses rituels et ses running gags.', '☕', 1),
('streamers-politique', 'Streamers politique FR', 'Celles et ceux qui font de la politique en direct sur Twitch. Fiches en brouillon : Drakeoz valide avant mise en circulation.', '🎙️', 2),
('institutions', 'Les Institutions', 'Palais, conseils et cours : là où ça se décide, ou pas.', '🏛️', 3),
('constitution', 'L''Arsenal constitutionnel', 'Les articles qu''on sort quand ça coince.', '📜', 4),
('medias', 'Le Cirque médiatique', 'Sondages, dépêches, plateaux : la machine à actualité.', '📺', 5)
on conflict (slug) do nothing;

-- Rattachement des cartes de départ.
update cards set collection_slug = 'matinale' where collection_slug is null and slug in ('drakeoz','le-chat','la-revue-de-presse','la-source','le-live','le-timecode','le-mod','la-pause-cafe','le-raid-twitch');
update cards set collection_slug = 'institutions' where collection_slug is null and slug in ('assemblee-nationale','senat','conseil-constitutionnel','elysee','matignon','cour-des-comptes','conseil-d-etat','bercy','la-cnil','journal-officiel');
update cards set collection_slug = 'constitution' where collection_slug is null and slug in ('article-49-3','motion-de-censure','dissolution','question-au-gouvernement','projet-de-loi-de-finances');
update cards set collection_slug = 'medias' where collection_slug is null and slug in ('le-sondage','la-depeche-afp','le-20h','le-debat','la-manif','la-primaire');

-- Streamers politique : BROUILLONS (active = false), à relire et activer depuis /admin/cartes.
-- Textes volontairement bienveillants, source = la chaîne. Drakeoz complète la liste.
insert into cards (slug, name, subtitle, category, faction, rarity, flavor, source_url, stats, collection_slug, active) values
('jean-massiet', 'Jean Massiet', 'Backseat', 'streamer', 'Twitch politique', 'epique', 'A fait entrer les questions au gouvernement dans le chat.', 'https://www.twitch.tv/jeanmassiet', '{"Pédagogie": 92, "Invités": 88}', 'streamers-politique', true),
('usul', 'Usul', 'Ostpolitik', 'streamer', 'Twitch politique', 'epique', 'La voix posée, le fond qui pique.', 'https://www.twitch.tv/usul', '{"Analyse": 90, "Calme": 95}', 'streamers-politique', true),
('samuel-etienne', 'Samuel Étienne', 'La Matinée est tienne', 'streamer', 'Twitch actu', 'rare', 'Lit la presse en direct avant tout le monde, et avec le sourire.', 'https://www.twitch.tv/samueletienne', '{"Revue de presse": 94, "Bonne humeur": 90}', 'streamers-politique', true),
('bolchegeek', 'Bolchegeek', 'Pop culture et politique', 'streamer', 'Twitch politique', 'rare', 'Quand le cinéma et la lutte des classes passent la même soirée.', 'https://www.twitch.tv/bolchegeek', '{"Références": 93, "Marathon": 85}', 'streamers-politique', true)
on conflict (slug) do nothing;

update cards set collection_slug = 'streamers-politique' where slug = 'drakeoz';

-- Récompense de complétion : un booster cadeau, une seule fois par collection et par joueur.
create table if not exists collection_rewards (
  profile_id uuid not null references profiles(id) on delete cascade,
  collection_slug text not null references collections(slug) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (profile_id, collection_slug)
);
alter table collections enable row level security;
alter table collection_rewards enable row level security;

-- Plusieurs cadeaux le même jour doivent être possibles : l'unicité ne vaut que pour daily et live.
alter table pack_grants drop constraint if exists pack_grants_profile_id_kind_day_key;
create unique index if not exists pack_grants_daily_live_idx on pack_grants (profile_id, kind, day) where kind in ('daily', 'live');
