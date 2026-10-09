// Mes échanges, reçus et envoyés, avec le détail des cartes.
export default defineEventHandler(async (event) => {
  const player = await requirePlayer(event)
  const db = gameDb(event)
  const { data: trades, error } = await db
    .from('trades')
    .select('*, from:profiles!trades_from_id_fkey(username), to:profiles!trades_to_id_fkey(username)')
    .or(`from_id.eq.${player.id},to_id.eq.${player.id}`)
    .order('created_at', { ascending: false })
    .limit(50)
  fail(error)

  const ids = [...new Set((trades ?? []).flatMap(t => [...t.offered, ...t.requested]))]
  const { data: instances } = ids.length
    ? await db.from('card_instances').select('id, serial, card:cards(id, name, rarity, image_url)').in('id', ids)
    : { data: [] }
  const byId = new Map((instances ?? []).map(i => [i.id, i]))

  return (trades ?? []).map(t => ({
    ...t,
    offered: t.offered.map((id: string) => byId.get(id) ?? { id, serial: null, card: null }),
    requested: t.requested.map((id: string) => byId.get(id) ?? { id, serial: null, card: null }),
    mine: t.from_id === player.id,
  }))
})
