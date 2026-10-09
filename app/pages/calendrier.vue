<script setup lang="ts">
// Le calendrier vit désormais sur /streams : on garde les anciens liens.
const route = useRoute()
await navigateTo({ path: '/streams', query: route.query, hash: '#calendrier' }, { redirectCode: 301, replace: true })
</script>

<template>
  <div />
</template>
