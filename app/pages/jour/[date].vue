<script setup lang="ts">
const route = useRoute()
const date = computed(() => String(route.params.date))

if (!isValidIso(date.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Date invalide' })
}

const [{ data, refresh }, { data: allDays }] = await Promise.all([
  useFetch(() => `/api/days/${date.value}`, { default: () => ({ day: null, links: [] }) }),
  useFetch('/api/days', { default: () => [] }),
])

// Navigation entre matinales existantes (la liste est triée du plus récent au plus ancien).
const idx = computed(() => allDays.value.findIndex(d => d.date === date.value))
const newer = computed(() => (idx.value > 0 ? allDays.value[idx.value - 1] : null))
const older = computed(() => (idx.value >= 0 ? allDays.value[idx.value + 1] ?? null : null))

const { byDate: replaysByDate } = useReplays()
const replay = computed(() => replaysByDate.value.get(date.value) ?? null)

const title = computed(() => data.value.day?.title)
const startedAt = computed(() => data.value.day?.started_at ?? null)
const doneCount = computed(() => data.value.links.filter(l => l.done_at).length)
const isToday = computed(() => date.value === todayIso())

// Pendant le live, la page se met à jour toute seule pour suivre où en est la matinale.
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (isToday.value) timer = setInterval(() => refresh(), 30_000)
})
onUnmounted(() => clearInterval(timer))
useHead({ title: () => `${formatLong(date.value)}${title.value ? `, ${title.value}` : ''}` })

const copied = ref(false)
async function share() {
  const url = window.location.href
  if (navigator.share) {
    await navigator.share({ title: document.title, url }).catch(() => {})
    return
  }
  await navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <article class="flex flex-col gap-8">
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-3">
        <NuxtLink :to="`/streams?mois=${monthOf(date)}#calendrier`" class="text-sm text-muted hover:text-ink">
          ← {{ formatMonth(monthOf(date)) }}
        </NuxtLink>
        <button type="button" class="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-surface-2" @click="share">
          {{ copied ? 'Lien copié' : 'Partager' }}
        </button>
      </div>
      <PageHeader eyebrow="Stream du" :title="formatLong(date)">
        <p v-if="title" class="text-xl text-muted sm:text-2xl">{{ title }}</p>
      </PageHeader>
      <div v-if="replay" class="flex flex-wrap gap-2">
        <a
          v-for="(part, i) in replay.parts"
          :key="part.id"
          :href="part.url"
          target="_blank"
          rel="noopener"
          class="btn-primary flex items-center gap-2 !px-4 !py-2 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
          {{ replay.parts.length > 1 ? `Replay, partie ${i + 1}` : 'Voir le replay' }}
          <span v-if="part.duration" class="font-normal opacity-70">{{ part.duration }}</span>
        </a>
      </div>
      <p v-if="data.day?.intro" class="mt-2 max-w-3xl whitespace-pre-line leading-relaxed">{{ data.day.intro }}</p>
      <p v-if="startedAt" class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span>Stream lancé à {{ clock(startedAt) }}</span>
        <span v-if="data.links.length">· {{ doneCount }} / {{ plural(data.links.length, 'sujet') }} abordés</span>
        <span v-if="isToday && doneCount < data.links.length" class="flex items-center gap-1.5 text-accent">
          <span class="h-2 w-2 animate-pulse rounded-full bg-accent" /> en direct, la page se met à jour
        </span>
      </p>
    </div>

    <div v-if="data.links.length" class="flex flex-col gap-3">
      <p class="label text-muted">{{ plural(data.links.length, 'source') }}</p>
      <DaySources :links="data.links" :started-at="startedAt" />
    </div>
    <section v-else class="card p-8 text-center text-muted">
      Pas de source enregistrée pour cette date.
    </section>

    <nav class="mt-4 flex justify-between gap-3 border-t border-line pt-6 text-sm">
      <NuxtLink v-if="older" :to="`/jour/${older.date}`" class="flex flex-col gap-0.5 hover:text-accent">
        <span class="text-muted">← Stream précédent</span>
        <span class="font-medium">{{ formatShort(older.date) }}</span>
      </NuxtLink>
      <span v-else />
      <NuxtLink v-if="newer" :to="`/jour/${newer.date}`" class="flex flex-col gap-0.5 text-right hover:text-accent">
        <span class="text-muted">Stream suivant →</span>
        <span class="font-medium">{{ formatShort(newer.date) }}</span>
      </NuxtLink>
    </nav>
  </article>
</template>
