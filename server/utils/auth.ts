import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

const COOKIE = 'drk_session'
const MAX_AGE = 60 * 60 * 24 * 30

function secret(): string {
  const { sessionSecret, adminPassword } = useRuntimeConfig()
  return sessionSecret || adminPassword
}

function token(): string {
  return createHmac('sha256', secret()).update('admin').digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export function checkPassword(candidate: string): boolean {
  const { adminPassword } = useRuntimeConfig()
  return Boolean(adminPassword) && safeEqual(candidate, adminPassword)
}

export function openSession(event: H3Event) {
  setCookie(event, COOKIE, token(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: MAX_AGE,
  })
}

export function closeSession(event: H3Event) {
  deleteCookie(event, COOKIE, { path: '/' })
}

export function isAdmin(event: H3Event): boolean {
  const value = getCookie(event, COOKIE)
  return Boolean(value) && safeEqual(value!, token())
}

export function requireAdmin(event: H3Event) {
  if (!isAdmin(event)) throw createError({ statusCode: 401, statusMessage: 'Connexion requise' })
}
