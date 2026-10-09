export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ url?: string }>(event)
  return fetchPageMeta(requireUrl(body.url))
})
