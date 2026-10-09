-- Jeu de cartes : comptes joueurs, cartes, boosters, échanges.
-- À exécuter dans l'éditeur SQL Supabase après schema.sql.
-- Tout passe par le serveur (clé service) : RLS activée sans policy = fermé côté client.

-- Profil créé automatiquement à l'inscription (pseudo dans les métadonnées d'inscription).
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  twitch_login text unique,
  link_code text unique,
  created_at timestamptz not null default now()
);
create index if not exists profiles_username_lower_idx on profiles (lower(username));

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'joueur_' || left(new.id::text, 6)));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Définitions de cartes.
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subtitle text,
  category text not null check (category in ('politique', 'streamer', 'evenement', 'institution', 'meme')),
  faction text,
  rarity text not null check (rarity in ('commune', 'rare', 'epique', 'legendaire')),
  image_url text,
  flavor text,
  source_url text,
  stats jsonb not null default '{}'::jsonb,
  set_code text not null default 's1',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Exemplaires possédés.
create table if not exists card_instances (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  serial integer not null,
  obtained_via text not null default 'daily',
  obtained_at timestamptz not null default now()
);
create index if not exists card_instances_owner_idx on card_instances(owner_id);
create index if not exists card_instances_card_idx on card_instances(card_id);

-- Boosters accordés (un quotidien par jour, un de présence en live par jour, un par quiz...).
create table if not exists pack_grants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('daily', 'live', 'quiz', 'gift')),
  day date not null default current_date,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  unique (profile_id, kind, day)
);

-- Échanges entre joueurs.
create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references profiles(id) on delete cascade,
  to_id uuid not null references profiles(id) on delete cascade,
  offered uuid[] not null,
  requested uuid[] not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists trades_to_idx on trades(to_id, status);
create index if not exists trades_from_idx on trades(from_id, status);

