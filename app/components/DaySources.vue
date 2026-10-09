<script setup lang="ts">
import type { SourceKind } from '#shared/utils/kinds'

interface Item {
  id: string
  url: string
  title: string
  source: string
  note: string | null
  kind: SourceKind
  section: string | null
  done_at: string | null
}

const props = defineProps<{ links: Item[]; startedAt?: string | null }>()

const tracking = computed(() => props.links.some(l => l.done_at))

// Les liens sans section n'ont un titre que s'il y a d'autres sections.
const groups = computed(() => {
  const g = groupBySection(props.links)
  return g.map(([name, items]) => [name ?? (g.length > 1 ? 'Autres sources' : null), items] as const)
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <section v-for="[name, items] in groups" :key="name ?? '_'" class="flex flex-col gap-1">
      <h2 v-if="name" class="font-display border-b border-line pb-2 text-xl font-medium uppercase tracking-wide text-accent">
        {{ name }}
      </h2>
      <ul class="divide-y divide-line/60">
        <SourceRow v-for="l in items" :key="l.id" :link="l" :started-at="startedAt" :tracking="tracking" />
      </ul>
    </section>
  </div>
</template>
