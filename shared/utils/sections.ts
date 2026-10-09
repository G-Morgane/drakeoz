/** Groupe des éléments par section, dans l'ordre de première apparition, les sans-section en dernier (clé null). */
export function groupBySection<T extends { section: string | null }>(items: T[]): [string | null, T[]][] {
  const map = new Map<string | null, T[]>()
  for (const it of items) {
    const key = it.section?.trim() || null
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(it)
  }
  const named = [...map.entries()].filter(([k]) => k !== null)
  const rest = map.get(null)
  if (rest) named.push([null, rest])
  return named
}
