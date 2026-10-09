<script setup lang="ts">
import type { Rarity } from '#shared/utils/rarity'

interface CardDef {
  name: string
  subtitle?: string | null
  category: string
  faction?: string | null
  rarity: Rarity
  image_url?: string | null
  flavor?: string | null
  stats?: Record<string, number | string>
}

const props = withDefaults(defineProps<{
  card: CardDef
  serial?: number | null
  /** Grisée : pas encore possédée. */
  locked?: boolean
  count?: number
  selected?: boolean
  compact?: boolean
}>(), { serial: null, locked: false, count: 0, selected: false, compact: false })

// Teinte unique et stable par carte, dérivée du nom.
const hue = computed(() => {
  let h = 0
  for (const c of props.card.name) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
})

const initials = computed(() => props.card.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join(''))
const stats = computed(() => Object.entries(props.card.stats ?? {}).slice(0, 3))

/** Une valeur numérique de 0 à 100 devient une barre ; sinon on affiche le nombre seul. */
function bar(v: number | string): number | null {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null
}

const rarityClass: Record<Rarity, string> = {
  commune: 'gc-commune',
  rare: 'gc-rare',
  epique: 'gc-epique',
  legendaire: 'gc-legendaire',
}
</script>

<template>
  <div
    class="gc group relative aspect-[5/7] select-none rounded-2xl p-[3px] transition-transform duration-300"
    :class="[rarityClass[card.rarity] ?? 'gc-commune', locked ? 'opacity-40 grayscale' : 'hover:-translate-y-1', selected ? 'scale-[1.03] outline outline-4 outline-offset-2 outline-accent' : '']"
    :style="{ '--hue': hue }"
  >
    <div class="relative flex h-full w-full flex-col overflow-hidden rounded-[13px] bg-surface">
      <!-- Visuel -->
      <div class="gc-art relative flex-1 overflow-hidden">
        <img v-if="card.image_url" :src="card.image_url" :alt="card.name" class="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <template v-else>
          <!-- Motif par catégorie -->
          <svg class="absolute inset-0 h-full w-full opacity-[0.14]" aria-hidden="true">
            <defs>
              <pattern id="p-institution" width="18" height="40" patternUnits="userSpaceOnUse"><rect x="6" y="0" width="6" height="40" fill="currentColor" /></pattern>
              <pattern id="p-media" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="2.2" fill="currentColor" /></pattern>
              <pattern id="p-parti" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="20" fill="currentColor" /></pattern>
              <pattern id="p-meme" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M0 12 L6 6 L12 12 L18 6 L24 12" fill="none" stroke="currentColor" stroke-width="2" /></pattern>
              <pattern id="p-streamer" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" stroke-width="2" /><circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="2" /></pattern>
              <pattern id="p-evenement" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 16 L16 0 M-4 4 L4 -4 M12 20 L20 12" stroke="currentColor" stroke-width="2" /></pattern>
              <pattern id="p-politique" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M11 2 L20 11 L11 20 L2 11 Z" fill="none" stroke="currentColor" stroke-width="1.5" /></pattern>
            </defs>
            <rect width="100%" height="100%" :fill="`url(#p-${['institution','media','parti','meme','streamer','evenement','politique'].includes(card.category) ? card.category : card.category === 'emission' ? 'streamer' : 'politique'})`" />
          </svg>
          <!-- Monogramme -->
          <span class="gc-mono font-display absolute inset-0 flex items-center justify-center text-[clamp(2.5rem,22cqw,5rem)] font-bold uppercase leading-none tracking-tight">{{ initials }}</span>
        </template>
        <!-- Voile bas pour la lisibilité des badges et transition vers le texte -->
        <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface to-transparent" />

        <span class="label absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] backdrop-blur" :class="`gc-badge`">{{ rarityLabel(card.rarity) }}</span>
        <span v-if="serial" class="font-display absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] tabular-nums text-white/90 backdrop-blur">n° {{ serial }}</span>
        <span v-if="count > 1" class="font-display absolute right-2 bottom-2 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-bg">×{{ count }}</span>
        <span v-if="selected" class="absolute left-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-bg shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m5 12 5 5L20 7" /></svg>
        </span>
      </div>

      <!-- Texte -->
      <div class="flex flex-col gap-1 px-3 pb-3 pt-1">
        <p class="label truncate text-[10px] text-accent">{{ card.faction || categoryLabel(card.category) }}</p>
        <p class="font-display truncate text-base font-semibold uppercase leading-tight tracking-wide">{{ card.name }}</p>
        <p v-if="card.subtitle && !compact" class="truncate text-[11px] italic text-muted">{{ card.subtitle }}</p>

        <div v-if="stats.length && !compact" class="mt-1.5 flex flex-col gap-1">
          <div v-for="[k, v] in stats" :key="k" class="flex items-center gap-2 text-[11px]">
            <span class="w-[46%] truncate text-muted">{{ k }}</span>
            <span v-if="bar(v) !== null" class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span class="gc-bar block h-full rounded-full" :style="{ width: `${bar(v)}%` }" />
            </span>
            <span class="font-display w-9 shrink-0 text-right tabular-nums">{{ typeof v === 'number' ? v.toLocaleString('fr-FR') : v }}</span>
          </div>
        </div>

        <p v-if="card.flavor && !compact" class="mt-1.5 line-clamp-2 border-t border-line/70 pt-1.5 text-[11px] leading-snug text-muted">{{ card.flavor }}</p>
      </div>

      <!-- Reflet au survol -->
      <div class="gc-sheen pointer-events-none absolute inset-0" />
    </div>
  </div>
</template>
