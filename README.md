# Drakeoz, les sources de la matinale

Site perso pour le stream de Drakeoz : chaque matinale a sa page avec les liens cités, un calendrier pour s'y retrouver, et une page admin pour les saisir.

## Lancer en local

```bash
bun install
cp .env.example .env   # puis éditer le mot de passe admin
bun dev
```

Sans Supabase configuré, les données vont dans `.data/db.json`.

## Déployer

- Vercel (ou Cloudflare Pages / Netlify) pour le site.
- Supabase : créer un projet, exécuter `supabase/schema.sql`, renseigner `NUXT_SUPABASE_URL` et `NUXT_SUPABASE_SERVICE_KEY` (clé service, jamais côté client).
- `NUXT_ADMIN_PASSWORD` et `NUXT_SESSION_SECRET` dans les variables d'environnement.

## Jeu de cartes

- Exécuter `supabase/game.sql` (après `schema.sql`, et `supabase/migrate-2026-10-07.sql` si le schéma date d'avant).
- Dans Supabase, Authentication, Providers, Email : désactiver « Confirm email » (sinon limite d'envoi de mails).
- Variables : `SUPABASE_URL`, `SUPABASE_KEY` (clé publishable), `SUPABASE_SERVICE_KEY` (clé secrète, serveur uniquement).
- Cartes de départ neutres fournies. Les personnalités s'ajoutent sur `/admin/cartes`.
- Liaison Twitch sans OAuth : le joueur génère un code sur `/cartes` et tape `!lier CODE` dans le chat pendant que l'overlay tourne.

## Connexion Twitch directe (OAuth)

1. Sur https://dev.twitch.tv/console (n'importe quel compte Twitch avec la double authentification), « Register Your Application » :
   nom libre, OAuth Redirect URL = `https://tlrohpaltgqvdwkdliki.supabase.co/auth/v1/callback`, catégorie Website Integration.
   Récupérer le Client ID et générer un Client Secret.
2. Supabase, Authentication, Providers, Twitch : activer, coller les deux clés.
3. Supabase, Authentication, Settings : activer « Allow manual linking » (pour rattacher Twitch à un compte email existant).
4. Exécuter `supabase/twitch-auth.sql` (le pseudo Twitch devient le nom de joueur à l'inscription).
5. `NUXT_PUBLIC_TWITCH_AUTH=true` dans les variables d'environnement, redémarrer.
Le bouton « Continuer avec Twitch » apparaît sur /cartes, et « Lier mon compte Twitch » dans la section Compte Twitch. Le `!lier` reste disponible.
