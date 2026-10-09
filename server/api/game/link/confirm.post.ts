// Appelé par l'overlay (session admin) quand quelqu'un tape !lier CODE dans le chat.
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { code, twitchLogin } = await readBody<{ code?: string; twitchLogin?: string }>(event)
  const login = (twitchLogin ?? '').trim().toLowerCase()
  const c = (code ?? '').trim().toUpperCase()
  if (!login || !/^[A-Z0-9]{6}$/.test(c)) throw createError({ statusCode: 400, statusMessage: 'Code invalide' })
  const db = gameDb(event)
  const { data: profile } = await db.from('profiles').select('id, username').eq('link_code', c).maybeSingle()
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Code inconnu' })
  // Un compte Twitch ne peut être lié qu'à un seul joueur.
  await db.from('profiles').update({ twitch_login: null }).eq('twitch_login', login)
  const { error } = await db.from('profiles').update({ twitch_login: login, link_code: null }).eq('id', profile.id)
  fail(error)
  return { username: profile.username }
})
