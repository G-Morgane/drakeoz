export default defineEventHandler(async (event) => {
  const { month } = getQuery(event)
  const m = typeof month === 'string' && /^\d{4}-\d{2}$/.test(month) ? month : undefined
  return useDb().listDays(m)
})
