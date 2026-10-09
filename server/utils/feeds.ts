// Récupération des publications externes, chacune en cache. Format commun : FeedItem.
import type { SourceKind } from '#shared/utils/kinds'

export interface FeedItem {
  id: string
  kind: SourceKind // 'video' = Twitch
  source: string
  title: string
  url: string
  image: string | null
  date: string
  meta: string | null // durée, compteurs...
  link: { url: string; title: string } | null
}

function xmlTag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))
  return m?.[1]?.trim() ?? ''
}

function unescape(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

// --- YouTube (flux RSS public) ---------------------------------------------
export const fetchYoutube = defineCachedFunction(async (channelId: string): Promise<FeedItem[]> => {
  try {
    const xml = await $fetch<string>(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`, {
      responseType: 'text',
      timeout: 6000,
    })
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 10).map(([, e]) => {
      const id = xmlTag(e!, 'yt:videoId')
      return {
        id: `yt-${id}`,
        kind: 'youtube',
        source: 'YouTube',
        title: unescape(xmlTag(e!, 'title')),
        url: `https://www.youtube.com/watch?v=${id}`,
        image: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        date: xmlTag(e!, 'published'),
        meta: null,
        link: null,
      }
    })
  } catch {
    return []
  }
}, { maxAge: 600, name: 'feed-youtube', getKey: (id: string) => id })

// --- Bluesky (API publique) -------------------------------------------------
export const fetchBluesky = defineCachedFunction(async (handle: string): Promise<FeedItem[]> => {
  try {
    const res = await $fetch<{ feed: any[] }>('https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed', {
      query: { actor: handle, limit: 15, filter: 'posts_no_replies' },
      timeout: 6000,
    })
    return res.feed
      .filter(f => !f.reason)
      .map(({ post }) => {
        const rkey = String(post.uri).split('/').pop()
        const embed = post.embed ?? {}
        const image = embed.$type === 'app.bsky.embed.images#view' ? embed.images?.[0]?.thumb ?? null
          : embed.$type === 'app.bsky.embed.recordWithMedia#view' ? embed.media?.images?.[0]?.thumb ?? null
          : null
        const ext = embed.$type === 'app.bsky.embed.external#view' ? embed.external : null
        const likes = post.likeCount ?? 0
        const reposts = post.repostCount ?? 0
        return {
          id: `bsky-${post.cid}`,
          kind: 'bluesky' as const,
          source: `@${post.author.handle}`,
          title: post.record?.text ?? '',
          url: `https://bsky.app/profile/${post.author.handle}/post/${rkey}`,
          image,
          date: post.record?.createdAt ?? post.indexedAt,
          meta: `${likes} j'aime · ${reposts} partage${reposts > 1 ? 's' : ''}`,
          link: ext ? { url: ext.uri, title: ext.title || ext.uri } : null,
        }
      })
  } catch {
    return []
  }
}, { maxAge: 300, name: 'feed-bluesky', getKey: (h: string) => h })

// --- Twitch (Helix, app credentials) -----------------------------------------
let twitchToken: { value: string; expiresAt: number } | null = null

async function twitchAppToken(clientId: string, secret: string): Promise<string> {
  if (twitchToken && twitchToken.expiresAt > Date.now() + 60_000) return twitchToken.value
  const res = await $fetch<{ access_token: string; expires_in: number }>('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({ client_id: clientId, client_secret: secret, grant_type: 'client_credentials' }),
  })
  twitchToken = { value: res.access_token, expiresAt: Date.now() + res.expires_in * 1000 }
  return twitchToken.value
}

export const fetchTwitch = defineCachedFunction(async (login: string): Promise<FeedItem[]> => {
  const { twitchClientId, twitchClientSecret } = useRuntimeConfig()
  try {
    const headers = { 'Client-Id': twitchClientId, Authorization: `Bearer ${await twitchAppToken(twitchClientId, twitchClientSecret)}` }
    const users = await $fetch<{ data: { id: string }[] }>('https://api.twitch.tv/helix/users', { headers, query: { login } })
    const userId = users.data[0]?.id
    if (!userId) return []
    const vids = await $fetch<{ data: any[] }>('https://api.twitch.tv/helix/videos', { headers, query: { user_id: userId, first: 10, type: 'archive' } })
    return vids.data.map(v => ({
      id: `tw-${v.id}`,
      kind: 'video' as const,
      source: 'Twitch',
      title: v.title,
      url: v.url,
      image: String(v.thumbnail_url).replace('%{width}', '480').replace('%{height}', '270'),
      date: v.published_at,
      meta: `Rediffusion · ${v.duration}`,
      link: null,
    }))
  } catch {
    return []
  }
}, { maxAge: 300, name: 'feed-twitch', getKey: (l: string) => l })

