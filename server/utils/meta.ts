// Récupère le titre et le nom du média d'une page, pour pré-remplir le formulaire admin.

export interface PageMeta {
  title: string
  siteName: string
  domain: string
  kind: SourceKind
  source: string
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()
}

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
    'i',
  )
  const m = html.match(re)
  const v = m?.[1] ?? m?.[2]
  return v ? decode(v) : null
}

export async function fetchPageMeta(url: string): Promise<PageMeta> {
  const domain = domainOf(url)
  const kind = kindOf(url)
  const fallback: PageMeta = { title: '', siteName: '', domain, kind, source: sourceOf(url, kind) }
  if (!domain) return fallback

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; DrakeozBot/1.0; +https://drakeoz.vercel.app)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'fr-FR,fr;q=0.9',
      },
    })
    if (!res.ok) return fallback
    // Les titres sont dans le <head>, pas besoin de télécharger la page entière.
    const html = (await res.text()).slice(0, 200_000)
    const ogTitle = metaContent(html, 'og:title') ?? metaContent(html, 'twitter:title')
    // La balise <title> finit souvent par " - Le Média" : on retire ce suffixe.
    const rawTitle = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
    const title = ogTitle ?? rawTitle.replace(/\s[|\-\u2013\u2014]\s[^|\-\u2013\u2014]{1,40}$/, '')
    const siteName = metaContent(html, 'og:site_name') ?? ''
    return { title, siteName, domain, kind, source: sourceOf(url, kind, siteName) }
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}
