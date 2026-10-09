// État joueur partagé entre les pages du jeu.
export function useGame() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  // Au rendu serveur, transmet les cookies de session à l'API interne.
  const requestFetch = useRequestFetch()

  const me = useState<Awaited<ReturnType<typeof fetchMe>> | null>('game-me', () => null)

  async function fetchMe() {
    return await requestFetch('/api/game/me')
  }

  // Le serveur fait foi : juste après une connexion, l'utilisateur côté client n'est pas encore à jour.
  async function refreshMe() {
    me.value = await fetchMe()
  }

  /** Retourne false si Supabase exige une confirmation par email avant la première connexion. */
  async function signUp(email: string, password: string, username: string): Promise<boolean> {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } })
    if (error) throw error
    await refreshMe()
    return Boolean(data.session)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await refreshMe()
  }

  /** Connexion ou inscription via Twitch (OAuth Supabase). Redirige vers Twitch puis revient sur /cartes. */
  async function signInWithTwitch() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitch',
      options: { redirectTo: `${window.location.origin}/cartes` },
    })
    if (error) throw error
  }

  /** Rattache un compte Twitch à un joueur déjà connecté par email. */
  async function linkTwitch() {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'twitch',
      options: { redirectTo: `${window.location.origin}/cartes` },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    me.value = { player: null }
  }

  return { user, me, refreshMe, signUp, signIn, signInWithTwitch, linkTwitch, signOut }
}
