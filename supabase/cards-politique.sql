-- Cartes « politique française » : presse, partis, grandes figures, et la scène Twitch politique.
-- À exécuter après collections.sql.
--
-- Règle : les ORGANISATIONS et les ÉMISSIONS sont actives (en circulation).
-- Les PERSONNES réelles sont créées en brouillon (active = false) : Drakeoz relit et active depuis /admin/cartes.
-- Textes satiriques mais jamais insultants ; chaque carte renvoie vers une source.

-- Nouvelles catégories.
alter table cards drop constraint if exists cards_category_check;
alter table cards add constraint cards_category_check
  check (category in ('politique', 'streamer', 'evenement', 'institution', 'meme', 'media', 'parti', 'emission'));

insert into collections (slug, name, description, emoji, position) values
('presse', 'La Presse', 'Quotidiens, hebdos et pure players : ceux qu''on cite, ceux qu''on conteste.', '📰', 6),
('partis', 'Les Partis', 'De l''extrême gauche à l''extrême droite, tout l''échiquier.', '🗳️', 7),
('figures', 'Les Grandes Figures', 'Celles et ceux qui font la politique française en 2026.', '🎯', 8)
on conflict (slug) do nothing;

update collections set description = 'Les émissions et les streamers qui font de la politique en direct sur Twitch.' where slug = 'streamers-politique';

-- ---------------------------------------------------------------------------
-- TWITCH POLITIQUE : émissions (actives) et streamers (brouillons)
-- ---------------------------------------------------------------------------
insert into cards (slug, name, subtitle, category, faction, rarity, flavor, source_url, stats, collection_slug, active) values
('backseat', 'Backseat', 'L''émission de Jean Massiet', 'emission', 'Twitch politique', 'epique', 'Depuis juin 2021, les invités politiques passent sur le gril du chat.', 'https://www.twitch.tv/jeanmassiet', '{"Invités": 90, "Questions du chat": 95}', 'streamers-politique', true),
('ostpolitik', 'Ostpolitik', 'La matinale d''Usul', 'emission', 'Twitch politique', 'epique', 'Du mardi au jeudi dès 7h : l''actu avant le café, ou pendant.', 'https://www.twitch.tv/ostpolitik', '{"Heure de réveil": 7, "Analyse": 90}', 'streamers-politique', true),
('au-poste', 'Au Poste', 'Le média de David Dufresne', 'emission', 'Twitch politique', 'rare', 'Quand la rue manifeste, Au Poste lance le multiplex.', 'https://auposte.media', '{"Multiplex": 95, "Garde à vue": 0}', 'streamers-politique', true),
('la-matinee-est-tienne', 'La Matinée est tienne', 'Revue de presse de Samuel Étienne', 'emission', 'Twitch actu', 'rare', 'Un journaliste de France Télé qui lit la presse avec le chat. Le format a fait école.', 'https://www.twitch.tv/samueletienne', '{"Journaux lus": 12, "Sourire": 95}', 'streamers-politique', true),
('categorie-politique-twitch', 'La Catégorie Politique', 'Un onglet qui n''existait pas', 'emission', 'Twitch', 'commune', 'Twitch a longtemps refusé la politique. Puis a fini par lui donner son rayon.', 'https://www.twitch.tv/directory/category/politics?lang=fr', '{"Chaînes": 60, "Modération": 70}', 'streamers-politique', true),
('le-clip-sorti-du-contexte', 'Le Clip sorti du contexte', 'Trente secondes sur trois heures', 'meme', 'Twitch', 'rare', 'Tourne sur X avant même la fin du live. Le contexte arrive le lendemain, en replay.', null, '{"Viralité": 98, "Contexte": 5}', 'streamers-politique', true),
('le-react', 'Le React', 'Pause, commentaire, reprise', 'meme', 'Twitch', 'commune', 'Regarder un débat en direct, mais avec quelqu''un qui dit tout haut ce que le chat pense tout bas.', null, '{"Pauses": 40, "Bonne foi": 60}', 'streamers-politique', true),
('david-dufresne', 'David Dufresne', 'Au Poste', 'streamer', 'Twitch politique', 'rare', 'Journaliste, documentariste, et pilote du multiplex des manifs.', 'https://auposte.media', '{"Terrain": 92, "Archives": 88}', 'streamers-politique', true)
on conflict (slug) do nothing;

