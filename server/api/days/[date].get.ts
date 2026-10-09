export default defineEventHandler(async (event) => {
  const date = requireDateParam(event)
  return useDb().getDay(date)
})
