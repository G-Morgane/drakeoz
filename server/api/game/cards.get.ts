// L'album : toutes les cartes actives, avec le nombre d'exemplaires possédés par le joueur connecté.
export default defineEventHandler(async (event) => {
  const db = gameDb(event)
  const player = await optionalPlayer(event)
  const [{ data: cards, error }, owned] = await Promise.all([
    db.from('cards').select('*').eq('active', true).order('rarity').order('name'),
    player ? db.from('card_instances').select('card_id').eq('owner_id', player.id) : Promise.resolve({ data: [] as { card_id: string }[] }),
  ])
  fail(error)
  const counts = new Map<string, number>()
  for (const i of owned.data ?? []) counts.set(i.card_id, (counts.get(i.card_id) ?? 0) + 1)
  return (cards ?? []).map(c => ({ ...c, owned: counts.get(c.id) ?? 0 }))
})
