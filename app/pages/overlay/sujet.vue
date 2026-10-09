<script setup lang="ts">
// Overlay OBS « sujet en cours ».
//   /overlay/sujet                 affichage seul
//   ?pos=bg|bd|hg|hd               coin (bas-gauche par défaut)
//   ?duree=15                      secondes d'affichage de la carte après une coche
//   ?chat=1#key=MOT_DE_PASSE       écoute aussi le chat et exécute les commandes
// Le mot de passe est dans le fragment (#), il ne quitte jamais le navigateur d'OBS.

definePageMeta({ layout: 'overlay' })
useHead({ title: 'Overlay sujet' })

const route = useRoute()
// ?chaine=login permet d'écouter un autre chat que celui de Drakeoz, pour tester.
const { twitchLogin: defaultLogin } = useRuntimeConfig().public
const twitchLogin = typeof route.query.chaine === 'string' && /^[a-z0-9_]{3,25}$/i.test(route.query.chaine) ? route.query.chaine.toLowerCase() : defaultLogin
const pos = (typeof route.query.pos === 'string' ? route.query.pos : 'bg') as 'bg' | 'bd' | 'hg' | 'hd'
const showFor = Number(route.query.duree) > 0 ? Number(route.query.duree) * 1000 : 15_000
const chatEnabled = route.query.chat === '1'

const date = todayIso()
const { data, refresh } = await useFetch(`/api/days/${date}`, {
  default: () => ({ day: null, links: [] }),
  server: false,
})

const links = computed(() => data.value.links)
const doneCount = computed(() => links.value.filter(l => l.done_at).length)
const current = computed(() => {
  const done = links.value.filter(l => l.done_at)
  if (!done.length) return null
  return done.reduce((a, b) => (a.done_at! > b.done_at! ? a : b))
})

// La carte s'ouvre à chaque nouveau sujet coché, puis se replie en pastille.
const expanded = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | undefined
watch(() => current.value?.id, (id, old) => {
  if (!id || id === old) return
  expanded.value = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => (expanded.value = false), showFor)
})

let poll: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  poll = setInterval(() => refresh(), 5000)
  if (chatEnabled) chat.value = useChatCommands()
})
onUnmounted(() => {
  clearInterval(poll)
  clearTimeout(hideTimer)
  chat.value?.disconnect()
})

// --- Commandes chat --------------------------------------------------------
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined
function say(msg: string) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 4000)
}

// Tout ce qui touche au chat ne vit que dans le navigateur (OBS).
const chat = ref<ReturnType<typeof useChatCommands> | null>(null)

