// Ma collection : chaque exemplaire avec sa carte.
export default defineEventHandler(async (event) => {
  const player = await requirePlayer(event)
  const { data, error } = await gameDb(event)
    .from('card_instances')
    .select('id, serial, obtained_via, obtained_at, card:cards(*)')
    .eq('owner_id', player.id)
    .order('obtained_at', { ascending: false })
  fail(error)
  return data ?? []
})
