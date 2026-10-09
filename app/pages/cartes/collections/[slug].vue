<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug)

const { data, error } = await useFetch(`/api/game/collections/${encodeURIComponent(slug)}`, { headers: useRequestHeaders(['cookie']) })
if (error.value || !data.value) throw createError({ statusCode: 404, statusMessage: 'Collection introuvable' })

const col = computed(() => data.value!.collection)
const cards = computed(() => data.value!.cards)
const owned = computed(() => cards.value.filter(c => c.owned > 0).length)
const complete = computed(() => cards.value.length > 0 && owned.value === cards.value.length)

useHead({ title: () => `${col.value.name}, collection` })
</script>

<template>
  <div class="flex flex-col gap-8">
    <PageHeader :eyebrow="`Collection ${col.emoji ?? ''}`" :title="col.name">
      <p class="max-w-xl text-muted">{{ col.description }}</p>
      <div class="mt-1 flex items-center gap-3">
        <div class="h-2 w-48 overflow-hidden rounded-full bg-surface-2">
          <div class="h-full rounded-full bg-accent" :style="{ width: `${cards.length ? (owned / cards.length) * 100 : 0}%` }" />
        </div>
        <span class="font-display tabular-nums text-sm">{{ owned }} / {{ cards.length }}</span>
        <span v-if="complete" class="label rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-300">Complète</span>
      </div>
      <template #actions>
        <NuxtLink to="/cartes/collections" class="text-sm font-medium text-accent hover:underline">Toutes les collections</NuxtLink>
      </template>
    </PageHeader>

    <p v-if="!cards.length" class="card border-dashed p-6 text-muted">Les cartes de cette collection arrivent bientôt.</p>
    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <GameCard v-for="c in cards" :key="c.id" :card="c" :locked="!c.owned" :count="c.owned" />
    </div>
  </div>
</template>
