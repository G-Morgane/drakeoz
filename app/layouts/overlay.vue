<script setup lang="ts">
// Overlay OBS : pas de chrome, fond transparent.
useHead({ bodyAttrs: { class: 'overlay' } })
</script>

<template>
  <slot />
</template>
