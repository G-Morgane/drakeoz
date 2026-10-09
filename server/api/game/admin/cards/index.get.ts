export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { data, error } = await gameDb(event).from('cards').select('*, instances:card_instances(count)').order('created_at', { ascending: false })
  fail(error)
  return (data ?? []).map((c: any) => ({ ...c, circulating: c.instances?.[0]?.count ?? 0, instances: undefined }))
})
