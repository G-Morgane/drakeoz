export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: string }>(event)
  if (!body?.password || !checkPassword(body.password)) {
    throw createError({ statusCode: 401, statusMessage: 'Mot de passe incorrect' })
  }
  openSession(event)
  return { ok: true }
})
