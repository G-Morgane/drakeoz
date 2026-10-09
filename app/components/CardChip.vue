<script setup lang="ts">
import type { Rarity } from '#shared/utils/rarity'

// Représentation compacte d'un exemplaire : pastille de rareté, nom, numéro. Pour les listes et les récapitulatifs.
const props = withDefaults(defineProps<{
  card: { name: string; rarity: Rarity; image_url?: string | null; subtitle?: string | null }
  serial?: number | null
  selected?: boolean
  selectable?: boolean
  duplicate?: boolean
  /** Carte que le joueur connecté ne possède pas encore. */
  missing?: boolean
  size?: 'sm' | 'md'
}>(), { serial: null, selected: false, selectable: false, duplicate: false, missing: false, size: 'md' })

const tone: Record<Rarity, string> = {
  commune: 'bg-surface-2 text-muted ring-line',
  rare: 'bg-sky-500/15 text-sky-400 ring-sky-500/50',
  epique: 'bg-fuchsia-500/15 text-fuchsia-400 ring-fuchsia-500/50',
  legendaire: 'bg-amber-400/15 text-amber-300 ring-amber-400/60',
}
const initials = computed(() => props.card.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join(''))
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl border transition"
    :class="[
      size === 'sm' ? 'px-2 py-1.5' : 'px-3 py-2',
      selected ? 'border-accent bg-accent/10' : 'border-line',
      selectable && !selected ? 'hover:border-accent/50 hover:bg-surface-2' : '',
    ]"
  >
    <span class="font-display flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-bold ring-1" :class="tone[card.rarity]">
      <img v-if="card.image_url" :src="card.image_url" alt="" class="h-full w-full object-cover" />
      <template v-else>{{ initials }}</template>
    </span>
    <div class="min-w-0 flex-1 text-left">
      <p class="truncate text-sm font-medium leading-tight">{{ card.name }}</p>
      <p class="truncate text-xs text-muted">
        {{ rarityLabel(card.rarity) }}<span v-if="serial"> · n° {{ serial }}</span>
        <span v-if="duplicate" class="ml-1 rounded bg-accent/15 px-1 text-[10px] text-accent">doublon</span>
        <span v-if="missing" class="ml-1 rounded bg-sky-500/15 px-1 text-[10px] text-sky-400">manquante</span>
      </p>
    </div>
    <span
      v-if="selectable"
      class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition"
      :class="selected ? 'border-accent bg-accent text-bg' : 'border-line text-transparent'"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3"><path d="m5 12 5 5L20 7" /></svg>
    </span>
  </div>
</template>
