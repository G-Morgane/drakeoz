<script setup lang="ts">
import type { CalendarEntry } from '~/components/CalendarMonth.vue'

useHead({ title: 'Les streams, toutes les sources' })

const route = useRoute()
const router = useRouter()

const { data: days } = await useFetch('/api/days', { default: () => [] })

const { groups: replays, byDate: replaysByDate } = useReplays()
const { data: live } = useFetch('/api/live', { key: 'live', default: () => ({ live: false, uptime: null as string | null }) })
const channel = useRuntimeConfig().public.twitchLogin
const host = useRequestURL().hostname

// Dernier stream : le plus récent entre les jours saisis et les replays Twitch.
const latestDate = computed(() => {
  const a = days.value[0]?.date ?? null
  const b = replays.value.find(r => r.date)?.date ?? null
  return !a ? b : !b ? a : a > b ? a : b
})
const latestDayInfo = computed(() => days.value.find(d => d.date === latestDate.value) ?? null)
const latestReplay = computed(() => (latestDate.value ? replaysByDate.value.get(latestDate.value) ?? null : null))
const latestTitle = computed(() => latestDayInfo.value?.title || latestReplay.value?.title || null)

const totalSources = computed(() => days.value.reduce((n, d) => n + d.count, 0))
const totalStreams = computed(() => new Set([...days.value.map(d => d.date), ...replaysByDate.value.keys()]).size)

// Calendrier : le mois et le jour choisis vivent dans l'URL (?mois=YYYY-MM&jour=YYYY-MM-DD).
const month = computed(() => {
  const q = route.query.mois
  return typeof q === 'string' && /^\d{4}-\d{2}$/.test(q) ? q : monthOf(latestDate.value ?? todayIso())
})

const { data: monthDays } = await useFetch('/api/days', {
  query: computed(() => ({ month: month.value })),
  default: () => [],
})

// Un jour du calendrier = des sources, un replay, ou les deux.
const entries = computed<CalendarEntry[]>(() => {
  const map = new Map<string, CalendarEntry>()
  for (const d of monthDays.value) map.set(d.date, { date: d.date, title: d.title, count: d.count, replay: false })
  for (const [date, r] of replaysByDate.value) {
    if (monthOf(date) !== month.value) continue
    const e = map.get(date)
    if (e) {
      e.replay = true
      e.title ??= r.title
    } else {
      map.set(date, { date, title: r.title, count: 0, replay: true })
    }
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date))
})

// Jour choisi : celui de l'URL, sinon le plus récent du mois.
const selected = computed(() => {
  const q = route.query.jour
  if (typeof q === 'string' && entries.value.some(e => e.date === q)) return q
  return entries.value[0]?.date ?? null
})
const selectedEntry = computed(() => entries.value.find(e => e.date === selected.value) ?? null)
const selectedReplay = computed(() => (selected.value ? replaysByDate.value.get(selected.value) ?? null : null))

const { data: selectedDay } = await useAsyncData(
  'streams-selected-day',
  () => (selected.value && selectedEntry.value?.count ? $fetch(`/api/days/${selected.value}`) : Promise.resolve({ day: null, links: [] })),
  { watch: [selected], default: () => ({ day: null, links: [] }) },
)

function select(date: string) {
  router.replace({ query: { mois: monthOf(date), jour: date }, hash: '#jour' })
}
function go(delta: number) {
  router.replace({ query: { mois: shiftMonth(month.value, delta) }, hash: '#calendrier' })
}
function today() {
  router.replace({ query: { mois: monthOf(todayIso()) }, hash: '#calendrier' })
}
</script>

