<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
    <img src="/logo.png" alt="" class="h-24 w-24 rounded-full opacity-80" />
    <p class="label text-accent">Erreur {{ error.statusCode }}</p>
    <h1 class="font-display text-4xl font-semibold uppercase tracking-wide">
      {{ error.statusCode === 404 ? 'Cette page n\'existe pas' : 'Quelque chose a cassé' }}
    </h1>
    <NuxtLink to="/" class="rounded-full bg-accent px-5 py-2 font-medium text-bg hover:opacity-90" @click="clearError()">
      Retour à l'accueil
    </NuxtLink>
  </div>
</template>
