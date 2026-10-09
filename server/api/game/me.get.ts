// Le joueur connecté : profil, boosters ouvrables, compteurs.
export default defineEventHandler(async (event) => {
  const player = await optionalPlayer(event)
  if (!player) return { player: null }
  const db = gameDb(event)
  if (!player.twitch_login) await syncTwitchIdentity(event, player)
  const today = todayDate()

  const [{ data: grants }, { count: owned }, { count: pendingTrades }] = await Promise.all([
    db.from('pack_grants').select('id, kind, day, opened_at').eq('profile_id', player.id).is('opened_at', null),
    db.from('card_instances').select('*', { count: 'exact', head: true }).eq('owner_id', player.id),
    db.from('trades').select('*', { count: 'exact', head: true }).eq('to_id', player.id).eq('status', 'pending'),
  ])
  const { data: dailyToday } = await db.from('pack_grants').select('id').eq('profile_id', player.id).eq('kind', 'daily').eq('day', today).maybeSingle()

  return {
    player: { id: player.id, username: player.username, twitch_login: player.twitch_login, link_code: player.link_code },
    packs: grants ?? [],
    dailyAvailable: !dailyToday,
    owned: owned ?? 0,
    pendingTrades: pendingTrades ?? 0,
  }
})
