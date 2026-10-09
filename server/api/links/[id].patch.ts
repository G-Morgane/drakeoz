export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  const body = await readBody<{ title?: string; note?: string | null; source?: string; kind?: string; section?: string | null; done?: boolean }>(event)
  const patch: LinkPatch = {}
  if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim()
  if ('note' in body) patch.note = body.note?.trim() || null
  if (typeof body.source === 'string' && body.source.trim()) patch.source = body.source.trim()
  if (isSourceKind(body.kind)) patch.kind = body.kind
  if ('section' in body) patch.section = body.section?.trim() || null
  // La coche : l'heure est prise côté serveur pour que le timecode soit fiable.
  if (typeof body.done === 'boolean') patch.done_at = body.done ? new Date().toISOString() : null
  return useDb().updateLink(id, patch)
})
