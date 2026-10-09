<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  /** Titre en capitales espacées (pages de section) plutôt qu'en casse normale (pages datées). */
  display?: boolean
}>()
</script>

<template>
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="flex flex-col gap-3">
      <p class="label text-accent">{{ eyebrow }}</p>
      <h1
        class="font-display font-semibold leading-none"
        :class="display ? 'text-gold text-4xl uppercase tracking-wide sm:text-5xl' : 'text-3xl sm:text-5xl'"
      >
        {{ title }}
      </h1>
      <slot />
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
