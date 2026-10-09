<script setup lang="ts">
import type { SourceKind } from '#shared/utils/kinds'

const props = defineProps<{
  link: { url: string; title: string; source: string; note: string | null; kind: SourceKind; done_at: string | null }
  startedAt?: string | null
  /** Vrai si au moins un sujet du jour est coché : on affiche alors l'état de chaque ligne. */
  tracking?: boolean
}>()

const label = computed(() => doneLabel(props.link.done_at, props.startedAt))
const relative = computed(() => Boolean(timecode(props.link.done_at, props.startedAt)))
</script>

<template>
  <li class="flex gap-3 py-3" :class="{ 'opacity-60': tracking && !link.done_at }">
    <KindBadge :kind="link.kind" class="mt-0.5" />
    <div class="min-w-0 flex-1">
      <p class="leading-snug">
        <a :href="link.url" target="_blank" rel="noopener" class="font-medium hover:text-accent hover:underline">{{ link.title }}</a>
        <span class="ml-2 whitespace-nowrap text-sm text-muted">{{ link.source }}</span>
      </p>
      <p v-if="link.note" class="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{{ link.note }}</p>
    </div>
    <span
      v-if="link.done_at"
      class="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 font-display text-sm tabular-nums text-accent"
      :title="relative ? `Abordé à ${label} après le début` : `Abordé à ${label}`"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5"><path d="m5 12 5 5L20 7" /></svg>
      {{ label }}
    </span>
  </li>
</template>
