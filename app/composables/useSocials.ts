import type { SourceKind } from '#shared/utils/kinds'

export interface Social {
  kind: SourceKind
  label: string
  href: string
}

/** Les réseaux de Drakeoz, dans l'ordre d'affichage, depuis la config. */
export function useSocials(): Social[] {
  const { socials } = useRuntimeConfig().public
  return [
    { kind: 'video', label: 'Twitch', href: socials.twitch },
    { kind: 'youtube', label: 'YouTube', href: socials.youtube },
    { kind: 'x', label: 'X', href: socials.x },
    { kind: 'bluesky', label: 'Bluesky', href: socials.bluesky },
    { kind: 'instagram', label: 'Instagram', href: socials.instagram },
    { kind: 'tiktok', label: 'TikTok', href: socials.tiktok },
  ]
}
