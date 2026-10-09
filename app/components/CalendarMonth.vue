<script setup lang="ts">
export interface CalendarEntry {
  date: string
  title: string | null
  count: number // sources
  replay: boolean
}

const props = defineProps<{
  month: string // "YYYY-MM"
  entries: CalendarEntry[]
  selected?: string | null
}>()
const emit = defineEmits<{ select: [date: string] }>()

const WEEKDAYS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']

const byDate = computed(() => new Map(props.entries.map(e => [e.date, e])))
const today = todayIso()

const cells = computed(() => {
  const [y, m] = props.month.split('-').map(Number)
  const first = new Date(y!, m! - 1, 1)
  const daysInMonth = new Date(y!, m!, 0).getDate()
  // Lundi = 0
  const offset = (first.getDay() + 6) % 7
  const out: ({ iso: string; n: number } | null)[] = Array.from({ length: offset }, () => null)
  for (let n = 1; n <= daysInMonth; n++) {
    out.push({ iso: `${props.month}-${String(n).padStart(2, '0')}`, n })
  }
  while (out.length % 7) out.push(null)
  return out
})
</script>

<template>
  <div class="card overflow-hidden">
    <div class="grid grid-cols-7 border-b border-line bg-surface-2/60">
      <div v-for="w in WEEKDAYS" :key="w" class="label py-2 text-center text-muted">{{ w }}</div>
    </div>
    <div class="grid grid-cols-7">
      <template v-for="(cell, i) in cells" :key="i">
        <div v-if="!cell" class="aspect-square border-b border-r border-line/50 bg-bg/30 sm:aspect-[4/3]" />
        <button
          v-else-if="byDate.get(cell.iso)"
          type="button"
          class="group relative flex aspect-square flex-col justify-between border-b border-r border-line/50 p-2 text-left transition hover:bg-accent/15 sm:aspect-[4/3] sm:p-3"
          :class="[
            cell.iso === selected ? 'bg-accent/15 ring-2 ring-inset ring-gold-2' : cell.iso === today ? 'bg-accent/10' : '',
          ]"
          :aria-pressed="cell.iso === selected"
          :aria-label="`${formatLong(cell.iso)}${byDate.get(cell.iso)!.replay ? ', replay' : ''}${byDate.get(cell.iso)!.count ? `, ${plural(byDate.get(cell.iso)!.count, 'source')}` : ''}`"
          @click="emit('select', cell.iso)"
        >
          <span class="flex items-center justify-between gap-1">
            <span class="font-display text-base font-semibold text-accent sm:text-lg">{{ cell.n }}</span>
            <svg v-if="byDate.get(cell.iso)!.replay" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5 text-gold-2 sm:h-4 sm:w-4"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
          </span>
          <span class="hidden min-w-0 flex-col gap-0.5 sm:flex">
            <span class="line-clamp-2 text-xs leading-snug text-muted group-hover:text-ink">{{ byDate.get(cell.iso)!.title }}</span>
            <span v-if="byDate.get(cell.iso)!.count" class="text-[11px] font-medium text-accent">{{ plural(byDate.get(cell.iso)!.count, 'source') }}</span>
          </span>
          <span class="flex gap-0.5 sm:hidden">
            <span v-for="k in Math.min(byDate.get(cell.iso)!.count, 4)" :key="k" class="h-1 w-1 rounded-full bg-accent" />
          </span>
        </button>
        <div
          v-else
          class="flex aspect-square flex-col border-b border-r border-line/50 p-2 sm:aspect-[4/3] sm:p-3"
          :class="{ 'bg-accent/10': cell.iso === today }"
        >
          <span class="font-display text-base text-muted/60 sm:text-lg">{{ cell.n }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
