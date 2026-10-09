<script setup lang="ts">
import type { SourceKind } from '#shared/utils/kinds'

const props = withDefaults(defineProps<{ kind: SourceKind; size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })

const box = { sm: 'h-6 w-6 rounded-md', md: 'h-7 w-7 rounded-lg', lg: 'h-12 w-12 rounded-xl' }
const icon = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6' }
</script>

<template>
  <span class="flex shrink-0 items-center justify-center bg-surface-2 text-accent ring-1 ring-line" :class="box[props.size]" :title="kindLabel(kind)">
    <SourceIcon :kind="kind" :class="icon[props.size]" />
  </span>
</template>
