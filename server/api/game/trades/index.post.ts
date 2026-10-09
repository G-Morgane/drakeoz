// Propose un échange : mes cartes contre celles d'un autre joueur.
export default defineEventHandler(async (event) => {
  const player = await requirePlayer(event)
  const body = await readBody<{ to?: string; offered?: string[]; requested?: string[]; message?: string }>(event)
  const db = gameDb(event)

  const offered = [...new Set(body.offered ?? [])]
  const requested = [...new Set(body.requested ?? [])]
  if (!offered.length && !requested.length) throw createError({ statusCode: 400, statusMessage: 'Un échange vide, ça ne marche pas' })
  if (offered.length > 10 || requested.length > 10) throw createError({ statusCode: 400, statusMessage: 'Dix cartes maximum de chaque côté' })

  const { data: to } = await db.from('profiles').select('id, username').ilike('username', body.to ?? '').maybeSingle()
  if (!to) throw createError({ statusCode: 404, statusMessage: 'Joueur introuvable' })
  if (to.id === player.id) throw createError({ statusCode: 400, statusMessage: 'Échanger avec soi-même, non' })

  const [{ count: mine }, { count: theirs }] = await Promise.all([
    offered.length ? db.from('card_instances').select('*', { count: 'exact', head: true }).in('id', offered).eq('owner_id', player.id) : { count: 0 },
    requested.length ? db.from('card_instances').select('*', { count: 'exact', head: true }).in('id', requested).eq('owner_id', to.id) : { count: 0 },
  ])
  if ((mine ?? 0) !== offered.length) throw createError({ statusCode: 400, statusMessage: 'Tu ne possèdes pas toutes les cartes offertes' })
  if ((theirs ?? 0) !== requested.length) throw createError({ statusCode: 400, statusMessage: 'Ce joueur ne possède pas toutes les cartes demandées' })

  const { data, error } = await db
    .from('trades')
    .insert({ from_id: player.id, to_id: to.id, offered, requested, message: body.message?.trim().slice(0, 280) || null })
    .select('id')
    .single()
  fail(error)
  return data
})
