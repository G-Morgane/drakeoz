export default defineEventHandler((event) => {
  closeSession(event)
  return { ok: true }
})
