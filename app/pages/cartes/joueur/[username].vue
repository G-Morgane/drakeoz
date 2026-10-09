<script setup lang="ts">
const route = useRoute()
const username = String(route.params.username)

const { data, error } = await useFetch(`/api/game/players/${encodeURIComponent(username)}`)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Joueur introuvable' })

useHead({ title: () => `${data.value?.profile.username}, collection` })
</script>

<template>
  <div v-if="data" class="flex flex-col gap-8">
    <PageHeader eyebrow="Joueur" :title="data.profile.username">
      <p class="text-muted">{{ plural(data.cards.length, 'carte') }}<span v-if="data.profile.twitch_login"> · Twitch : {{ data.profile.twitch_login }}</span></p>
      <template #actions>
        <NuxtLink to="/cartes/echanges" class="btn-primary !py-1.5 text-sm">Proposer un échange</NuxtLink>
      </template>
    </PageHeader>
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <GameCard v-for="i in data.cards" :key="i.id" :card="i.card as any" :serial="i.serial" />
    </div>
  </div>
</template>
