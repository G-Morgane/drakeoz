export default defineEventHandler((event) => {
  return { admin: isAdmin(event) }
})
