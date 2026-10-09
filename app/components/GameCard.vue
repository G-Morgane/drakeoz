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

// Couleur de bordure et de lueur par rareté.
const skin: Record<Rarity, { ring: string; glow: string; badge: string }> = {
  commune: { ring: 'ring-line', glow: '', badge: 'bg-surface-2 text-muted' },
  rare: { ring: 'ring-sky-500/70', glow: 'shadow-[0_0_30px_-8px_rgb(14_165_233/0.6)]', badge: 'bg-sky-500/20 text-sky-400' },
  epique: { ring: 'ring-fuchsia-500/70', glow: 'shadow-[0_0_30px_-8px_rgb(217_70_239/0.6)]', badge: 'bg-fuchsia-500/20 text-fuchsia-400' },
  legendaire: { ring: 'ring-amber-400/80', glow: 'shadow-[0_0_40px_-6px_rgb(251_191_36/0.7)]', badge: 'bg-amber-400/20 text-amber-300' },
}
const s = computed(() => skin[props.card.rarity] ?? skin.commune)

const initials = computed(() => props.card.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join(''))
const stats = computed(() => Object.entries(props.card.stats ?? {}).slice(0, 3))
</script>

<template>
  <div
    class="relative flex aspect-[5/7] flex-col overflow-hidden rounded-2xl bg-surface ring-2 transition"
    :class="[s.ring, locked ? 'opacity-40 grayscale' : s.glow, selected ? 'outline outline-4 outline-offset-2 outline-accent scale-[1.03]' : '']"
  >
    <!-- Visuel -->
    <div class="relative flex-1 bg-gradient-to-br from-bg-deep via-surface-2 to-bg">
      <img v-if="card.image_url" :src="card.image_url" :alt="card.name" class="h-full w-full object-cover" loading="lazy" />
      <span v-else class="font-display absolute inset-0 flex items-center justify-center text-6xl font-bold uppercase text-accent/40">{{ initials }}</span>
      <span class="label absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px]" :class="s.badge">{{ rarityLabel(card.rarity) }}</span>
      <span v-if="count > 1" class="font-display absolute right-2 top-2 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-bg">×{{ count }}</span>
      <span v-if="selected" class="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-bg shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m5 12 5 5L20 7" /></svg>
      </span>
    </div>
    <!-- Texte -->
    <div class="flex flex-col gap-1 p-3">
      <p class="label truncate text-[10px] text-accent">{{ card.faction || categoryLabel(card.category) }}</p>
      <p class="font-display truncate text-base font-semibold leading-tight">{{ card.name }}</p>
      <p v-if="card.subtitle && !compact" class="truncate text-xs text-muted">{{ card.subtitle }}</p>
      <div v-if="stats.length && !compact" class="mt-1 flex flex-col gap-0.5">
        <p v-for="[k, v] in stats" :key="k" class="flex justify-between text-xs">
          <span class="truncate text-muted">{{ k }}</span>
          <span class="font-display tabular-nums">{{ v }}</span>
        </p>
      </div>
      <p v-if="serial" class="mt-1 text-right text-[10px] text-muted">n° {{ serial }}</p>
    </div>
  </div>
</template>
