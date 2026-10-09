// Appelé par l'overlay (session admin) : un compte Twitch lié a parlé dans le chat pendant le live,
// il gagne le booster de présence du jour.
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { twitchLogin } = await readBody<{ twitchLogin?: string }>(event)
  const login = (twitchLogin ?? '').trim().toLowerCase()
  if (!login) throw createError({ statusCode: 400, statusMessage: 'Login manquant' })
  const db = gameDb(event)
  const { data: profile } = await db.from('profiles').select('id').eq('twitch_login', login).maybeSingle()
  if (!profile) return { granted: false }
  const { error } = await db.from('pack_grants').insert({ profile_id: profile.id, kind: 'live', day: todayDate() })
  if (error && error.code !== '23505') fail(error)
  return { granted: !error }
})
