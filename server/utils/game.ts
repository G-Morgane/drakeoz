import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'
import { randomInt } from 'node:crypto'

export type Rarity = 'commune' | 'rare' | 'epique' | 'legendaire'

export interface Card {
  id: string
  slug: string
  name: string
  subtitle: string | null
  category: string
  faction: string | null
  rarity: Rarity
  image_url: string | null
  flavor: string | null
  source_url: string | null
  stats: Record<string, number | string>
  set_code: string
  collection_slug: string | null
  active: boolean
}

export interface Collection {
  slug: string
  name: string
  description: string | null
  emoji: string | null
  position: number
}

export interface Profile {
  id: string
  username: string
  twitch_login: string | null
  link_code: string | null
  created_at: string
}

/** Poids de tirage par rareté (sur 100). */
export const RARITY_WEIGHTS: Record<Rarity, number> = { commune: 70, rare: 22, epique: 7, legendaire: 1 }
export const PACK_SIZE = 3

export function gameDb(event: H3Event) {
  return serverSupabaseServiceRole(event)
}

export function fail(error: { message: string } | null, status = 500): asserts error is null {
  if (error) throw createError({ statusCode: status, statusMessage: error.message })
}

/** Le joueur connecté (session Supabase côté client) et son profil. */
export async function requirePlayer(event: H3Event): Promise<Profile> {
  // Selon la version du module, on reçoit l'utilisateur (id) ou les claims du jeton (sub).
  const user = (await serverSupabaseUser(event).catch(() => null)) as { id?: string; sub?: string } | null
  const userId = user?.id ?? user?.sub
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'Connexion requise' })
  const { data, error } = await gameDb(event).from('profiles').select('*').eq('id', userId).maybeSingle()
  fail(error)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Profil introuvable' })
  return data as Profile
}

export async function optionalPlayer(event: H3Event): Promise<Profile | null> {
  try {
    return await requirePlayer(event)
  } catch {
    return null
  }
}

/** Tire n cartes parmi les actives, pondérées par rareté. Doublons possibles, comme dans un vrai booster. */
export async function drawCards(event: H3Event, n = PACK_SIZE): Promise<Card[]> {
  const { data, error } = await gameDb(event).from('cards').select('*').eq('active', true)
  fail(error)
  const cards = (data ?? []) as Card[]
  if (!cards.length) throw createError({ statusCode: 503, statusMessage: 'Aucune carte en circulation' })
  const byRarity = Object.fromEntries((Object.keys(RARITY_WEIGHTS) as Rarity[]).map(r => [r, cards.filter(c => c.rarity === r)])) as Record<Rarity, Card[]>
  const out: Card[] = []
  while (out.length < n) {
    let roll = randomInt(100)
    let rarity: Rarity = 'commune'
    for (const [r, w] of Object.entries(RARITY_WEIGHTS) as [Rarity, number][]) {
      if (roll < w) { rarity = r; break }
      roll -= w
    }
    // Si aucune carte de cette rareté, on redescend.
    const pool = byRarity[rarity].length ? byRarity[rarity] : cards
    out.push(pool[randomInt(pool.length)]!)
  }
  return out
}

/** Crée les exemplaires pour un joueur, numéros de série à la suite. */
export async function mintCards(event: H3Event, ownerId: string, cards: Card[], via: string) {
  const db = gameDb(event)
  const minted = []
  for (const card of cards) {
    const { count } = await db.from('card_instances').select('*', { count: 'exact', head: true }).eq('card_id', card.id)
    const { data, error } = await db
      .from('card_instances')
      .insert({ card_id: card.id, owner_id: ownerId, serial: (count ?? 0) + 1, obtained_via: via })
      .select('id, serial, obtained_at')
      .single()
    fail(error)
    minted.push({ ...data, card })
  }
  return minted
}

/** Après un gain de cartes : toute collection désormais complète donne un booster cadeau, une seule fois. */
export async function grantCollectionRewards(event: H3Event, profileId: string): Promise<Collection[]> {
  const db = gameDb(event)
  const [{ data: collections }, { data: cards }, { data: owned }, { data: rewarded }] = await Promise.all([
    db.from('collections').select('*'),
    db.from('cards').select('id, collection_slug').eq('active', true),
    db.from('card_instances').select('card_id').eq('owner_id', profileId),
    db.from('collection_rewards').select('collection_slug').eq('profile_id', profileId),
  ])
  const ownedIds = new Set((owned ?? []).map(o => o.card_id))
  const done = new Set((rewarded ?? []).map(r => r.collection_slug))
  const granted: Collection[] = []
  for (const col of (collections ?? []) as Collection[]) {
    if (done.has(col.slug)) continue
    const ids = (cards ?? []).filter(c => c.collection_slug === col.slug).map(c => c.id)
    if (!ids.length || !ids.every(id => ownedIds.has(id))) continue
    const { error } = await db.from('collection_rewards').insert({ profile_id: profileId, collection_slug: col.slug })
    if (error) continue // déjà accordée en parallèle
    await db.from('pack_grants').insert({ profile_id: profileId, kind: 'gift', day: todayDate() })
    granted.push(col)
  }
  return granted
}

/** Si le compte Supabase a une identité Twitch (connexion ou liaison OAuth), on recopie le login dans le profil. */
export async function syncTwitchIdentity(event: H3Event, player: Profile): Promise<void> {
  const db = gameDb(event)
  const { data } = await db.auth.admin.getUserById(player.id)
  const tw = data.user?.identities?.find(i => i.provider === 'twitch')
  const login = String(tw?.identity_data?.preferred_username ?? tw?.identity_data?.login ?? tw?.identity_data?.name ?? '').toLowerCase()
  if (!login) return
  // Un compte Twitch ne peut être lié qu'à un seul joueur.
  await db.from('profiles').update({ twitch_login: null }).eq('twitch_login', login).neq('id', player.id)
  const { error } = await db.from('profiles').update({ twitch_login: login, link_code: null }).eq('id', player.id)
  if (!error) player.twitch_login = login
}

export function todayDate(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' })
}