update cards set category = 'streamer' where slug in ('jean-massiet', 'usul', 'samuel-etienne', 'bolchegeek') and category <> 'streamer';

-- ---------------------------------------------------------------------------
-- LA PRESSE (organisations, actives). Diffusions ACPM 2025 arrondies.
-- ---------------------------------------------------------------------------
insert into cards (slug, name, subtitle, category, faction, rarity, flavor, source_url, stats, collection_slug, active) values
('le-monde', 'Le Monde', 'Quotidien du soir, lu le matin', 'media', 'Presse quotidienne', 'rare', 'Premier quotidien national. Le « selon nos informations » qui fait trembler les cabinets.', 'https://www.lemonde.fr', '{"Diffusion": 559000, "Décodeurs": 90}', 'presse', true),
('le-figaro', 'Le Figaro', 'Depuis 1826', 'media', 'Presse quotidienne', 'rare', 'Le plus ancien quotidien français encore debout. Et il tient à ce qu''on le sache.', 'https://www.lefigaro.fr', '{"Diffusion": 387000, "Ancienneté": 200}', 'presse', true),
('liberation', 'Libération', 'Né en 1973', 'media', 'Presse quotidienne', 'rare', 'Les unes qui claquent, les jeux de mots qui divisent la rédaction.', 'https://www.liberation.fr', '{"Diffusion": 118000, "Jeux de mots": 95}', 'presse', true),
('les-echos', 'Les Échos', 'Le quotidien de l''économie', 'media', 'Presse quotidienne', 'commune', 'Le journal saumon. Lu à Bercy, cité partout.', 'https://www.lesechos.fr', '{"Diffusion": 139000, "Couleur saumon": 100}', 'presse', true),
('la-croix', 'La Croix', 'Quotidien catholique', 'media', 'Presse quotidienne', 'commune', 'Calme, posé, et plus lu qu''on ne le croit.', 'https://www.la-croix.com', '{"Diffusion": 75000, "Sérénité": 95}', 'presse', true),
('l-humanite', 'L''Humanité', 'Fondé par Jaurès en 1904', 'media', 'Presse quotidienne', 'rare', 'Le quotidien qui survit à tout, y compris aux prédictions de sa fin.', 'https://www.humanite.fr', '{"Diffusion": 39000, "Résistance": 100}', 'presse', true),
('le-parisien', 'Le Parisien', 'Aujourd''hui en France', 'media', 'Presse quotidienne', 'commune', 'Les faits divers, les transports, et le sondage politique du lundi.', 'https://www.leparisien.fr', '{"Faits divers": 90, "RER": 85}', 'presse', true),
('mediapart', 'Mediapart', 'Pure player d''investigation', 'media', 'Presse en ligne', 'epique', 'Sans publicité, sans actionnaire, avec des révélations qui font tomber des ministres.', 'https://www.mediapart.fr', '{"Révélations": 95, "Publicité": 0}', 'presse', true),
('le-canard-enchaine', 'Le Canard enchaîné', 'Hebdomadaire satirique', 'media', 'Presse satirique', 'legendaire', 'Paraît le mercredi. Fait transpirer dès le mardi soir.', 'https://www.lecanardenchaine.fr', '{"Mares": 100, "Site web": 10}', 'presse', true),
('charlie-hebdo', 'Charlie Hebdo', 'Hebdomadaire satirique', 'media', 'Presse satirique', 'epique', 'Dessine ce que d''autres n''osent pas écrire.', 'https://charliehebdo.fr', '{"Crayons": 100, "Nuance": 20}', 'presse', true),
('marianne', 'Marianne', 'Hebdomadaire', 'media', 'Presse hebdomadaire', 'commune', 'Contre tout le monde, à tour de rôle.', 'https://www.marianne.net', '{"Contrepied": 90}', 'presse', true),
('l-obs', 'L''Obs', 'Hebdomadaire', 'media', 'Presse hebdomadaire', 'commune', 'L''hebdo de la gauche qui lit encore des hebdos.', 'https://www.nouvelobs.com', '{"Dossiers": 80}', 'presse', true),
('le-point', 'Le Point', 'Hebdomadaire', 'media', 'Presse hebdomadaire', 'commune', 'Les classements, les unes qui piquent, les lycées.', 'https://www.lepoint.fr', '{"Classements": 95}', 'presse', true),
('l-express', 'L''Express', 'Hebdomadaire', 'media', 'Presse hebdomadaire', 'commune', 'L''hebdo qui a inventé le newsmagazine à la française.', 'https://www.lexpress.fr', '{"Ancienneté": 70}', 'presse', true),
('valeurs-actuelles', 'Valeurs actuelles', 'Hebdomadaire', 'media', 'Presse hebdomadaire', 'commune', 'À droite de la droite, et fier de l''écrire en une.', 'https://www.valeursactuelles.com', '{"Unes polémiques": 90}', 'presse', true),
('politis', 'Politis', 'Hebdomadaire', 'media', 'Presse hebdomadaire', 'commune', 'À gauche de la gauche, en coopérative.', 'https://www.politis.fr', '{"Coopérative": 100}', 'presse', true),
('blast', 'Blast', 'Média en ligne', 'media', 'Presse en ligne', 'rare', 'Denis Robert aux commandes, vidéos longues, souffle court pour les puissants.', 'https://www.blast-info.fr', '{"Vidéos": 90, "Souffle": 95}', 'presse', true),
('streetpress', 'StreetPress', 'Média en ligne', 'media', 'Presse en ligne', 'rare', 'Enquêtes de terrain sur l''extrême droite, la police et les quartiers.', 'https://www.streetpress.com', '{"Terrain": 95}', 'presse', true),
('l-equipe', 'L''Équipe', 'Quotidien sportif', 'media', 'Presse quotidienne', 'commune', 'Le seul quotidien que lisent les gens qui ne lisent pas de quotidien.', 'https://www.lequipe.fr', '{"Visites": 194000000, "Politique": 5}', 'presse', true),
('ouest-france', 'Ouest-France', 'Premier quotidien de France', 'media', 'Presse régionale', 'rare', 'Plus diffusé que tous les nationaux. Depuis Rennes.', 'https://www.ouest-france.fr', '{"Diffusion": 600000, "Régions": 100}', 'presse', true),
('bfmtv', 'BFMTV', 'Première chaîne d''info', 'media', 'Télévision', 'rare', 'Le bandeau rouge qui ne s''arrête jamais.', 'https://www.bfmtv.com', '{"Bandeau rouge": 100, "Pause": 0}', 'presse', true),
('cnews', 'CNews', 'Chaîne d''info', 'media', 'Télévision', 'rare', 'Les débats où tout le monde est d''accord, sauf l''invité.', 'https://www.cnews.fr', '{"Débats": 95, "Contradiction": 30}', 'presse', true),
('france-inter', 'France Inter', 'Première radio de France', 'media', 'Radio', 'rare', 'La matinale la plus écoutée du pays, et la plus commentée à droite.', 'https://www.radiofrance.fr/franceinter', '{"Audience": 95, "Humoristes": 90}', 'presse', true),
('arret-sur-images', 'Arrêt sur images', 'Critique des médias', 'media', 'Presse en ligne', 'commune', 'Le média qui regarde les médias regarder la politique.', 'https://www.arretsurimages.net', '{"Méta": 100}', 'presse', true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- LES PARTIS (organisations, actives). Directions au 9 octobre 2026.
-- Rareté neutre : rare = groupe au Parlement, commune = sans groupe. Jamais épique ni légendaire.
-- ---------------------------------------------------------------------------
insert into cards (slug, name, subtitle, category, faction, rarity, flavor, source_url, stats, collection_slug, active) values
('rassemblement-national', 'Rassemblement national', 'Président : Jordan Bardella', 'parti', 'Extrême droite', 'rare', 'En tête des sondages 2027. Le reste de l''échiquier se compte en points d''écart.', 'https://fr.wikipedia.org/wiki/Rassemblement_national', '{"Sondages": 33, "Dédiabolisation": 70}', 'partis', true),
('la-france-insoumise', 'La France insoumise', 'Fondateur : Jean-Luc Mélenchon', 'parti', 'Gauche radicale', 'rare', 'Pas de congrès, pas de carte, mais un mouvement qui remplit les salles.', 'https://fr.wikipedia.org/wiki/La_France_insoumise', '{"Mobilisation": 92, "Congrès": 0}', 'partis', true),
('parti-socialiste', 'Parti socialiste', 'Premier secrétaire : Olivier Faure', 'parti', 'Gauche', 'rare', 'Revenu de loin. Organise sa primaire pour 2027 avec cinq candidats.', 'https://fr.wikipedia.org/wiki/Parti_socialiste_(France)', '{"Primaires": 5, "Résilience": 85}', 'partis', true),
('les-ecologistes', 'Les Écologistes', 'Secrétaire nationale : Marine Tondelier', 'parti', 'Écologie', 'rare', 'Ex-EELV. Nouveau nom, mêmes débats sur le nom.', 'https://fr.wikipedia.org/wiki/Les_%C3%89cologistes', '{"Renommages": 3, "Vélo": 100}', 'partis', true),
('parti-communiste', 'Parti communiste français', 'Secrétaire national : Fabien Roussel', 'parti', 'Gauche', 'rare', 'Fondé en 1920. A connu toutes les Républiques depuis la troisième.', 'https://fr.wikipedia.org/wiki/Parti_communiste_fran%C3%A7ais', '{"Ancienneté": 106, "Fête de l''Huma": 100}', 'partis', true),
('renaissance', 'Renaissance', 'Secrétaire général : Gabriel Attal', 'parti', 'Centre', 'rare', 'Ex-En Marche, ex-LREM. Le parti du président, qui cherche son après-président.', 'https://fr.wikipedia.org/wiki/Renaissance_(parti)', '{"Renommages": 2, "Après-2027": 40}', 'partis', true),
('les-republicains', 'Les Républicains', 'Président : Bruno Retailleau', 'parti', 'Droite', 'rare', 'Héritier de l''UMP. A survécu à une tentative d''alliance avec le RN en 2024.', 'https://fr.wikipedia.org/wiki/Les_R%C3%A9publicains', '{"Scissions": 2, "Héritage": 80}', 'partis', true),
('horizons', 'Horizons', 'Président : Édouard Philippe', 'parti', 'Centre droit', 'rare', 'Un parti construit pour une seule date : avril 2027.', 'https://fr.wikipedia.org/wiki/Horizons_(parti_politique)', '{"Horizon": 2027, "Patience": 90}', 'partis', true),
('modem', 'Mouvement démocrate', 'Président : François Bayrou', 'parti', 'Centre', 'rare', 'Le centre depuis 2007. Son fondateur a fini par avoir Matignon, neuf mois.', 'https://fr.wikipedia.org/wiki/Mouvement_d%C3%A9mocrate_(France)', '{"Centre": 100, "Matignon": 9}', 'partis', true),
('udi', 'UDI', 'Union des démocrates et indépendants', 'parti', 'Centre droit', 'rare', 'Le centre droit qui existe encore, demandez au Sénat.', 'https://fr.wikipedia.org/wiki/Union_des_d%C3%A9mocrates_et_ind%C3%A9pendants', '{"Sénateurs": 70}', 'partis', true),
('reconquete', 'Reconquête', 'Président : Éric Zemmour', 'parti', 'Extrême droite', 'commune', 'Né pour 2022. Cherche encore sa place à côté du RN.', 'https://fr.wikipedia.org/wiki/Reconqu%C3%AAte_(parti_politique)', '{"Polémiques": 95, "Élus": 10}', 'partis', true),
('udr', 'Union des droites pour la République', 'Président : Éric Ciotti', 'parti', 'Droite', 'rare', 'Le parti né d''une porte fermée à clé en juin 2024.', 'https://fr.wikipedia.org/wiki/Union_des_droites_pour_la_R%C3%A9publique', '{"Serrure": 100}', 'partis', true),
('debout-la-france', 'Debout la France', 'Président : Nicolas Dupont-Aignan', 'parti', 'Droite souverainiste', 'commune', 'Souverainiste, et fidèle à son fondateur depuis 2008.', 'https://fr.wikipedia.org/wiki/Debout_la_France', '{"Fidélité": 100}', 'partis', true),
('place-publique', 'Place publique', 'Fondateur : Raphaël Glucksmann', 'parti', 'Centre gauche', 'commune', 'Petit parti, grand score aux européennes de 2024.', 'https://fr.wikipedia.org/wiki/Place_publique', '{"Européennes": 14, "Adhérents": 20}', 'partis', true),
('generation-s', 'Génération.s', 'Fondé par Benoît Hamon', 'parti', 'Gauche', 'commune', 'Le point dans le nom est volontaire.', 'https://fr.wikipedia.org/wiki/G%C3%A9n%C3%A9ration.s', '{"Point": 1}', 'partis', true),
('lutte-ouvriere', 'Lutte ouvrière', 'Porte-parole : Nathalie Arthaud', 'parti', 'Extrême gauche', 'commune', 'Présent à chaque présidentielle depuis 1974. Le programme n''a pas bougé, c''est le principe.', 'https://fr.wikipedia.org/wiki/Lutte_ouvri%C3%A8re', '{"Constance": 100}', 'partis', true),
('npa', 'Nouveau Parti anticapitaliste', 'Anticapitaliste', 'parti', 'Extrême gauche', 'commune', 'A connu plus de scissions que de campagnes.', 'https://fr.wikipedia.org/wiki/Nouveau_Parti_anticapitaliste', '{"Scissions": 90}', 'partis', true),
('nouveau-front-populaire', 'Nouveau Front populaire', 'Alliance de gauche, 2024', 'evenement', 'Gauche', 'rare', 'Monté en quatre jours après la dissolution. Démonté un peu plus lentement.', 'https://fr.wikipedia.org/wiki/Nouveau_Front_populaire', '{"Jours de négociation": 4, "Durée de vie": 40}', 'partis', true),
('bloc-central', 'Le Bloc central', 'Renaissance, MoDem, Horizons', 'evenement', 'Centre', 'rare', 'Trois partis, un groupe, plusieurs candidats pour 2027.', 'https://fr.wikipedia.org/wiki/Ensemble_(coalition)', '{"Unité": 50, "Candidats": 3}', 'partis', true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- LES GRANDES FIGURES (personnes, BROUILLONS). Rôles au 9 octobre 2026.
-- Rareté neutre : épique = fonction institutionnelle (président, Matignon, perchoirs), rare = chef de parti, commune = autres. Jamais légendaire.
-- ---------------------------------------------------------------------------
insert into cards (slug, name, subtitle, category, faction, rarity, flavor, source_url, stats, collection_slug, active) values
('emmanuel-macron', 'Emmanuel Macron', 'Président de la République', 'politique', 'Centre', 'epique', 'Deux mandats, une dissolution, sept Premiers ministres. Le dernier chapitre s''écrit.', 'https://fr.wikipedia.org/wiki/Emmanuel_Macron', '{"Mandats": 2, "Premiers ministres": 7, "Dissolutions": 1}', 'figures', true),
('sebastien-lecornu', 'Sébastien Lecornu', 'Premier ministre', 'politique', 'Centre', 'epique', 'Nommé, démissionnaire, renommé en quatre jours. A fait passer un budget.', 'https://fr.wikipedia.org/wiki/S%C3%A9bastien_Lecornu', '{"Nominations": 2, "Budgets": 1}', 'figures', true),
('marine-le-pen', 'Marine Le Pen', 'Rassemblement national', 'politique', 'Extrême droite', 'rare', 'Trois présidentielles. En tête des sondages pour la quatrième.', 'https://fr.wikipedia.org/wiki/Marine_Le_Pen', '{"Présidentielles": 3, "Sondages": 33}', 'figures', true),
('jordan-bardella', 'Jordan Bardella', 'Président du RN', 'politique', 'Extrême droite', 'rare', 'Président de parti à 27 ans. Le plan B qui aimerait être le plan A.', 'https://fr.wikipedia.org/wiki/Jordan_Bardella', '{"TikTok": 98, "Costume": 95}', 'figures', true),
('jean-luc-melenchon', 'Jean-Luc Mélenchon', 'Fondateur de LFI', 'politique', 'Gauche radicale', 'rare', 'Trois présidentielles, une quatrième en vue. La République, c''est lui, dit-il.', 'https://fr.wikipedia.org/wiki/Jean-Luc_M%C3%A9lenchon', '{"Présidentielles": 3, "Punchlines": 97}', 'figures', true),
('edouard-philippe', 'Édouard Philippe', 'Président d''Horizons', 'politique', 'Centre droit', 'epique', 'Ancien Premier ministre, maire du Havre, candidat déclaré depuis longtemps.', 'https://fr.wikipedia.org/wiki/%C3%89douard_Philippe', '{"Matignon": 3, "Barbe": 100}', 'figures', true),
('gabriel-attal', 'Gabriel Attal', 'Secrétaire général de Renaissance', 'politique', 'Centre', 'epique', 'Plus jeune Premier ministre de la Ve. Huit mois à Matignon, une dissolution plus tard.', 'https://fr.wikipedia.org/wiki/Gabriel_Attal', '{"Matignon": 8, "Âge record": 34}', 'figures', true),
('raphael-glucksmann', 'Raphaël Glucksmann', 'Place publique', 'politique', 'Centre gauche', 'rare', 'Eurodéputé, essayiste, candidat à la primaire socialiste.', 'https://fr.wikipedia.org/wiki/Rapha%C3%ABl_Glucksmann', '{"Européennes": 14, "Essais": 80}', 'figures', true),
('bruno-retailleau', 'Bruno Retailleau', 'Président des Républicains', 'politique', 'Droite', 'rare', 'Vendéen, ancien ministre de l''Intérieur, candidat de la droite.', 'https://fr.wikipedia.org/wiki/Bruno_Retailleau', '{"Fermeté": 90, "Vendée": 100}', 'figures', true),
('olivier-faure', 'Olivier Faure', 'Premier secrétaire du PS', 'politique', 'Gauche', 'rare', 'A tenu le PS debout quand il tenait à peine. Candidat à sa propre primaire.', 'https://fr.wikipedia.org/wiki/Olivier_Faure', '{"Longévité": 8, "Synthèse": 85}', 'figures', true),
('marine-tondelier', 'Marine Tondelier', 'Secrétaire nationale des Écologistes', 'politique', 'Écologie', 'rare', 'La veste verte est devenue un signe de ralliement.', 'https://fr.wikipedia.org/wiki/Marine_Tondelier', '{"Veste verte": 100, "Unité de la gauche": 80}', 'figures', true),
('fabien-roussel', 'Fabien Roussel', 'Secrétaire national du PCF', 'politique', 'Gauche', 'rare', 'Le communiste qui parle de barbecue et de bonne chère.', 'https://fr.wikipedia.org/wiki/Fabien_Roussel', '{"Barbecue": 95, "Bonhomie": 90}', 'figures', true),
('francois-ruffin', 'François Ruffin', 'Député de la Somme', 'politique', 'Gauche', 'commune', 'Fakir, « Merci patron ! », et une rupture avec LFI en 2024.', 'https://fr.wikipedia.org/wiki/Fran%C3%A7ois_Ruffin', '{"Documentaires": 85, "Picardie": 100}', 'figures', true),
('mathilde-panot', 'Mathilde Panot', 'Présidente du groupe LFI', 'politique', 'Gauche radicale', 'commune', 'Mène le groupe insoumis à l''Assemblée, micro ouvert.', 'https://fr.wikipedia.org/wiki/Mathilde_Panot', '{"Hémicycle": 90, "Rappels au règlement": 85}', 'figures', true),
('manuel-bompard', 'Manuel Bompard', 'Coordinateur de LFI', 'politique', 'Gauche radicale', 'commune', 'L''organisateur. Le mouvement n''a pas de président, il a un coordinateur.', 'https://fr.wikipedia.org/wiki/Manuel_Bompard', '{"Organisation": 92}', 'figures', true),
('eric-ciotti', 'Éric Ciotti', 'Président de l''UDR', 'politique', 'Droite', 'rare', 'A fermé la porte du siège LR à clé. Puis a fondé son propre parti.', 'https://fr.wikipedia.org/wiki/%C3%89ric_Ciotti', '{"Serrure": 100, "Alliances": 70}', 'figures', true),
('eric-zemmour', 'Éric Zemmour', 'Président de Reconquête', 'politique', 'Extrême droite', 'rare', 'Polémiste devenu candidat. 7 % en 2022.', 'https://fr.wikipedia.org/wiki/%C3%89ric_Zemmour', '{"Présidentielle 2022": 7, "Polémiques": 98}', 'figures', true),
('francois-bayrou', 'François Bayrou', 'Président du MoDem', 'politique', 'Centre', 'epique', 'Trente ans à attendre Matignon, neuf mois à y rester.', 'https://fr.wikipedia.org/wiki/Fran%C3%A7ois_Bayrou', '{"Matignon": 9, "Patience": 100}', 'figures', true),
('yael-braun-pivet', 'Yaël Braun-Pivet', 'Présidente de l''Assemblée nationale', 'politique', 'Centre', 'epique', 'Au perchoir, avec la sonnette.', 'https://fr.wikipedia.org/wiki/Ya%C3%ABl_Braun-Pivet', '{"Sonnette": 95, "Perchoir": 100}', 'figures', true),
('gerard-larcher', 'Gérard Larcher', 'Président du Sénat', 'politique', 'Droite', 'epique', 'Deuxième personnage de l''État, et le plus durable.', 'https://fr.wikipedia.org/wiki/G%C3%A9rard_Larcher', '{"Longévité": 95, "Rambouillet": 100}', 'figures', true),
('dominique-de-villepin', 'Dominique de Villepin', 'Ancien Premier ministre', 'politique', 'Droite gaulliste', 'epique', 'Le discours de l''ONU en 2003, et un retour inattendu dans les sondages 2027.', 'https://fr.wikipedia.org/wiki/Dominique_de_Villepin', '{"ONU 2003": 100, "Lyrisme": 95}', 'figures', true),
('segolene-royal', 'Ségolène Royal', 'Candidate à la primaire PS', 'politique', 'Gauche', 'commune', 'Finaliste en 2007. De retour pour la primaire socialiste de 2026.', 'https://fr.wikipedia.org/wiki/S%C3%A9gol%C3%A8ne_Royal', '{"Présidentielle 2007": 47, "Retours": 90}', 'figures', true),
('francois-hollande', 'François Hollande', 'Ancien Président, député', 'politique', 'Gauche', 'epique', 'Ancien président redevenu député de Corrèze. Les blagues sont restées.', 'https://fr.wikipedia.org/wiki/Fran%C3%A7ois_Hollande', '{"Mandats": 1, "Blagues": 92}', 'figures', true),
('nicolas-sarkozy', 'Nicolas Sarkozy', 'Ancien Président', 'politique', 'Droite', 'epique', 'Un mandat, beaucoup de livres, et des rendez-vous au tribunal.', 'https://fr.wikipedia.org/wiki/Nicolas_Sarkozy', '{"Mandats": 1, "Livres": 80}', 'figures', true),
('laurent-wauquiez', 'Laurent Wauquiez', 'Président du groupe LR', 'politique', 'Droite', 'rare', 'Auvergnat, et l''a fait savoir sur toutes les photos.', 'https://fr.wikipedia.org/wiki/Laurent_Wauquiez', '{"Auvergne": 100}', 'figures', true),
('sandrine-rousseau', 'Sandrine Rousseau', 'Députée écologiste', 'politique', 'Écologie', 'commune', 'Chaque phrase devient un débat national. Parfois le soir même.', 'https://fr.wikipedia.org/wiki/Sandrine_Rousseau', '{"Débats déclenchés": 97}', 'figures', true),
('clementine-autain', 'Clémentine Autain', 'Députée, L''Après', 'politique', 'Gauche', 'commune', 'A quitté LFI, a cofondé L''Après, candidate à la primaire de la gauche unie.', 'https://fr.wikipedia.org/wiki/Cl%C3%A9mentine_Autain', '{"Primaire": 80}', 'figures', true),
('marion-marechal', 'Marion Maréchal', 'Eurodéputée', 'politique', 'Extrême droite', 'commune', 'Entre le RN et Reconquête, a choisi les deux, puis ni l''un ni l''autre.', 'https://fr.wikipedia.org/wiki/Marion_Mar%C3%A9chal', '{"Allers-retours": 85}', 'figures', true)
on conflict (slug) do nothing;
