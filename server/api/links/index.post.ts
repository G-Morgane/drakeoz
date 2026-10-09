export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ date?: string; url?: string; title?: string; source?: string; note?: string; kind?: string; section?: string }>(event)

  const date = body.date ?? ''
  if (!ISO_DATE.test(date)) throw createError({ statusCode: 400, statusMessage: 'Date invalide' })
  const url = requireUrl(body.url)

  const kind = isSourceKind(body.kind) ? body.kind : kindOf(url)

  // Sans titre (commande chat), on va le chercher sur la page.
  let title = (body.title ?? '').trim()
  let source = (body.source ?? '').trim()
  if (!title || !source) {
    const meta = await fetchPageMeta(url)
    title ||= meta.title || `Lien ${sourceOf(url, kind)}`
    source ||= meta.source
  }
  const section = body.section?.trim() || null

  return useDb().addLink({ date, url, title, source, kind, section, note: body.note?.trim() || null })
})
