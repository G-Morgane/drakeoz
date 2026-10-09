<script setup lang="ts">
import type { SourceKind } from '#shared/utils/kinds'

defineProps<{ kind: SourceKind }>()
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <!-- X -->
    <template v-if="kind === 'x'">
      <path d="M4 4l16 16M20 4L4 20" />
    </template>
    <!-- Instagram -->
    <template v-else-if="kind === 'instagram'">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.8" fill="currentColor" />
    </template>
    <!-- YouTube -->
    <template v-else-if="kind === 'youtube'">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
    </template>
    <!-- TikTok -->
    <template v-else-if="kind === 'tiktok'">
      <path d="M13.5 3v11.2a3.3 3.3 0 1 1-3.3-3.3" />
      <path d="M13.5 3c.4 2.6 2.2 4.4 4.8 4.8" />
    </template>
    <!-- Facebook -->
    <template v-else-if="kind === 'facebook'">
      <path d="M14 8h2.5V4.5H14A3.5 3.5 0 0 0 10.5 8v2.5H8V14h2.5v6.5h3.5V14h2.5l.5-3.5h-3V8.5c0-.3.2-.5.5-.5Z" />
    </template>
    <!-- Bluesky : papillon -->
    <template v-else-if="kind === 'bluesky'">
      <path d="M12 10.5C10.8 8 7.8 3.8 5 3.8c-1.5 0-2 1.3-2 2.6 0 3.5 1.4 7.5 5.2 7.9-3 .5-4 2.3-2.4 4.4 1.8 2.3 4.3.5 6.2-3.3 1.9 3.8 4.4 5.6 6.2 3.3 1.6-2.1.6-3.9-2.4-4.4C19.6 13.9 21 9.9 21 6.4c0-1.3-.5-2.6-2-2.6-2.8 0-5.8 4.2-7 6.7Z" />
    </template>
    <!-- Vidéo -->
    <template v-else-if="kind === 'video'">
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-2.5v9L16 14z" />
    </template>
    <!-- Podcast -->
    <template v-else-if="kind === 'podcast'">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
    </template>
    <!-- PDF, document -->
    <template v-else-if="kind === 'pdf'">
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5M10 13h4M10 16.5h4" />
    </template>
    <!-- Site officiel -->
    <template v-else-if="kind === 'official'">
      <path d="M3 10 12 4l9 6" />
      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
    </template>
    <!-- Autre : lien -->
    <template v-else-if="kind === 'other'">
      <path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
      <path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
    </template>
    <!-- Article -->
    <template v-else>
      <path d="M4 5h13v14H6a2 2 0 0 1-2-2z" />
      <path d="M17 9h3v8a2 2 0 0 1-2 2M7.5 9h6M7.5 12.5h6M7.5 16h4" />
    </template>
  </svg>
</template>
