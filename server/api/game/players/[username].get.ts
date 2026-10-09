// Collection publique d'un joueur, pour préparer un échange.
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username') ?? ''
  const db = gameDb(event)
  const { data: profile } = await db.from('profiles').select('id, username, twitch_login, created_at').ilike('username', username).maybeSingle()
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Joueur introuvable' })
  const { data, error } = await db
    .from('card_instances')
    .select('id, serial, card:cards(*)')
    .eq('owner_id', profile.id)
    .order('obtained_at', { ascending: false })
  fail(error)
  return { profile, cards: data ?? [] }
})
