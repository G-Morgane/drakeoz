<script setup lang="ts">
import type { SourceKind } from '#shared/utils/kinds'

useHead({ title: 'Actualité, toutes les publications' })

const { public: { twitchLogin, xHandle, socials } } = useRuntimeConfig()

const [{ data: live }, { data: feed }] = await Promise.all([
  useFetch('/api/live', { default: () => ({ live: false, uptime: null as string | null }) }),
  useFetch('/api/feed', { default: () => ({ items: [], sources: { youtube: false, bluesky: false, twitch: false } }) }),
])

type Filter = 'all' | 'video' | 'youtube' | 'bluesky'
const filter = ref<Filter>('all')

const pills: { value: Filter; label: string; kind: SourceKind; enabled: boolean }[] = [
  { value: 'all', label: 'Tout', kind: 'other', enabled: true },
  { value: 'video', label: 'Twitch', kind: 'video', enabled: true },
  { value: 'youtube', label: 'YouTube', kind: 'youtube', enabled: feed.value.sources.youtube },
  { value: 'bluesky', label: 'Bluesky', kind: 'bluesky', enabled: feed.value.sources.bluesky },
]

const items = computed(() => (filter.value === 'all' ? feed.value.items : feed.value.items.filter(i => i.kind === filter.value)))
const count = (k: Filter) => (k === 'all' ? feed.value.items.length : feed.value.items.filter(i => i.kind === k).length)

</script>

<template>
  <div class="flex flex-col gap-8">
    <PageHeader eyebrow="Actualité" title="Les dernières publications" display>
      <p class="max-w-xl text-muted">Twitch, YouTube, Bluesky : tout ce que Drakeoz publie, au même endroit, du plus récent au plus ancien.</p>
    </PageHeader>

    <!-- Pilules -->
    <div class="sticky top-[57px] z-10 -mx-4 flex gap-2 overflow-x-auto bg-bg/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <template v-for="p in pills" :key="p.value">
        <button
          v-if="p.enabled"
          type="button"
          class="flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition"
          :class="filter === p.value ? 'border-accent bg-accent text-bg' : 'border-line text-muted hover:bg-surface-2 hover:text-ink'"
          @click="filter = p.value"
        >
          <SourceIcon v-if="p.value !== 'all'" :kind="p.kind" class="h-4 w-4" />
          {{ p.label }}
          <span class="text-xs opacity-70">{{ count(p.value) }}</span>
        </button>
      </template>
      <a
        v-if="xHandle"
        :href="socials.x"
        target="_blank"
        rel="noopener"
        class="flex shrink-0 items-center gap-2 rounded-full border border-dashed border-line px-4 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-ink"
        title="X ne fournit pas de flux gratuit, le lien ouvre le compte"
      >
        <SourceIcon kind="x" class="h-4 w-4" /> X
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3 w-3"><path d="M7 17 17 7M8 7h9v9" /></svg>
      </a>
    </div>

    <!-- En direct -->
    <a
      v-if="live.live && (filter === 'all' || filter === 'video')"
      :href="`https://www.twitch.tv/${twitchLogin}`"
      target="_blank"
      rel="noopener"
      class="card flex items-center gap-4 border-red-600/50 bg-red-600/10 p-5 transition hover:bg-red-600/20"
    >
      <span class="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white">
        <span class="h-3 w-3 animate-pulse rounded-full bg-white" />
      </span>
      <div>
        <p class="font-display text-xl font-semibold uppercase tracking-wide">En direct maintenant sur Twitch</p>
        <p class="text-sm text-muted">Depuis {{ live.uptime }}</p>
      </div>
    </a>

    <!-- Fil, en bento : lignes de hauteur fixe, remplissage dense -->
    <div v-if="items.length" class="grid auto-rows-[6.5rem] grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <a
        v-for="(it, i) in items"
        :key="it.id"
        :href="it.url"
        target="_blank"
        rel="noopener"
        class="card group flex overflow-hidden transition hover:border-accent/60 hover:bg-surface-2"
        :class="[
          i === 0 && it.image ? 'row-span-3 flex-row sm:col-span-2' : it.image ? 'row-span-3 flex-col' : 'row-span-2 flex-col',
        ]"
      >
        <div
          v-if="it.image"
          class="shrink-0 bg-surface-2"
          :class="i === 0 ? 'w-1/2' : 'h-36'"
        >
          <img :src="it.image" :alt="it.kind === 'bluesky' ? '' : it.title" class="h-full w-full object-cover" loading="lazy" />
        </div>
        <div class="flex min-h-0 flex-1 flex-col gap-2 p-4">
          <p class="flex items-center gap-2 text-sm text-muted">
            <KindBadge :kind="it.kind" size="sm" />
            <span class="truncate">{{ it.source }}</span>
            <span class="ml-auto shrink-0">{{ formatRelative(it.date) }}</span>
          </p>
          <p
            class="leading-snug group-hover:text-accent"
            :class="[
              it.kind === 'bluesky' ? 'whitespace-pre-line' : 'font-medium',
              i === 0 && it.image ? 'line-clamp-6 text-lg' : it.image || it.link ? 'line-clamp-3' : 'line-clamp-5',
            ]"
          >{{ it.title }}</p>
          <span v-if="it.link && !it.image" class="flex items-center gap-2 truncate rounded-lg border border-line px-3 py-1.5 text-xs text-muted">
            <SourceIcon kind="other" class="h-3.5 w-3.5 shrink-0" /> {{ it.link.title }}
          </span>
          <p v-if="it.meta" class="mt-auto truncate text-xs text-muted">{{ it.meta }}</p>
        </div>
      </a>
    </div>
    <p v-else-if="filter === 'video' && !feed.sources.twitch" class="card border-dashed p-6 text-sm text-muted">
      Les rediffusions Twitch apparaîtront ici une fois l'app Twitch configurée. En attendant,
      <a :href="socials.twitch" target="_blank" rel="noopener" class="text-accent hover:underline">la chaîne</a>.
    </p>
    <p v-else class="card border-dashed p-6 text-sm text-muted">Rien à afficher pour le moment.</p>
  </div>
</template>
