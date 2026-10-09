import type { H3Event } from 'h3'

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Le paramètre de route `date`, validé au format YYYY-MM-DD. */
export function requireDateParam(event: H3Event): string {
  const date = getRouterParam(event, 'date') ?? ''
  if (!ISO_DATE.test(date)) throw createError({ statusCode: 400, statusMessage: 'Date invalide' })
  return date
}

export function requireUrl(raw: unknown): string {
  const url = typeof raw === 'string' ? raw.trim() : ''
  if (!/^https?:\/\//i.test(url)) throw createError({ statusCode: 400, statusMessage: 'URL invalide' })
  return url
}
