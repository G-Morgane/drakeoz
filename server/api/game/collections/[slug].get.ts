// Une collection et ses cartes, avec le nombre d'exemplaires possédés.
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const db = gameDb(event)
  const player = await optionalPlayer(event)
  const { data: collection } = await db.from('collections').select('*').eq('slug', slug).maybeSingle()
  if (!collection) throw createError({ statusCode: 404, statusMessage: 'Collection introuvable' })
  const [{ data: cards, error }, owned] = await Promise.all([
    db.from('cards').select('*').eq('active', true).eq('collection_slug', slug).order('rarity').order('name'),
    player ? db.from('card_instances').select('card_id').eq('owner_id', player.id) : Promise.resolve({ data: [] as { card_id: string }[] }),
  ])
  fail(error)
  const counts = new Map<string, number>()
  for (const i of owned.data ?? []) counts.set(i.card_id, (counts.get(i.card_id) ?? 0) + 1)
  return { collection: collection as Collection, cards: ((cards ?? []) as Card[]).map(c => ({ ...c, owned: counts.get(c.id) ?? 0 })) }
})
