<script setup lang="ts">
// Ancienne adresse de la page des streams : on garde les anciens liens.
const route = useRoute()
await navigateTo({ path: '/streams', query: route.query, hash: route.hash }, { redirectCode: 301, replace: true })
</script>

<template>
  <div />
</template>
