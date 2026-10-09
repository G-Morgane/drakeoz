export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  await useDb().deleteLink(id)
  return { ok: true }
})
