<script setup lang="ts">
useHead({ title: 'Collections à compléter' })

const { data: collections } = await useFetch('/api/game/collections', { default: () => [], headers: useRequestHeaders(['cookie']) })

const totalOwned = computed(() => collections.value.reduce((n, c) => n + c.owned, 0))
const total = computed(() => collections.value.reduce((n, c) => n + c.total, 0))
</script>

<template>
  <div class="flex flex-col gap-8">
    <PageHeader eyebrow="Collections" title="À compléter" display>
      <p class="max-w-xl text-muted">
        Chaque collection rassemble un thème. Complète-la et tu gagnes un booster cadeau.
        <span v-if="total"> Pour l'instant : {{ totalOwned }} / {{ total }} cartes.</span>
      </p>
    </PageHeader>

    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="c in collections"
        :key="c.slug"
        :to="`/cartes/collections/${c.slug}`"
        class="card group flex flex-col gap-4 p-6 transition hover:border-accent/60 hover:bg-surface-2"
        :class="{ 'ring-2 ring-amber-400/60': c.rewarded }"
      >
        <div class="flex items-start gap-4">
          <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-3xl ring-1 ring-line">{{ c.emoji || '🃏' }}</span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-display truncate text-2xl font-medium group-hover:text-accent">{{ c.name }}</h2>
              <span v-if="c.rewarded" class="label shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-300">Complète</span>
            </div>
            <p class="mt-1 text-sm text-muted">{{ c.description }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div class="h-full rounded-full bg-accent transition-all" :style="{ width: `${c.total ? (c.owned / c.total) * 100 : 0}%` }" />
          </div>
          <span class="font-display shrink-0 tabular-nums text-sm">{{ c.owned }} / {{ c.total }}</span>
        </div>
        <p v-if="!c.total" class="text-xs text-muted">Aucune carte en circulation pour l'instant.</p>
      </NuxtLink>
    </div>
  </div>
</template>