<template>
  <div class="flex flex-col gap-12">
    <PageHeader eyebrow="Les streams" title="Revoir et vérifier" display>
      <p class="max-w-xl text-muted">
        Chaque stream avec son replay et les sources citées à l'antenne : articles, vidéos, rapports. Pour retrouver, vérifier, relire.
      </p>
      <dl class="mt-2 grid grid-cols-3 gap-4 sm:flex sm:gap-x-10">
        <div>
          <dt class="label text-muted">Streams</dt>
          <dd class="font-display text-3xl font-semibold text-gold">{{ totalStreams }}</dd>
        </div>
        <div>
          <dt class="label text-muted">Sources citées</dt>
          <dd class="font-display text-3xl font-semibold text-gold">{{ totalSources }}</dd>
        </div>
        <div>
          <dt class="label text-muted">Replays dispo</dt>
          <dd class="font-display text-3xl font-semibold text-gold">{{ replaysByDate.size }}</dd>
        </div>
      </dl>
    </PageHeader>

    <!-- En direct : le lecteur du live -->
    <section v-if="live.live" class="card flex flex-col gap-5 border-red-600/40 p-4 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="flex items-center gap-2 font-display text-xl font-medium uppercase tracking-wide">
          <span class="relative flex h-2.5 w-2.5">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          En direct
          <span v-if="live.uptime" class="font-sans text-sm normal-case tracking-normal text-muted">depuis {{ live.uptime }}</span>
        </p>
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <NuxtLink :to="`/jour/${todayIso()}`" class="font-medium text-accent hover:underline">Les sources en direct</NuxtLink>
          <a :href="`https://www.twitch.tv/${channel}`" target="_blank" rel="noopener" class="btn-live !px-4 !py-1.5">Ouvrir sur Twitch</a>
        </div>
      </div>
      <div class="aspect-video overflow-hidden rounded-xl bg-black">
        <iframe :src="`https://player.twitch.tv/?channel=${channel}&parent=${host}&autoplay=false`" title="Le live de Drakeoz" class="h-full w-full" allowfullscreen />
      </div>
    </section>

    <!-- Sinon : le dernier stream, qui s'ouvre dans le calendrier -->
    <section v-else-if="latestDate" class="card group grid overflow-hidden transition hover:border-gold-2/60 md:grid-cols-[1.3fr_1fr]">
      <button type="button" class="relative block aspect-video overflow-hidden bg-surface-2 md:aspect-auto md:min-h-64" :aria-label="`Regarder le stream du ${formatLong(latestDate)}`" @click="select(latestDate)">
        <img v-if="latestReplay?.image" :src="latestReplay.image" alt="" class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span v-else class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-deep to-surface">
          <img src="/logo.png" alt="" class="h-20 w-20 rounded-full opacity-60 ring-1 ring-gold-2/40" />
        </span>
        <span class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span class="absolute inset-0 flex items-center justify-center">
          <span class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-gold-1 to-gold-3 text-on-gold shadow-xl transition group-hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="ml-1 h-7 w-7"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
          </span>
        </span>
        <span v-if="latestReplay?.parts[0]?.duration" class="absolute bottom-3 right-3 rounded-md bg-black/75 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
          {{ latestReplay.parts.length > 1 ? `${latestReplay.parts.length} parties` : latestReplay.parts[0].duration }}
        </span>
      </button>
      <div class="flex flex-col gap-4 p-6 sm:p-8">
        <p class="label text-accent">Dernier stream</p>
        <div>
          <h2 class="font-display text-2xl font-medium sm:text-3xl">{{ formatLong(latestDate) }}</h2>
          <p v-if="latestTitle" class="mt-2 line-clamp-3 text-muted">{{ latestTitle }}</p>
        </div>
        <p class="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          <span v-if="latestDayInfo?.count">{{ plural(latestDayInfo.count, 'source') }}</span>
          <span v-if="latestReplay">Replay disponible</span>
        </p>
        <div class="mt-auto flex flex-wrap items-center gap-3">
          <button type="button" class="btn-primary text-sm" @click="select(latestDate)">
            {{ latestReplay ? 'Regarder le replay' : 'Voir les sources' }}
          </button>
          <NuxtLink v-if="latestDayInfo?.count" :to="`/jour/${latestDate}`" class="text-sm font-medium text-accent hover:underline">Page du jour</NuxtLink>
        </div>
      </div>
    </section>

    <section v-else class="card flex flex-col items-center gap-3 p-10 text-center">
      <p class="font-display text-2xl">Aucun stream pour l'instant</p>
      <p class="text-muted">Les replays et les sources apparaîtront ici.</p>
    </section>

    <div class="gold-rule" />

    <section id="calendrier" class="flex scroll-mt-24 flex-col gap-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="label text-accent">Le calendrier</p>
          <h2 class="font-display mt-1 text-2xl font-medium capitalize sm:text-3xl">{{ formatMonth(month) }}</h2>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="flex h-10 w-10 items-center justify-center rounded-full border border-line transition hover:border-gold-2" aria-label="Mois précédent" @click="go(-1)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4"><path d="m15 6-6 6 6 6" /></svg>
          </button>
          <button type="button" class="btn-ghost !px-4 !py-2 text-sm" @click="today">
            Aujourd'hui
          </button>
          <button type="button" class="flex h-10 w-10 items-center justify-center rounded-full border border-line transition hover:border-gold-2" aria-label="Mois suivant" @click="go(1)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4"><path d="m9 6 6 6-6 6" /></svg>
          </button>
        </div>
      </div>

      <CalendarMonth :month="month" :entries="entries" :selected="selected" @select="select" />

      <p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span class="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5 text-gold-2"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>
          replay disponible
        </span>
        <span>Clique sur un jour pour voir le replay et les sources. Twitch garde les replays quelques semaines seulement.</span>
      </p>

      <article v-if="selected && selectedEntry" id="jour" class="card scroll-mt-24 flex flex-col gap-6 p-5 sm:p-8">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div class="min-w-0">
            <p class="label text-accent">Stream du</p>
            <h3 class="font-display mt-1 text-2xl font-medium sm:text-3xl">{{ formatLong(selected) }}</h3>
            <p v-if="selectedEntry.title" class="mt-1 text-muted">{{ selectedEntry.title }}</p>
          </div>
          <NuxtLink v-if="selectedEntry.count" :to="`/jour/${selected}`" class="text-sm font-medium text-accent hover:underline">
            Voir la page du jour
          </NuxtLink>
        </div>

        <ReplayPlayer v-if="selectedReplay" :replay="selectedReplay" />
        <p v-else class="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Plus de replay disponible sur Twitch pour ce jour.
        </p>

        <div v-if="selectedEntry.count" class="flex flex-col gap-3">
          <p class="label text-muted">{{ plural(selectedEntry.count, 'source') }}</p>
          <p v-if="selectedDay.day?.intro" class="max-w-3xl whitespace-pre-line text-muted">{{ selectedDay.day.intro }}</p>
          <DaySources :links="selectedDay.links" :started-at="selectedDay.day?.started_at" />
        </div>
        <p v-else class="text-sm text-muted">Pas de source enregistrée pour ce stream.</p>
      </article>

      <p v-else class="card p-8 text-center text-muted">Aucun stream ce mois-ci.</p>
    </section>
  </div>
</template>
