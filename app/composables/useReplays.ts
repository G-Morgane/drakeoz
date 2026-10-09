// Replays Twitch, regroupés par stream : une coupure pendant le live donne plusieurs VOD
// pour le même stream (même jour, ou même titre quand on n'a pas la date).

export interface ReplayPart {
  id: string
  title: string
  url: string
  date: string | null
  startedAt: string | null
  duration: string | null
  image: string | null
}

export interface ReplayGroup {
  key: string
  title: string
  date: string | null
  image: string | null
  /** Du plus ancien au plus récent. */
  parts: ReplayPart[]
}

export function useReplays() {
  const { data } = useFetch('/api/replays', {
    key: 'replays',
    default: () => ({ items: [] as ReplayPart[], dated: false }),
  })

  const groups = computed<ReplayGroup[]>(() => {
    const out: ReplayGroup[] = []
    for (const r of data.value.items) {
      const key = r.date ?? r.title
      const last = out[out.length - 1]
      if (last && last.key === key) {
        last.parts.unshift(r)
        last.image ??= r.image
      } else {
        out.push({ key, title: r.title, date: r.date, image: r.image, parts: [r] })
      }
    }
    return out
  })

  const byDate = computed(() => new Map(groups.value.filter(g => g.date).map(g => [g.date!, g])))

  return { groups, byDate, dated: computed(() => data.value.dated) }
}
