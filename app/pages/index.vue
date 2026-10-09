<script setup lang="ts">
useHead({ title: 'Drakeoz, stream politique et actu tous les matins' })

const [{ data: days }, { data: live }] = await Promise.all([
  useFetch('/api/days', { default: () => [] }),
  useFetch('/api/live', { key: 'live', default: () => ({ live: false, uptime: null as string | null }) }),
])

const latest = computed(() => days.value[0] ?? null)
const recent = computed(() => days.value.slice(0, 3))
const totalSources = computed(() => days.value.reduce((n, d) => n + d.count, 0))
</script>

<template>
  <div class="flex flex-col gap-20">
    <!-- Hero -->
    <section class="flex flex-col items-center gap-8 pt-6 text-center sm:pt-14">
      <div class="relative">
        <img src="/logo.png" alt="Drakeoz" class="h-40 w-40 rounded-full shadow-[0_0_120px_-10px_var(--glow)] ring-2 ring-gold-2/70 ring-offset-4 ring-offset-bg sm:h-52 sm:w-52" />
        <a
          v-if="live.live"
          href="https://www.twitch.tv/drakeoz_"
          target="_blank"
          rel="noopener"
          class="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-lg"
        >
          <span class="h-2 w-2 animate-pulse rounded-full bg-white" /> En direct
        </a>
      </div>
      <div class="flex flex-col gap-4">
        <h1 class="text-gold font-display text-6xl font-bold uppercase leading-none tracking-[0.2em] sm:text-8xl">Drakeoz</h1>
        <p class="label text-accent">Stream politique et actu, tous les matins sur Twitch</p>
        <p class="mx-auto max-w-2xl text-balance text-lg text-muted">
          Revue de presse, réactions à chaud, débats avec le chat. Et toutes les sources citées à l'antenne, rangées ici jour par jour pour que chacun puisse vérifier.
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-3">
        <a href="https://www.twitch.tv/drakeoz_" target="_blank" rel="noopener" class="flex items-center gap-2 !px-5 !py-2.5" :class="live.live ? 'btn-live' : 'btn-primary'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4"><path d="M4.3 2 2 7.3v14.2h5V24h2.8l2.6-2.5h4L22 16V2H4.3Zm15.9 13.1-3 3h-4.8l-2.6 2.5v-2.5H5.8V3.8h14.4v11.3ZM17.3 7h-1.9v5.3h1.9V7Zm-5 0h-1.8v5.3h1.8V7Z" /></svg>
          {{ live.live ? 'Rejoindre le live' : 'La chaîne Twitch' }}
        </a>
        <NuxtLink :to="latest ? `/jour/${latest.date}` : '/streams'" class="btn-ghost flex items-center gap-2 !py-2.5">
          Les sources du dernier stream
        </NuxtLink>
      </div>
    </section>

    <!-- Ce qu'on trouve ici -->
    <section class="grid gap-4 sm:grid-cols-3">
      <NuxtLink to="/streams" class="card flex flex-col gap-3 p-6 transition hover:border-accent/60 hover:bg-surface-2">
        <p class="font-display text-4xl font-semibold text-accent">{{ days.length }}</p>
        <h2 class="font-display text-xl font-medium">Streams archivés</h2>
        <p class="text-sm text-muted">Une page par jour de stream, avec ce qui a été traité et dans quel ordre.</p>
      </NuxtLink>
      <NuxtLink to="/streams#calendrier" class="card flex flex-col gap-3 p-6 transition hover:border-accent/60 hover:bg-surface-2">
        <p class="font-display text-4xl font-semibold text-accent">{{ totalSources }}</p>
        <h2 class="font-display text-xl font-medium">Sources citées</h2>
        <p class="text-sm text-muted">Articles, vidéos, rapports, posts. Chaque lien tel qu'il a été montré à l'antenne.</p>
      </NuxtLink>
      <NuxtLink to="/qui-suis-je" class="card flex flex-col gap-3 p-6 transition hover:border-accent/60 hover:bg-surface-2">
        <p class="font-display text-4xl font-semibold text-accent">?</p>
        <h2 class="font-display text-xl font-medium">Qui suis-je</h2>
        <p class="text-sm text-muted">Le stream, la démarche, et pourquoi tout sourcer.</p>
      </NuxtLink>
    </section>

    <!-- Derniers streams -->
    <section v-if="recent.length" class="flex flex-col gap-5">
      <div class="flex items-end justify-between">
        <h2 class="font-display text-2xl font-medium sm:text-3xl">Derniers streams</h2>
        <NuxtLink to="/streams" class="text-sm font-medium text-accent hover:underline">Tous les streams</NuxtLink>
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <DayCard v-for="d in recent" :key="d.date" :day="d" />
      </div>
    </section>

    <!-- Comment ça marche -->
    <section class="card flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:gap-10">
      <div class="flex-1">
        <p class="label text-accent">Pendant le live</p>
        <h2 class="font-display mt-1 text-2xl font-medium">Une source est citée, elle apparaît ici dans la seconde</h2>
      </div>
      <p class="flex-1 text-muted">
        Chaque lien montré à l'écran est ajouté au fil du stream. La page du jour se met à jour en direct, et garde le minutage pour retrouver le passage dans la rediffusion.
      </p>
    </section>
  </div>
</template>
