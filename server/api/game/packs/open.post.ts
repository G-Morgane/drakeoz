// Ouvre un booster : tire les cartes, les attribue, marque le booster ouvert.
export default defineEventHandler(async (event) => {
  const player = await requirePlayer(event)
  const { grantId } = await readBody<{ grantId?: string }>(event)
  const db = gameDb(event)

  const { data: grant, error } = await db.from('pack_grants').select('*').eq('id', grantId ?? '').eq('profile_id', player.id).maybeSingle()
  fail(error)
  if (!grant) throw createError({ statusCode: 404, statusMessage: 'Booster introuvable' })
  if (grant.opened_at) throw createError({ statusCode: 409, statusMessage: 'Booster déjà ouvert' })

  const cards = await drawCards(event)
  const minted = await mintCards(event, player.id, cards, grant.kind)
  const { error: e2 } = await db.from('pack_grants').update({ opened_at: new Date().toISOString() }).eq('id', grant.id)
  fail(e2)
  const rewards = await grantCollectionRewards(event, player.id)
  return { kind: grant.kind, cards: minted, rewards }
})
