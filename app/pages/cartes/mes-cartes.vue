<script setup lang="ts">
useHead({ title: 'Mes cartes' })

const { me, refreshMe } = useGame()
await refreshMe()

const { data: instances } = await useFetch('/api/game/collection', { default: () => [], immediate: Boolean(me.value?.player), headers: useRequestHeaders(['cookie']) })

// Regroupe les doublons par carte.
const grouped = computed(() => {
  const map = new Map<string, { card: any; items: { id: string; serial: number }[] }>()
  for (const i of instances.value) {
    const card = i.card as any
    if (!map.has(card.id)) map.set(card.id, { card, items: [] })
    map.get(card.id)!.items.push({ id: i.id, serial: i.serial })
  }
  const order = { legendaire: 0, epique: 1, rare: 2, commune: 3 } as Record<string, number>
  return [...map.values()].sort((a, b) => order[a.card.rarity] - order[b.card.rarity] || a.card.name.localeCompare(b.card.name))
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <PageHeader eyebrow="Mes cartes" :title="me?.player?.username ?? 'Mes cartes'">
      <p class="text-muted">{{ plural(instances.length, 'exemplaire') }}, {{ plural(grouped.length, 'carte différente', 'cartes différentes') }}</p>
      <template #actions>
        <NuxtLink to="/cartes/collections" class="text-sm font-medium text-accent hover:underline">Voir les collections</NuxtLink>
      </template>
    </PageHeader>

    <p v-if="!me?.player" class="card border-dashed p-6 text-muted">Connecte-toi pour voir tes cartes.</p>
    <p v-else-if="!grouped.length" class="card border-dashed p-6 text-muted">Aucune carte pour l'instant. Ouvre ton booster du jour.</p>

    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <div v-for="g in grouped" :key="g.card.id" class="flex flex-col gap-1">
        <GameCard :card="g.card" :count="g.items.length" :serial="g.items[0]!.serial" />
        <p v-if="g.items.length > 1" class="truncate text-center text-xs text-muted">n° {{ g.items.map(i => i.serial).join(', ') }}</p>
      </div>
    </div>
  </div>
</template>
