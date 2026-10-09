-- Réorganisation du 9 octobre 2026 : collections plus petites, Drakeoz & Co, streamers ajoutés.
-- Déjà appliqué en base via l'API ; ce fichier sert à une réinstallation propre, après cards-politique.sql.

insert into collections (slug, name, description, emoji, position) values
('matinale', 'Drakeoz & Co', 'Le stream, son chat, ses rituels et ses running gags.', '☕', 1),
('streamers-politique', 'Streamers', 'Celles et ceux qui font de la politique en direct sur Twitch.', '🎙️', 2),
('emissions-twitch', 'Émissions Twitch', 'Les rendez-vous politiques du live, et les memes qui vont avec.', '📡', 3),
('institutions', 'Les Institutions', 'Palais, conseils et cours : là où ça se décide, ou pas.', '🏛️', 4),
('constitution', 'L''Arsenal constitutionnel', 'Les articles qu''on sort quand ça coince.', '📜', 5),
('medias', 'Le Cirque médiatique', 'Sondages, dépêches, plateaux : la machine à actualité.', '📺', 6),
('quotidiens', 'Les Quotidiens', 'Ceux qui sortent tous les jours, papier ou pas.', '📰', 7),
('hebdos', 'Hebdos et satire', 'Une semaine de recul, parfois un canard.', '🗞️', 8),
('ecrans-ondes', 'Écrans, ondes et pure players', 'Télé, radio et médias nés en ligne.', '📻', 9),
('gauche', 'Partis de gauche', 'De la social-démocratie à la révolution, en passant par la primaire.', '🌹', 10),
('centre', 'Partis du centre', 'Le bloc présidentiel et ses satellites.', '🟡', 11),
('droites', 'Partis de droite et d''extrême droite', 'De la droite républicaine au RN.', '🔷', 12),
('presidents-pm', 'Présidents et Premiers ministres', 'Ceux qui ont eu, ont, ou veulent le bureau d''angle.', '🏰', 13),
('tetes-de-parti', 'Têtes de parti', 'Les patrons et patronnes des appareils.', '🎯', 14),
('hemicycle', 'L''Hémicycle', 'Perchoirs, groupes et francs-tireurs du Parlement.', '🪑', 15)
on conflict (slug) do update set name = excluded.name, description = excluded.description, emoji = excluded.emoji, position = excluded.position;

update cards set collection_slug = 'emissions-twitch' where slug in ('backseat','ostpolitik','au-poste','la-matinee-est-tienne','categorie-politique-twitch','le-clip-sorti-du-contexte','le-react');
update cards set collection_slug = 'quotidiens' where slug in ('le-monde','le-figaro','liberation','les-echos','la-croix','l-humanite','le-parisien','l-equipe','ouest-france');
update cards set collection_slug = 'hebdos' where slug in ('le-canard-enchaine','charlie-hebdo','marianne','l-obs','le-point','l-express','valeurs-actuelles','politis');
update cards set collection_slug = 'ecrans-ondes' where slug in ('mediapart','blast','streetpress','arret-sur-images','bfmtv','cnews','france-inter');
update cards set collection_slug = 'gauche' where slug in ('la-france-insoumise','parti-socialiste','les-ecologistes','parti-communiste','place-publique','generation-s','lutte-ouvriere','npa','nouveau-front-populaire');
update cards set collection_slug = 'centre' where slug in ('renaissance','horizons','modem','bloc-central');
update cards set collection_slug = 'droites' where slug in ('rassemblement-national','les-republicains','udi','reconquete','udr','debout-la-france');
update cards set collection_slug = 'presidents-pm' where slug in ('emmanuel-macron','sebastien-lecornu','francois-bayrou','edouard-philippe','gabriel-attal','dominique-de-villepin','francois-hollande','nicolas-sarkozy');
update cards set collection_slug = 'tetes-de-parti' where slug in ('marine-le-pen','jordan-bardella','jean-luc-melenchon','raphael-glucksmann','bruno-retailleau','olivier-faure','marine-tondelier','fabien-roussel','eric-ciotti','eric-zemmour','laurent-wauquiez','manuel-bompard');
update cards set collection_slug = 'hemicycle' where slug in ('yael-braun-pivet','gerard-larcher','mathilde-panot','francois-ruffin','sandrine-rousseau','clementine-autain','marion-marechal','segolene-royal');
update cards set collection_slug = 'matinale' where slug = 'drakeoz';

insert into cards (slug, name, subtitle, category, faction, rarity, flavor, source_url, stats, collection_slug, active) values
('clemovitch', 'Clément Viktorovitch', 'Clemovitch, Le Café Rhétorique', 'streamer', 'Twitch politique', 'epique', 'Politiste, chroniqueur, et le seul à décortiquer un débat au mot près, trois fois par semaine.', 'https://www.twitch.tv/clemovitch', '{"Rhétorique": 99, "Lundi, mercredi, vendredi": 3}', 'streamers-politique', true),
('mathieu-burgalassi', 'Mathieu Burgalassi', 'Pop culture, politique, société', 'streamer', 'Twitch politique', 'rare', 'Un club de lecture sur Twitch, Bourdieu en invité permanent.', 'https://www.twitch.tv/mathieuburgalassi', '{"Club de lecture": 90, "Bourdieu": 100}', 'streamers-politique', true),
('hugo-au-perchoir', 'Hugo Couturier', 'Hugo au Perchoir', 'streamer', 'Twitch politique', 'rare', 'En direct de l''Assemblée jusqu''à minuit. Après la dissolution, 120 députés sont passés sur sa chaîne.', 'https://www.twitch.tv/hugoauperchoir', '{"Députés reçus": 120, "Heures à l''Assemblée": 95}', 'streamers-politique', true),
('hugodecrypte', 'Hugo Travers', 'HugoDécrypte', 'streamer', 'YouTube et Twitch', 'epique', 'L''actu des moins de 25 ans, du JT aux interviews de chefs d''État.', 'https://www.twitch.tv/hugodecrypte', '{"Équipe": 20, "Audience jeune": 98}', 'streamers-politique', true),
('le-cafe-rhetorique', 'Le Café Rhétorique', 'L''émission de Clemovitch', 'emission', 'Twitch politique', 'rare', 'Un débat, un café, et chaque figure de style passée au crible.', 'https://www.twitch.tv/clemovitch', '{"Figures de style": 95}', 'emissions-twitch', true),
('mashup', 'Mashup', 'L''émission d''HugoDécrypte', 'emission', 'Twitch actu', 'rare', 'Deux heures d''actu, de débats et d''invités, depuis janvier 2022.', 'https://www.twitch.tv/hugodecrypte', '{"Durée": 2, "Invités": 85}', 'emissions-twitch', true),
('legi-stream', 'Légi''Stream', 'LCP sur Twitch', 'emission', 'Twitch politique', 'commune', 'La chaîne parlementaire a fini par venir sur Twitch, et ça marche.', 'https://lcp.fr/programmes/legi-stream-320972', '{"Parlement": 100, "Mercredi": 1}', 'emissions-twitch', true)
on conflict (slug) do nothing;

delete from collection_rewards where collection_slug in ('presse', 'partis', 'figures');
delete from collections where slug in ('presse', 'partis', 'figures');
