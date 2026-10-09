// Timecodes : écart entre l'heure où un sujet a été coché et le début de la matinale.

/** "1:12:05" ou "4:32". Négatif ou sans début : null. */
export function timecode(doneAt: string | null | undefined, startedAt: string | null | undefined): string | null {
  if (!doneAt || !startedAt) return null
  const ms = new Date(doneAt).getTime() - new Date(startedAt).getTime()
  if (!Number.isFinite(ms) || ms < 0) return null
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}

/** "09:42" en heure locale. */
export function clock(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/** Chapitres au format YouTube : "0:00 Intro" puis une ligne par sujet coché. */
export function youtubeChapters(links: { title: string; done_at: string | null }[], startedAt: string | null | undefined): string {
  if (!startedAt) return ''
  const lines = ['0:00 Début de la matinale']
  const done = links
    .filter(l => l.done_at)
    .sort((a, b) => (a.done_at! < b.done_at! ? -1 : 1))
  for (const l of done) {
    const tc = timecode(l.done_at, startedAt)
    if (tc) lines.push(`${tc} ${l.title}`)
  }
  return lines.join('\n')
}

/** Ce qu'on affiche à côté d'un sujet coché : le timecode si on a le top départ, sinon l'heure. */
export function doneLabel(doneAt: string | null | undefined, startedAt: string | null | undefined): string | null {
  return timecode(doneAt, startedAt) ?? clock(doneAt)
}
