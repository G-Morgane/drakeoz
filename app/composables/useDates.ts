// Les dates circulent partout sous la forme "YYYY-MM-DD" (jour local, sans heure).

export function todayIso(): string {
  return toIso(new Date())
}

export function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

export function isValidIso(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(fromIso(iso).getTime())
}

const longFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const shortFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatLong(iso: string): string {
  return capitalize(longFmt.format(fromIso(iso)))
}

export function formatShort(iso: string): string {
  return capitalize(shortFmt.format(fromIso(iso)))
}

/** "2026-10" vers "Octobre 2026" */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return capitalize(monthFmt.format(new Date(y!, m! - 1, 1)))
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7)
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y!, m! - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const relFmt = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })

/** "il y a 3 heures", "avant-hier". */
export function formatRelative(iso: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 3600) return relFmt.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return relFmt.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return relFmt.format(Math.round(diff / 86400), 'day')
  return relFmt.format(Math.round(diff / (86400 * 30)), 'month')
}
