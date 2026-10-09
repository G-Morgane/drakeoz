// Les collections, avec la progression du joueur connecté.
export default defineEventHandler(async (event) => {
  const db = gameDb(event)
  const player = await optionalPlayer(event)
  const [{ data: collections, error }, { data: cards }, owned, rewarded] = await Promise.all([
    db.from('collections').select('*').order('position'),
    db.from('cards').select('id, collection_slug, rarity').eq('active', true),
    player ? db.from('card_instances').select('card_id').eq('owner_id', player.id) : Promise.resolve({ data: [] as { card_id: string }[] }),
    player ? db.from('collection_rewards').select('collection_slug').eq('profile_id', player.id) : Promise.resolve({ data: [] as { collection_slug: string }[] }),
  ])
  fail(error)
  const ownedIds = new Set((owned.data ?? []).map(o => o.card_id))
  const done = new Set((rewarded.data ?? []).map(r => r.collection_slug))
  return ((collections ?? []) as Collection[]).map(col => {
    const ids = (cards ?? []).filter(c => c.collection_slug === col.slug).map(c => c.id)
    return {
      ...col,
      total: ids.length,
      owned: ids.filter(id => ownedIds.has(id)).length,
      rewarded: done.has(col.slug),
    }
  })
})
