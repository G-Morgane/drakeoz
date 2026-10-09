<script setup lang="ts">
import type { SourceKind } from '#shared/utils/kinds'

const model = defineModel<SourceKind>({ required: true })
</script>

<template>
  <div class="relative">
    <SourceIcon :kind="model" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
    <select v-model="model" class="input !pl-9">
      <option v-for="k in SOURCE_KINDS" :key="k.value" :value="k.value">{{ k.label }}</option>
    </select>
  </div>
</template>
