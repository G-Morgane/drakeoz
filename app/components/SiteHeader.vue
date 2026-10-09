<script setup lang="ts">
const route = useRoute()
const me = useState<{ player: { username: string } | null } | null>('game-me', () => null)
const { signOut } = useGame()
const twitch = useRuntimeConfig().public.socials.twitch

const main = [
  { to: '/streams', label: 'Streams' },
  { to: '/actu', label: 'Actualité' },
]
const cartes = [
  { to: '/cartes', label: 'Mes boosters', hint: 'Le booster du jour et les bonus' },
  { to: '/cartes/collections', label: 'Collections', hint: 'À compléter, façon Pokédex' },
  { to: '/cartes/mes-cartes', label: 'Mes cartes', hint: 'Tout ce que tu possèdes' },
  { to: '/cartes/echanges', label: 'Échanges', hint: 'Le marché entre joueurs' },
]
const about = { to: '/qui-suis-je', label: 'Qui suis-je' }

// Statut live, rafraîchi pendant que la page est ouverte.
const { data: live, refresh: refreshLive } = useFetch('/api/live', { key: 'live', default: () => ({ live: false, uptime: null as string | null }) })
let liveTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => (liveTimer = setInterval(refreshLive, 120_000)))
onBeforeUnmount(() => clearInterval(liveTimer))

const inCartes = computed(() => route.path.startsWith('/cartes'))

// Panneau mobile
const open = ref(false)
watch(() => route.fullPath, () => (open.value = false))

async function logout() {
  await signOut()
  if (inCartes.value) navigateTo('/cartes')
}

const link = 'relative px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink'
const active = '!text-ink after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-gradient-to-r after:from-transparent after:via-gold-2 after:to-transparent'
</script>

<template>
  <header class="sticky top-0 z-20 bg-bg/75 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
      <NuxtLink to="/" class="group flex items-center gap-3">
        <img src="/logo.png" alt="" class="h-10 w-10 rounded-full ring-1 ring-gold-2/60 transition group-hover:ring-gold-1" />
        <span class="font-display text-lg font-semibold uppercase tracking-[0.3em] text-gold" :class="{ 'hidden sm:inline': live.live }">Drakeoz</span>
      </NuxtLink>

      <!-- Grand écran -->
      <nav class="hidden items-center md:flex">
        <NuxtLink v-for="item in main" :key="item.to" :to="item.to" :class="link" :active-class="active">
          {{ item.label }}
        </NuxtLink>
        <NavDropdown label="Cartes" :items="cartes" :active="inCartes" :class="link">
          <div v-if="me?.player" class="mt-1 flex items-center justify-between border-t border-line px-3 pb-1 pt-2 text-xs text-muted">
            <span>Connecté : <b class="text-ink">{{ me.player.username }}</b></span>
            <button type="button" class="hover:text-ink" @click="logout">Déconnexion</button>
          </div>
        </NavDropdown>
        <NuxtLink :to="about.to" :class="link" :active-class="active">{{ about.label }}</NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <a
          v-if="live.live"
          :href="twitch"
          target="_blank"
          rel="noopener"
          class="btn-live flex items-center gap-2 !px-4 !py-1.5 text-sm"
          :title="live.uptime ? `En direct depuis ${live.uptime}` : 'En direct sur Twitch'"
        >
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          En direct
        </a>
        <a v-else :href="twitch" target="_blank" rel="noopener" class="btn-primary hidden items-center gap-2 !px-4 !py-1.5 text-sm md:flex">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5"><path d="M4.3 2 2 7.3v14.2h5V24h2.8l2.6-2.5h4L22 16V2H4.3Zm15.9 13.1-3 3h-4.8l-2.6 2.5v-2.5H5.8V3.8h14.4v11.3ZM17.3 7h-1.9v5.3h1.9V7Zm-5 0h-1.8v5.3h1.8V7Z" /></svg>
          Twitch
        </a>
        <ThemeToggle />
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink hover:border-gold-2 md:hidden"
          :aria-expanded="open"
          :aria-label="open ? 'Fermer le menu' : 'Ouvrir le menu'"
          @click="open = !open"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="h-4.5 w-4.5">
            <path v-if="open" d="M6 6l12 12M18 6 6 18" />
            <path v-else d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </button>
      </div>
    </div>
    <div class="gold-rule" />

    <!-- Mobile : panneau déroulant -->
    <Transition enter-active-class="transition duration-200" enter-from-class="-translate-y-2 opacity-0" leave-active-class="transition duration-150" leave-to-class="-translate-y-2 opacity-0">
      <nav v-if="open" class="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto bg-bg px-4 pb-6 pt-4 md:hidden">
        <ul class="flex flex-col">
          <li v-for="item in [...main, about]" :key="item.to">
            <NuxtLink :to="item.to" class="flex items-center justify-between border-b border-line/60 py-3 font-display text-xl uppercase tracking-[0.12em]" active-class="text-gold">
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
        <p class="label mt-6 text-accent">Cartes</p>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <NuxtLink v-for="it in cartes" :key="it.to" :to="it.to" class="card flex flex-col gap-0.5 p-3 text-sm" exact-active-class="!border-gold-2">
            <span class="font-medium">{{ it.label }}</span>
            <span class="text-xs text-muted">{{ it.hint }}</span>
          </NuxtLink>
        </div>
        <div v-if="me?.player" class="mt-4 flex items-center justify-between text-xs text-muted">
          <span>Connecté : <b class="text-ink">{{ me.player.username }}</b></span>
          <button type="button" class="hover:text-ink" @click="logout">Déconnexion</button>
        </div>
        <a :href="twitch" target="_blank" rel="noopener" class="mt-6 flex justify-center" :class="live.live ? 'btn-live' : 'btn-primary'">{{ live.live ? 'Rejoindre le live' : 'La chaîne Twitch' }}</a>
      </nav>
    </Transition>
  </header>
</template>
