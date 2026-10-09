// Accepter, refuser ou annuler un échange.
export default defineEventHandler(async (event) => {
  const player = await requirePlayer(event)
  const id = getRouterParam(event, 'id') ?? ''
  const { action } = await readBody<{ action?: 'accept' | 'decline' | 'cancel' }>(event)
  const db = gameDb(event)

  if (action === 'accept') {
    const { error } = await db.rpc('accept_trade', { p_trade: id, p_user: player.id })
    fail(error, 400)
    const { data: t } = await db.from('trades').select('from_id').eq('id', id).single()
    const [mine] = await Promise.all([grantCollectionRewards(event, player.id), t ? grantCollectionRewards(event, t.from_id) : []])
    return { ok: true, rewards: mine }
  }

  const { data: t } = await db.from('trades').select('id, from_id, to_id, status').eq('id', id).maybeSingle()
  if (!t || t.status !== 'pending') throw createError({ statusCode: 404, statusMessage: 'Échange introuvable ou déjà clos' })
  if (action === 'decline' && t.to_id !== player.id) throw createError({ statusCode: 403, statusMessage: 'Pas ton échange à refuser' })
  if (action === 'cancel' && t.from_id !== player.id) throw createError({ statusCode: 403, statusMessage: 'Pas ton échange à annuler' })
  if (action !== 'decline' && action !== 'cancel') throw createError({ statusCode: 400, statusMessage: 'Action inconnue' })

  const { error } = await db
    .from('trades')
    .update({ status: action === 'decline' ? 'declined' : 'cancelled', resolved_at: new Date().toISOString() })
    .eq('id', id)
  fail(error)
  return { ok: true }
})
