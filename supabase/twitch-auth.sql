-- Connexion Twitch directe : le profil prend le pseudo Twitch comme nom de joueur à l'inscription.
-- À exécuter une fois le fournisseur Twitch activé dans Supabase (Authentication, Providers, Twitch).
-- Pour la liaison d'un compte email existant : Authentication, Settings, activer « Allow manual linking ».

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  base text;
  candidate text;
  n integer := 0;
begin
  base := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'preferred_username',
    new.raw_user_meta_data->>'name',
    'joueur_' || left(new.id::text, 6)
  );
  base := regexp_replace(base, '[^a-zA-Z0-9_]', '_', 'g');
  base := left(base, 20);
  candidate := base;
  -- Pseudo déjà pris : on suffixe.
  while exists (select 1 from profiles where lower(username) = lower(candidate)) loop
    n := n + 1;
    candidate := left(base, 17) || '_' || n;
  end loop;
  insert into profiles (id, username, twitch_login)
  values (
    new.id,
    candidate,
    case when new.raw_app_meta_data->>'provider' = 'twitch'
      then lower(coalesce(new.raw_user_meta_data->>'preferred_username', new.raw_user_meta_data->>'name'))
      else null end
  );
  return new;
end $$;
