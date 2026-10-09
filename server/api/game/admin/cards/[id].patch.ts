export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  const b = await readBody<Record<string, any>>(event)
  const patch: Record<string, any> = {}
  for (const k of ['name', 'subtitle', 'faction', 'image_url', 'flavor', 'source_url', 'set_code', 'rarity', 'category', 'collection_slug']) {
    if (k in b) patch[k] = typeof b[k] === 'string' ? b[k].trim() || null : b[k]
  }
  if ('active' in b) patch.active = Boolean(b.active)
  if ('stats' in b && b.stats && typeof b.stats === 'object') patch.stats = b.stats
  const { data, error } = await gameDb(event).from('cards').update(patch).eq('id', id).select('*').single()
  fail(error)
  return data
})