// --- Replays Twitch ------------------------------------------------------------
export interface Replay {
  id: string
  title: string
  url: string
  date: string | null // jour du stream à Paris, "YYYY-MM-DD"
  startedAt: string | null
  duration: string | null // "3 h 02"
  image: string | null
}

/** Retire les commandes de chat collées au titre : "!HOLY (!don !tipeee)". */
function cleanTitle(t: string): string {
  return t.replace(/\s*\((?:\s*!\w+)+\s*\)|\s+!\w+(?=\s|$)/g, '').trim()
}

const parisDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' })

/** "3h2m1s" vers "3 h 02". */
function prettyDuration(d: string): string | null {
  const m = d.match(/(?:(\d+)h)?(?:(\d+)m)?/)
  if (!m || (!m[1] && !m[2])) return null
  return m[1] ? `${m[1]} h ${String(m[2] ?? 0).padStart(2, '0')}` : `${m[2]} min`
}

// Avec les clés Twitch : API officielle, avec dates et miniatures.
// Sans clés : decapi.me, qui ne donne que le titre et le lien (pas de date).
export const fetchReplays = defineCachedFunction(async (login: string): Promise<{ items: Replay[]; dated: boolean }> => {
  const { twitchClientId, twitchClientSecret } = useRuntimeConfig()
  if (twitchClientId && twitchClientSecret) {
    try {
      const headers = { 'Client-Id': twitchClientId, Authorization: `Bearer ${await twitchAppToken(twitchClientId, twitchClientSecret)}` }
      const users = await $fetch<{ data: { id: string }[] }>('https://api.twitch.tv/helix/users', { headers, query: { login } })
      const userId = users.data[0]?.id
      if (!userId) return { items: [], dated: true }
      const vids = await $fetch<{ data: any[] }>('https://api.twitch.tv/helix/videos', { headers, query: { user_id: userId, first: 100, type: 'archive' } })
      return {
        dated: true,
        items: vids.data.map(v => ({
          id: String(v.id),
          title: cleanTitle(v.title),
          url: v.url,
          date: parisDay.format(new Date(v.created_at)),
          startedAt: v.created_at,
          duration: prettyDuration(String(v.duration)),
          image: v.thumbnail_url ? String(v.thumbnail_url).replace('%{width}', '480').replace('%{height}', '270') : null,
        })),
      }
    } catch {
      // on tente decapi
    }
  }
  try {
    const text = await $fetch<string>(`https://decapi.me/twitch/videos/${login}`, {
      query: { limit: 50, separator: '\n', video_format: '${url} ${title}' },
      responseType: 'text',
      timeout: 6000,
    })
    const items = text.split('\n').map((line) => {
      const [url, ...rest] = line.trim().split(' ')
      const id = url?.match(/videos\/(\d+)/)?.[1]
      if (!id) return null
      return { id, title: cleanTitle(rest.join(' ')), url: url!, date: null, startedAt: null, duration: null, image: null }
    }).filter((r): r is Replay => r !== null)
    return { items, dated: false }
  } catch {
    return { items: [], dated: false }
  }
}, { maxAge: 600, name: 'twitch-replays', getKey: (l: string) => l })

/** "1 hour, 39 minutes, 33 seconds" vers "1 h 39". */
function frenchUptime(text: string): string {
  const h = Number(text.match(/(\d+)\s*hour/)?.[1] ?? 0)
  const m = Number(text.match(/(\d+)\s*minute/)?.[1] ?? 0)
  return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`
}

// --- Statut live (decapi.me) ---------------------------------------------------
export const fetchLive = defineCachedFunction(async (login: string) => {
  try {
    const text = await $fetch<string>(`https://decapi.me/twitch/uptime/${login}`, { responseType: 'text', timeout: 4000 })
    const live = !/offline/i.test(text)
    return { live, uptime: live ? frenchUptime(text) : null }
  } catch {
    return { live: false, uptime: null as string | null }
  }
}, { maxAge: 60, name: 'twitch-live', getKey: (l: string) => l })