function useChatCommands() {
  const key = new URLSearchParams(window.location.hash.slice(1)).get('key') ?? ''
  const authed = ref(false)
  let section = ''

  async function ensureAuth() {
    if (authed.value) return true
    try {
      await $fetch('/api/auth/login', { method: 'POST', body: { password: key } })
      authed.value = true
    } catch {
      say('Overlay : mot de passe admin refusé')
    }
    return authed.value
  }
  ensureAuth()

  // Jeu de cartes : présence en live (une fois par pseudo et par session) et liaison de compte.
  const seen = new Set<string>()
  async function game(m: ChatMessage): Promise<boolean> {
    if (!(await ensureAuth())) return false
    const login = m.user.toLowerCase()
    if (data.value.day?.started_at && !seen.has(login)) {
      seen.add(login)
      $fetch('/api/game/presence', { method: 'POST', body: { twitchLogin: login } }).catch(() => {})
    }
    const link = m.text.match(/^!lier\s+([a-z0-9]{6})\b/i)
    if (link) {
      try {
        const r = await $fetch('/api/game/link/confirm', { method: 'POST', body: { code: link[1], twitchLogin: login } })
        say(`${m.user} lié au joueur ${r.username}`)
      } catch {
        say(`${m.user} : code inconnu`)
      }
      return true
    }
    return false
  }

  async function run(m: ChatMessage) {
    if (await game(m)) return
    if (!m.isBroadcaster && !m.isMod) return
    const [cmd, ...rest] = m.text.split(/\s+/)
    const arg = rest.join(' ').trim()
    if (!cmd?.startsWith('!')) return

    try {
      switch (cmd.toLowerCase()) {
        case '!src': {
          const [url, ...titleParts] = arg.split(' | ')
          if (!/^https?:\/\//i.test(url ?? '')) return say('!src : lien manquant')
          const link = await $fetch('/api/links', {
            method: 'POST',
            body: { date, url: url!.trim(), title: titleParts.join(' | ').trim(), section },
          })
          say(`Ajouté : ${link.title}`)
          break
        }
        case '!ok': {
          const n = Number(arg)
          const target = n > 0 ? links.value[n - 1] : links.value.find(l => !l.done_at)
          if (!target) return say('!ok : rien à cocher')
          await $fetch(`/api/links/${target.id}`, { method: 'PATCH', body: { done: true } })
          break
        }
        case '!retour': {
          if (!current.value) return
          await $fetch(`/api/links/${current.value.id}`, { method: 'PATCH', body: { done: false } })
          say('Dernière coche annulée')
          break
        }
        case '!top':
          await $fetch(`/api/days/${date}`, { method: 'PATCH', body: { started_at: new Date().toISOString() } })
          say('Top départ')
          break
        case '!section':
          section = arg
          say(section ? `Section : ${section}` : 'Section retirée')
          break
        default:
          return
      }
      await refresh()
    } catch (e: any) {
      say(e?.data?.statusMessage ?? 'Commande échouée')
    }
  }

  const twitch = useTwitchChat(twitchLogin, run)
  twitch.connect()
  return { connected: twitch.connected, authed, disconnect: twitch.disconnect }
}

const corner = {
  bg: 'left-6 bottom-6 items-start',
  bd: 'right-6 bottom-6 items-end',
  hg: 'left-6 top-6 items-start',
  hd: 'right-6 top-6 items-end',
}[pos] ?? 'left-6 bottom-6 items-start'
</script>

<template>
  <div class="dark fixed inset-0 font-sans text-ink">
    <div class="absolute flex max-w-[640px] flex-col gap-3" :class="corner">
      <!-- Carte sujet en cours -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-3 opacity-0"
        leave-active-class="transition duration-300 ease-in"
        leave-to-class="translate-y-3 opacity-0"
      >
        <div v-if="current && expanded" class="flex gap-4 rounded-2xl border border-line bg-surface/95 p-5 shadow-2xl backdrop-blur">
          <KindBadge :kind="current.kind" size="lg" />
          <div class="min-w-0">
            <p class="label text-accent">{{ current.section || 'Sujet en cours' }} · {{ current.source }}</p>
            <p class="mt-1 text-2xl font-semibold leading-tight">{{ current.title }}</p>
            <p v-if="current.note" class="mt-1 text-base text-muted">{{ current.note }}</p>
          </div>
        </div>
      </Transition>

      <!-- Pastille permanente -->
      <div v-if="links.length" class="flex items-center gap-3 rounded-full border border-line bg-surface/95 py-2 pl-3 pr-4 shadow-xl backdrop-blur">
        <img src="/logo.png" alt="" class="h-7 w-7 rounded-full" />
        <span class="font-display text-base uppercase tracking-wider">
          Sujet <span class="text-accent">{{ doneCount }}</span> / {{ links.length }}
        </span>
        <span class="text-sm text-muted">· sources sur le site</span>
        <span
          v-if="chat"
          class="h-2 w-2 rounded-full"
          :class="chat.connected && chat.authed ? 'bg-green-500' : 'bg-red-500'"
          :title="chat.connected ? 'Chat connecté' : 'Chat déconnecté'"
        />
      </div>

      <!-- Retour des commandes chat -->
      <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition" leave-active-class="transition">
        <p v-if="toast" class="rounded-lg bg-ink/90 px-3 py-1.5 text-sm text-bg">{{ toast }}</p>
      </Transition>
    </div>
  </div>
</template>
