<script setup lang="ts">
const networks = useSocials()
</script>

<template>
  <footer>
    <div class="gold-rule" />
    <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
      <p>Les sources des streams de Drakeoz, rangées jour par jour.</p>
      <div class="flex items-center gap-4">
        <ul class="flex items-center gap-1">
          <li v-for="n in networks" :key="n.label">
            <a :href="n.href" target="_blank" rel="noopener" :title="n.label" :aria-label="n.label" class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-2 hover:text-ink">
              <SourceIcon :kind="n.kind" class="h-4 w-4" />
            </a>
          </li>
        </ul>
        <NuxtLink to="/qui-suis-je" class="hover:text-ink">Qui suis-je</NuxtLink>
        <NuxtLink to="/admin" class="hover:text-ink">Admin</NuxtLink>
      </div>
    </div>
  </footer>
</template>
