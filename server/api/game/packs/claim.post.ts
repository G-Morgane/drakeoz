// Réclame le booster quotidien (un par jour, heure de Paris).
export default defineEventHandler(async (event) => {
  const player = await requirePlayer(event)
  const { data, error } = await gameDb(event)
    .from('pack_grants')
    .insert({ profile_id: player.id, kind: 'daily', day: todayDate() })
    .select('id, kind, day')
    .single()
  if (error?.code === '23505') throw createError({ statusCode: 409, statusMessage: 'Booster du jour déjà récupéré, reviens demain' })
  fail(error)
  return data
})
