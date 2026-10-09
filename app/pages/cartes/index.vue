<script setup lang="ts">
useHead({ title: 'Les cartes, collectionne la matinale' })

const { user, me, refreshMe, signUp, signIn, signInWithTwitch, linkTwitch, signOut } = useGame()
const { twitchAuth } = useRuntimeConfig().public
const twitchError = ref('')
async function viaTwitch(link = false) {
  twitchError.value = ''
  try {
    await (link ? linkTwitch() : signInWithTwitch())
  } catch (e: any) {
    twitchError.value = /provider/i.test(e?.message ?? '') ? 'Connexion Twitch pas encore activée côté Supabase' : (e?.message ?? 'Échec')
  }
}
await refreshMe()

// --- Connexion / inscription -------------------------------------------------
const mode = ref<'login' | 'signup'>('signup')
const form = reactive({ email: '', password: '', username: '' })
const authError = ref('')
const authNotice = ref('')
const busy = ref(false)

async function submit() {
  authError.value = ''
  busy.value = true
  try {
    if (mode.value === 'signup') {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) throw new Error('Pseudo : 3 à 20 caractères, lettres, chiffres et _')
      const loggedIn = await signUp(form.email, form.password, form.username)
      if (!loggedIn) {
        authNotice.value = 'Compte créé. Un mail de confirmation vient de partir : clique sur le lien, puis connecte-toi ici.'
        mode.value = 'login'
      }
    } else {
      await signIn(form.email, form.password)
    }
  } catch (e: any) {
    authError.value = translateAuthError(e?.message)
  } finally {
    busy.value = false
  }
}

function translateAuthError(msg?: string): string {
  const m = msg ?? ''
  if (/invalid login credentials/i.test(m)) return 'Email ou mot de passe incorrect'
  if (/rate limit/i.test(m)) return 'Trop d\'inscriptions en peu de temps, réessaie dans une heure'
  if (/already registered/i.test(m)) return 'Un compte existe déjà avec cet email'
  if (/is invalid/i.test(m)) return 'Adresse email refusée'
  if (/not confirmed/i.test(m)) return 'Email pas encore confirmé, regarde ta boîte mail'
  if (/at least 6/i.test(m)) return 'Mot de passe : 6 caractères minimum'
  return m || 'Échec, réessaie'
}

// --- Boosters ------------------------------------------------------------
const opening = ref(false)
const revealed = ref<{ id: string; serial: number; card: any }[] | null>(null)
const rewards = ref<{ slug: string; name: string; emoji: string | null }[]>([])
const flipped = ref<Set<string>>(new Set())
const packError = ref('')

async function claimDaily() {
  packError.value = ''
  try {
    const grant = await $fetch('/api/game/packs/claim', { method: 'POST' })
    await open(grant.id)
  } catch (e: any) {
    packError.value = e?.data?.statusMessage ?? 'Impossible de récupérer le booster'
  }
}

async function open(grantId: string) {
  packError.value = ''
  opening.value = true
  try {
    const res = await $fetch('/api/game/packs/open', { method: 'POST', body: { grantId } })
    revealed.value = res.cards
    rewards.value = res.rewards ?? []
    flipped.value = new Set()
    await refreshMe()
  } catch (e: any) {
    packError.value = e?.data?.statusMessage ?? 'Impossible d\'ouvrir le booster'
  } finally {
    opening.value = false
  }
}

function flip(id: string) {
  flipped.value = new Set([...flipped.value, id])
}

const packLabel: Record<string, string> = { daily: 'Booster du jour', live: 'Booster de présence en live', quiz: 'Booster quiz', gift: 'Cadeau' }

