export type Rarity = 'commune' | 'rare' | 'epique' | 'legendaire'

export const RARITIES: { value: Rarity; label: string }[] = [
  { value: 'commune', label: 'Commune' },
  { value: 'rare', label: 'Rare' },
  { value: 'epique', label: 'Épique' },
  { value: 'legendaire', label: 'Légendaire' },
]

export const CATEGORIES: { value: string; label: string }[] = [
  { value: 'politique', label: 'Politique' },
  { value: 'streamer', label: 'Streamer' },
  { value: 'evenement', label: 'Événement' },
  { value: 'institution', label: 'Institution' },
  { value: 'meme', label: 'Meme' },
  { value: 'media', label: 'Média' },
  { value: 'parti', label: 'Parti' },
  { value: 'emission', label: 'Émission' },
]

export function rarityLabel(r: Rarity): string {
  return RARITIES.find(x => x.value === r)?.label ?? r
}

export function categoryLabel(c: string): string {
  return CATEGORIES.find(x => x.value === c)?.label ?? c
}