-- Acceptation atomique : vérifie que chacun possède encore ce qu'il a mis, puis échange.
create or replace function accept_trade(p_trade uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t trades%rowtype;
begin
  select * into t from trades where id = p_trade for update;
  if not found or t.status <> 'pending' then raise exception 'Échange introuvable ou déjà clos'; end if;
  if t.to_id <> p_user then raise exception 'Cet échange ne vous est pas adressé'; end if;
  if (select count(*) from card_instances where id = any(t.offered) and owner_id = t.from_id) <> cardinality(t.offered)
    then raise exception 'Le joueur ne possède plus les cartes offertes'; end if;
  if (select count(*) from card_instances where id = any(t.requested) and owner_id = t.to_id) <> cardinality(t.requested)
    then raise exception 'Vous ne possédez plus les cartes demandées'; end if;
  update card_instances set owner_id = t.to_id, obtained_via = 'trade', obtained_at = now() where id = any(t.offered);
  update card_instances set owner_id = t.from_id, obtained_via = 'trade', obtained_at = now() where id = any(t.requested);
  update trades set status = 'accepted', resolved_at = now() where id = p_trade;
  -- Les autres échanges en attente qui portaient sur ces cartes tombent.
  update trades set status = 'cancelled', resolved_at = now()
    where status = 'pending' and id <> p_trade
      and (offered && (t.offered || t.requested) or requested && (t.offered || t.requested));
end $$;

alter table profiles enable row level security;
alter table cards enable row level security;
alter table card_instances enable row level security;
alter table pack_grants enable row level security;
alter table trades enable row level security;

-- Cartes de départ, neutres : institutions, événements, le stream. Les personnalités, c'est Drakeoz qui les écrit.
insert into cards (slug, name, subtitle, category, faction, rarity, flavor, source_url, stats) values
('drakeoz', 'Drakeoz', 'Le matin, tous les matins', 'streamer', 'La matinale', 'legendaire', 'Un café, une revue de presse, et le chat qui s''emballe.', 'https://www.twitch.tv/drakeoz_', '{"Café": 99, "Sources": 95, "Ponctualité": 88}'),
('le-chat', 'Le Chat', 'Juge, jury et bourreau', 'meme', 'La matinale', 'epique', 'A toujours raison. Surtout quand il a tort.', null, '{"Vitesse": 97, "Nuance": 12, "Emotes": 100}'),
('la-revue-de-presse', 'La Revue de presse', 'Rituel du matin', 'evenement', 'La matinale', 'rare', 'Six onglets ouverts, un seul sera lu jusqu''au bout.', null, '{"Onglets": 42, "Rigueur": 80}'),
('la-source', 'La Source', '« C''est quoi ta source ? »', 'meme', 'La matinale', 'commune', 'Le site que tu es en train de lire.', null, '{"Fiabilité": 90}'),
('assemblee-nationale', 'Assemblée nationale', 'Palais Bourbon', 'institution', 'République', 'rare', '577 sièges, rarement tous occupés le vendredi.', 'https://www.assemblee-nationale.fr', '{"Sièges": 577, "Décibels": 85}'),
('senat', 'Sénat', 'Palais du Luxembourg', 'institution', 'République', 'rare', 'La chambre où le temps s''écoule plus lentement.', 'https://www.senat.fr', '{"Sièges": 348, "Patience": 95}'),
('conseil-constitutionnel', 'Conseil constitutionnel', 'Les Sages', 'institution', 'République', 'epique', 'Le dernier mot, en toge.', 'https://www.conseil-constitutionnel.fr', '{"Membres": 9, "Censure": 70}'),
('elysee', 'Élysée', 'Palais présidentiel', 'institution', 'République', 'epique', 'Rue du Faubourg-Saint-Honoré, le bureau d''angle.', 'https://www.elysee.fr', '{"Pouvoir": 90, "Dorures": 100}'),
('matignon', 'Matignon', 'Hôtel du Premier ministre', 'institution', 'République', 'rare', 'Le jardin est magnifique, le bail est court.', 'https://www.gouvernement.fr', '{"Stabilité": 25, "Jardin": 95}'),
('article-49-3', 'Article 49.3', 'Engagement de responsabilité', 'evenement', 'Constitution', 'epique', 'Quand le débat devient facultatif.', 'https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur', '{"Efficacité": 95, "Popularité": 10}'),
('motion-de-censure', 'Motion de censure', 'Article 49.2', 'evenement', 'Constitution', 'rare', 'Il faut 289 voix. Faites les comptes.', null, '{"Seuil": 289, "Suspense": 80}'),
('dissolution', 'Dissolution', 'Article 12', 'evenement', 'Constitution', 'legendaire', 'On remet les compteurs à zéro. Enfin, on essaie.', null, '{"Surprise": 100, "Regret": 75}'),
('projet-de-loi-de-finances', 'Projet de loi de finances', 'Le budget', 'evenement', 'Bercy', 'commune', 'Chaque automne, les mêmes chiffres, les mêmes cris.', null, '{"Pages": 900, "Lecture": 5}'),
('cour-des-comptes', 'Cour des comptes', 'Rue Cambon', 'institution', 'République', 'rare', 'Les rapports que tout le monde cite et que personne ne lit.', 'https://www.ccomptes.fr', '{"Rapports": 80, "Écoute": 30}'),
('conseil-d-etat', 'Conseil d''État', 'Palais-Royal', 'institution', 'République', 'rare', 'Conseille le gouvernement, puis le juge.', 'https://www.conseil-etat.fr', '{"Autorité": 85}'),
('le-sondage', 'Le Sondage', 'Marge d''erreur comprise', 'meme', 'Médias', 'commune', '1 004 personnes représentatives de votre angoisse.', null, '{"Échantillon": 1004, "Certitude": 40}'),
('la-depeche-afp', 'La Dépêche AFP', 'Urgent', 'meme', 'Médias', 'commune', 'Trois lignes qui lancent une journée.', 'https://www.afp.com', '{"Vitesse": 95, "Adjectifs": 5}'),
('le-20h', 'Le 20h', 'Grand-messe', 'meme', 'Médias', 'commune', 'Le moment où la journée politique se résume en douze minutes.', null, '{"Audience": 70, "Nuance": 35}'),
('la-manif', 'La Manif', 'Rendez-vous place de la République', 'evenement', 'Rue', 'commune', 'Les chiffres de la préfecture et ceux des organisateurs ne se sont jamais rencontrés.', null, '{"Pancartes": 85, "Comptage": 2}'),
('le-live', 'Le Live', 'En direct maintenant', 'evenement', 'La matinale', 'commune', 'Le seul moment où tout peut arriver.', 'https://www.twitch.tv/drakeoz_', '{"Imprévu": 90}'),
('le-timecode', 'Le Timecode', '1:12:05', 'meme', 'La matinale', 'rare', 'Pour retrouver le moment exact où ça a dérapé.', null, '{"Précision": 100}'),
('le-mod', 'Le Modo', 'Gardien du chat', 'streamer', 'La matinale', 'rare', 'Bannit plus vite que son ombre.', null, '{"Réflexes": 92, "Sommeil": 20}'),
('journal-officiel', 'Journal officiel', 'Le texte qui compte', 'institution', 'République', 'commune', 'Publié la nuit, lu par personne, applicable à tous.', 'https://www.legifrance.gouv.fr', '{"Autorité": 100, "Lisibilité": 15}'),
('question-au-gouvernement', 'Questions au gouvernement', 'Mardi et mercredi, 15h', 'evenement', 'Assemblée', 'commune', 'Deux minutes de question, deux minutes de non-réponse.', null, '{"Théâtre": 90, "Réponses": 10}'),
('la-primaire', 'La Primaire', 'Désignation du candidat', 'evenement', 'Partis', 'rare', 'Tout le monde est d''accord, jusqu''au résultat.', null, '{"Unité": 30, "Débats": 85}'),
('le-debat', 'Le Débat', 'Plateau, pupitres, chrono', 'evenement', 'Médias', 'commune', 'Le temps de parole est égal, l''écoute non.', null, '{"Interruptions": 95}'),
('bercy', 'Bercy', 'Ministère de l''Économie', 'institution', 'République', 'rare', 'Le bâtiment a les pieds dans la Seine et les mains sur le budget.', 'https://www.economie.gouv.fr', '{"Chiffres": 100, "Optimisme": 40}'),
('la-cnil', 'CNIL', 'Protection des données', 'institution', 'République', 'commune', 'Sait ce que vous avez accepté sans lire.', 'https://www.cnil.fr', '{"Vigilance": 85}'),
('le-raid-twitch', 'Le Raid', 'Fin de stream', 'evenement', 'Twitch', 'commune', 'Trois cents personnes débarquent chez quelqu''un qui ne s''y attendait pas.', null, '{"Chaos": 80, "Bienveillance": 70}'),
('la-pause-cafe', 'La Pause café', 'BRB', 'meme', 'La matinale', 'commune', 'Deux minutes. Toujours cinq.', null, '{"Durée": 5, "Nécessité": 100}')
on conflict (slug) do nothing;
