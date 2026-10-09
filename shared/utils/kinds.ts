// Types de source, détectés depuis l'URL. Partagé client et serveur.

export type SourceKind =
  | 'article'
  | 'x'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'facebook'
  | 'bluesky'
  | 'video'
  | 'podcast'
  | 'pdf'
  | 'official'
  | 'other'

export const SOURCE_KINDS: { value: SourceKind; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'bluesky', label: 'Bluesky' },
  { value: 'video', label: 'Vidéo' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'pdf', label: 'PDF, document' },
  { value: 'official', label: 'Site officiel' },
  { value: 'other', label: 'Autre' },
]

export function isSourceKind(v: unknown): v is SourceKind {
  return typeof v === 'string' && SOURCE_KINDS.some(k => k.value === v)
}

export function kindLabel(kind: SourceKind): string {
  return SOURCE_KINDS.find(k => k.value === kind)?.label ?? 'Autre'
}

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

const OFFICIAL = [
  'assemblee-nationale.fr', 'senat.fr', 'elysee.fr', 'legifrance.gouv.fr', 'vie-publique.fr',
  'insee.fr', 'conseil-constitutionnel.fr', 'europa.eu', 'europarl.europa.eu', 'ccomptes.fr',
  'conseil-etat.fr', 'hatvp.fr', 'cnil.fr', 'banque-france.fr',
]

export function kindOf(url: string): SourceKind {
  const h = host(url)
  if (!h) return 'other'
  if (/\.pdf(\?|#|$)/i.test(url)) return 'pdf'
  if (h === 'x.com' || h === 'twitter.com' || h.endsWith('.x.com') || h.endsWith('.twitter.com')) return 'x'
  if (h.endsWith('instagram.com')) return 'instagram'
  if (h.endsWith('youtube.com') || h === 'youtu.be') return 'youtube'
  if (h.endsWith('tiktok.com')) return 'tiktok'
  if (h.endsWith('facebook.com') || h === 'fb.watch') return 'facebook'
  if (h === 'bsky.app') return 'bluesky'
  if (h.endsWith('dailymotion.com') || h.endsWith('vimeo.com') || h.endsWith('twitch.tv')) return 'video'
  if (h.endsWith('spotify.com') || h === 'podcasts.apple.com' || h.endsWith('deezer.com') || h.endsWith('soundcloud.com') || h.endsWith('radiofrance.fr')) return 'podcast'
  if (h.endsWith('.gouv.fr') || OFFICIAL.some(d => h === d || h.endsWith(`.${d}`))) return 'official'
  return 'article'
}

/** Nom affiché pour la source : le compte pour les réseaux, le média sinon. */
export function sourceOf(url: string, kind: SourceKind, siteName = ''): string {
  const h = host(url)
  let path: string[] = []
  try {
    path = new URL(url).pathname.split('/').filter(Boolean)
  } catch {
    return h
  }
  const reserved = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'i', 'home', 'search', 'hashtag', 'watch', 'shorts', 'channel', 'c', 'share', 'video'])
  const handle = path[0] && !reserved.has(path[0]) ? path[0].replace(/^@/, '') : ''
  // bsky.app/profile/<handle>/post/<id>
  if (kind === 'bluesky') return path[0] === 'profile' && path[1] ? `@${path[1]}` : 'Bluesky'

  switch (kind) {
    case 'x':
    case 'instagram':
    case 'tiktok':
      return handle ? `@${handle}` : kindLabel(kind)
    case 'youtube':
      return handle && path[0]!.startsWith('@') ? `@${handle}` : 'YouTube'
    case 'facebook':
      return handle ? handle : 'Facebook'
    default:
      return siteName || h
  }
}
