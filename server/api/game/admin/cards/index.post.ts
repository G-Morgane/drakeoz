const RARITIES = ['commune', 'rare', 'epique', 'legendaire']
const CATEGORIES = ['politique', 'streamer', 'evenement', 'institution', 'meme', 'media', 'parti', 'emission']

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const b = await readBody<Record<string, any>>(event)
  const name = String(b.name ?? '').trim()
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Nom manquant' })
  if (!RARITIES.includes(b.rarity)) throw createError({ statusCode: 400, statusMessage: 'Rareté invalide' })
  if (!CATEGORIES.includes(b.category)) throw createError({ statusCode: 400, statusMessage: 'Catégorie invalide' })
  const slug = String(b.slug || name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const stats: Record<string, number | string> = {}
  for (const [k, v] of Object.entries(b.stats ?? {})) if (String(k).trim()) stats[String(k).trim()] = Number.isFinite(Number(v)) ? Number(v) : String(v)
  const { data, error } = await gameDb(event)
    .from('cards')
    .insert({
      slug, name,
      subtitle: b.subtitle?.trim() || null,
      category: b.category,
      faction: b.faction?.trim() || null,
      rarity: b.rarity,
      image_url: b.image_url?.trim() || null,
      flavor: b.flavor?.trim() || null,
      source_url: b.source_url?.trim() || null,
      stats,
      set_code: b.set_code?.trim() || 's1',
      collection_slug: b.collection_slug?.trim() || null,
      active: b.active !== false,
    })
    .select('*')
    .single()
  if (error?.code === '23505') throw createError({ statusCode: 409, statusMessage: 'Une carte a déjà cet identifiant' })
  fail(error)
  return data
})