// --- Liaison Twitch --------------------------------------------------------
const linkBusy = ref(false)
async function newLinkCode() {
  linkBusy.value = true
  try {
    await $fetch('/api/game/link', { method: 'POST' })
    await refreshMe()
  } finally {
    linkBusy.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-10">
    <!-- Non connecté : pitch + formulaire -->
    <template v-if="!me?.player">
      <PageHeader eyebrow="Les cartes" title="Collectionne la matinale" display>
        <p class="max-w-xl text-muted">
          Un booster gratuit par jour, des cartes sur la politique française et la sphère Twitch, des raretés, et un marché d'échanges entre viewers. Zéro euro, jamais.
        </p>
      </PageHeader>

      <div class="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div class="grid grid-cols-3 gap-3 sm:gap-4">
          <GameCard :card="{ name: 'Drakeoz', subtitle: 'Le matin, tous les matins', category: 'streamer', faction: 'La matinale', rarity: 'legendaire', stats: { Café: 99, Sources: 95 } }" />
          <GameCard :card="{ name: 'Motion de censure', subtitle: 'Article 49.2', category: 'evenement', faction: 'Constitution', rarity: 'rare', stats: { Seuil: 289, Suspense: 80 } }" />
          <GameCard :card="{ name: 'Le Chat', subtitle: 'Juge, jury et bourreau', category: 'meme', faction: 'La matinale', rarity: 'epique', stats: { Vitesse: 97, Nuance: 12 } }" />
        </div>

        <form class="card flex flex-col gap-4 self-start p-6" @submit.prevent="submit">
          <div class="flex rounded-full bg-surface-2 p-1 text-sm">
            <button type="button" class="flex-1 rounded-full py-1.5 font-medium" :class="mode === 'signup' ? 'bg-accent text-bg' : 'text-muted'" @click="mode = 'signup'">Créer un compte</button>
            <button type="button" class="flex-1 rounded-full py-1.5 font-medium" :class="mode === 'login' ? 'bg-accent text-bg' : 'text-muted'" @click="mode = 'login'">Se connecter</button>
          </div>
          <label v-if="mode === 'signup'" class="flex flex-col gap-1 text-sm">
            <span class="text-muted">Pseudo</span>
            <input v-model="form.username" type="text" required minlength="3" maxlength="20" class="input" placeholder="Visible par les autres joueurs" />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-muted">Email</span>
            <input v-model="form.email" type="email" required autocomplete="email" class="input" />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-muted">Mot de passe</span>
            <input v-model="form.password" type="password" required minlength="6" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" class="input" />
          </label>
          <p v-if="authError" class="text-sm text-red-500">{{ authError }}</p>
          <p v-if="authNotice" class="rounded-lg bg-accent/15 px-3 py-2 text-sm text-accent">{{ authNotice }}</p>
          <button type="submit" class="btn-primary" :disabled="busy">{{ mode === 'signup' ? 'Créer mon compte et ouvrir mon premier booster' : 'Se connecter' }}</button>
          <template v-if="twitchAuth">
            <div class="flex items-center gap-3 text-xs text-muted"><span class="h-px flex-1 bg-line" />ou<span class="h-px flex-1 bg-line" /></div>
            <button type="button" class="flex items-center justify-center gap-2 rounded-full bg-[#9146FF] px-5 py-2.5 font-medium text-white hover:opacity-90" @click="viaTwitch(false)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4"><path d="M4.3 2 2 7.3v14.2h5V24h2.8l2.6-2.5h4L22 16V2H4.3Zm15.9 13.1-3 3h-4.8l-2.6 2.5v-2.5H5.8V3.8h14.4v11.3ZM17.3 7h-1.9v5.3h1.9V7Zm-5 0h-1.8v5.3h1.8V7Z" /></svg>
              Continuer avec Twitch
            </button>
            <p v-if="twitchError" class="text-sm text-red-500">{{ twitchError }}</p>
          </template>
          <p class="text-xs text-muted">L'email sert uniquement à retrouver ton compte. Tu pourras lier ton compte Twitch ensuite.</p>
        </form>
      </div>
    </template>

    <!-- Connecté : tableau de bord -->
    <template v-else>
      <PageHeader eyebrow="Mes boosters" :title="me.player.username">
        <p class="text-muted">
          {{ plural(me.owned, 'carte') }} possédée{{ me.owned > 1 ? 's' : '' }}
          <template v-if="me.pendingTrades"> · <NuxtLink to="/cartes/echanges" class="text-accent hover:underline">{{ plural(me.pendingTrades, 'échange') }} en attente</NuxtLink></template>
        </p>
      </PageHeader>

      <!-- Boosters -->
      <section class="card flex flex-col gap-4 p-6">
        <h2 class="font-display text-xl font-medium">Boosters</h2>
        <div class="flex flex-wrap gap-3">
          <button v-if="me.dailyAvailable" type="button" class="btn-primary" :disabled="opening" @click="claimDaily">Ouvrir le booster du jour</button>
          <span v-else class="rounded-full border border-dashed border-line px-4 py-2 text-sm text-muted">Booster du jour récupéré, reviens demain</span>
          <button v-for="p in me.packs" :key="p.id" type="button" class="btn-primary !bg-accent-2" :disabled="opening" @click="open(p.id)">
            Ouvrir : {{ packLabel[p.kind] ?? p.kind }}
          </button>
        </div>
        <p v-if="packError" class="text-sm text-red-500">{{ packError }}</p>
        <p class="text-sm text-muted">Un booster gratuit chaque jour. Un de plus si tu parles dans le chat pendant le stream, une fois ton compte Twitch lié.</p>
      </section>

      <!-- Révélation -->
      <section v-if="revealed" class="flex flex-col gap-4">
        <h2 class="font-display text-xl font-medium">Clique pour retourner tes cartes</h2>
        <div v-for="r in rewards" :key="r.slug" class="card flex items-center gap-3 border-amber-400/50 bg-amber-400/10 p-4">
          <span class="text-2xl">{{ r.emoji || '🏆' }}</span>
          <p class="text-sm"><b>Collection « {{ r.name }} » complète.</b> Un booster cadeau t'attend au-dessus.</p>
        </div>
        <div class="grid grid-cols-3 gap-3 sm:gap-6">
          <button v-for="c in revealed" :key="c.id" type="button" class="[perspective:1000px]" @click="flip(c.id)">
            <div class="relative aspect-[5/7] transition-transform duration-500 [transform-style:preserve-3d]" :class="{ '[transform:rotateY(180deg)]': flipped.has(c.id) }">
              <div class="absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-bg-deep ring-2 ring-line [backface-visibility:hidden]">
                <img src="/logo.png" alt="" class="h-20 w-20 rounded-full opacity-80" />
              </div>
              <div class="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <GameCard :card="c.card" :serial="c.serial" />
              </div>
            </div>
          </button>
        </div>
      </section>

      <!-- Liaison Twitch -->
      <section class="card flex flex-col gap-3 p-6">
        <h2 class="font-display text-xl font-medium">Compte Twitch</h2>
        <p v-if="me.player.twitch_login" class="text-sm">
          Lié à <b>{{ me.player.twitch_login }}</b>. Parle dans le chat pendant le live, ton booster de présence arrive tout seul.
        </p>
        <template v-else>
          <template v-if="twitchAuth">
            <p class="text-sm text-muted">Pour gagner le booster de présence, lie ton compte Twitch.</p>
            <div>
              <button type="button" class="flex items-center gap-2 rounded-full bg-[#9146FF] px-5 py-2 text-sm font-medium text-white hover:opacity-90" @click="viaTwitch(true)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4"><path d="M4.3 2 2 7.3v14.2h5V24h2.8l2.6-2.5h4L22 16V2H4.3Zm15.9 13.1-3 3h-4.8l-2.6 2.5v-2.5H5.8V3.8h14.4v11.3ZM17.3 7h-1.9v5.3h1.9V7Zm-5 0h-1.8v5.3h1.8V7Z" /></svg>
                Lier mon compte Twitch
              </button>
            </div>
            <p v-if="twitchError" class="text-sm text-red-500">{{ twitchError }}</p>
            <p class="text-xs text-muted">Ou l'ancienne méthode, par le chat :</p>
          </template>
          <p v-else class="text-sm text-muted">Pour gagner le booster de présence, lie ton compte Twitch : génère un code, puis tape dans le chat de Drakeoz pendant un live :</p>
          <div class="flex flex-wrap items-center gap-3">
            <code v-if="me.player.link_code" class="rounded-lg bg-surface-2 px-4 py-2 font-mono text-lg tracking-widest">!lier {{ me.player.link_code }}</code>
            <button type="button" class="rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2" :disabled="linkBusy" @click="newLinkCode">
              {{ me.player.link_code ? 'Nouveau code' : 'Générer un code' }}
            </button>
          </div>
        </template>
      </section>
    </template>
  </div>
</template>
