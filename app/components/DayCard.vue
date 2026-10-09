<script setup lang="ts">
defineProps<{ day: { date: string; title: string | null; count: number } }>()
</script>

<template>
  <NuxtLink :to="`/jour/${day.date}`" class="card flex flex-col gap-2 p-5 transition hover:border-accent/60 hover:bg-surface-2">
    <p class="label text-accent">{{ formatShort(day.date) }}</p>
    <h3 class="font-display text-xl font-medium leading-tight">
      {{ day.title || 'Stream' }}
    </h3>
    <p class="mt-auto text-sm text-muted">{{ plural(day.count, 'source') }}</p>
  </NuxtLink>
</template>
