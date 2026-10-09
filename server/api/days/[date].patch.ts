export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const date = requireDateParam(event)
  const body = await readBody<{ title?: string | null; intro?: string | null; started_at?: string | null }>(event)
  const patch: DayPatch = {}
  if ('title' in body) patch.title = body.title?.trim() || null
  if ('intro' in body) patch.intro = body.intro?.trim() || null
  if ('started_at' in body) {
    if (body.started_at === null) patch.started_at = null
    else if (typeof body.started_at === 'string' && !Number.isNaN(Date.parse(body.started_at))) patch.started_at = new Date(body.started_at).toISOString()
    else throw createError({ statusCode: 400, statusMessage: 'Heure de début invalide' })
  }
  return useDb().upsertDay(date, patch)
})
