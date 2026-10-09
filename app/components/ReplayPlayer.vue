<script setup lang="ts">
import type { ReplayGroup } from '~/composables/useReplays'

const props = defineProps<{ replay: ReplayGroup }>()

// Twitch exige le domaine qui intègre le lecteur.
const parent = useRequestURL().hostname
const part = ref(0)
watch(() => props.replay.key, () => (part.value = 0))
const current = computed(() => props.replay.parts[part.value] ?? props.replay.parts[0]!)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="card aspect-video overflow-hidden !rounded-xl bg-black">
      <iframe
        :key="current.id"
        :src="`https://player.twitch.tv/?video=${current.id}&parent=${parent}&autoplay=false`"
        :title="`Replay : ${current.title}`"
        class="h-full w-full"
        allowfullscreen
      />
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
      <div v-if="replay.parts.length > 1" class="flex flex-wrap gap-1.5">
        <button
          v-for="(p, i) in replay.parts"
          :key="p.id"
          type="button"
          class="rounded-full border px-3 py-1 transition"
          :class="i === part ? 'border-gold-2 bg-accent/15 text-ink' : 'border-line text-muted hover:border-gold-2 hover:text-ink'"
          @click="part = i"
        >
          Partie {{ i + 1 }}<span v-if="p.duration" class="opacity-70">, {{ p.duration }}</span>
        </button>
      </div>
      <span v-else-if="current.duration" class="text-muted">{{ current.duration }}</span>
      <a :href="current.url" target="_blank" rel="noopener" class="font-medium text-accent hover:underline">Ouvrir sur Twitch</a>
    </div>
  </div>
</template>
