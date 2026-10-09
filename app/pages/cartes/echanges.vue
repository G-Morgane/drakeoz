<script setup lang="ts">
useHead({ title: 'Échanges de cartes' })

const { me, refreshMe } = useGame()
await refreshMe()

const headers = useRequestHeaders(['cookie'])
const { data: trades, refresh } = await useFetch('/api/game/trades', { default: () => [], immediate: Boolean(me.value?.player), headers })
const { data: mine, refresh: refreshMine } = await useFetch('/api/game/collection', { default: () => [], immediate: Boolean(me.value?.player), headers })

const RARITY_ORDER: Record<string, number> = { legendaire: 0, epique: 1, rare: 2, commune: 3 }
function sortInstances<T extends { card: any; serial: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => RARITY_ORDER[a.card.rarity] - RARITY_ORDER[b.card.rarity] || a.card.name.localeCompare(b.card.name) || a.serial - b.serial)
}
function duplicates(list: { card: any }[]): Set<string> {
  const seen = new Map<string, number>()
  for (const i of list) seen.set(i.card.id, (seen.get(i.card.id) ?? 0) + 1)
  return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id))
}

// --- Nouvelle proposition ----------------------------------------------------
const target = ref('')
const theirs = ref<{ profile: any; cards: any[] } | null>(null)
const lookupError = ref('')
const offered = ref<Set<string>>(new Set())
const requested = ref<Set<string>>(new Set())
const message = ref('')
const sending = ref(false)
const sendError = ref('')
const onlyDuplicates = ref(false)

const myDuplicates = computed(() => duplicates(mine.value as any[]))
const mineSorted = computed(() => {
  const list = sortInstances(mine.value as any[])
  return onlyDuplicates.value ? list.filter(i => myDuplicates.value.has(i.card.id)) : list
})
const theirsSorted = computed(() => (theirs.value ? sortInstances(theirs.value.cards) : []))
// Les cartes de l'autre que je ne possède pas encore : celles qu'il est logique de demander.
const myCardIds = computed(() => new Set((mine.value as any[]).map(i => i.card.id)))

const offeredItems = computed(() => (mine.value as any[]).filter(i => offered.value.has(i.id)))
const requestedItems = computed(() => theirsSorted.value.filter(i => requested.value.has(i.id)))

async function lookup() {
  lookupError.value = ''
  theirs.value = null
  requested.value = new Set()
  if (!target.value.trim()) return
  try {
    theirs.value = await $fetch(`/api/game/players/${encodeURIComponent(target.value.trim())}`)
    if (theirs.value?.profile.username === me.value?.player?.username) {
      theirs.value = null
      lookupError.value = 'C\'est toi. Cherche un autre joueur.'
    }
  } catch (e: any) {
    lookupError.value = e?.data?.statusMessage ?? 'Joueur introuvable'
  }
}

function toggleIn(set: Ref<Set<string>>, id: string) {
  const next = new Set(set.value)
  next.has(id) ? next.delete(id) : next.add(id)
  set.value = next
}
const toggleOffered = (id: string) => toggleIn(offered, id)
const toggleRequested = (id: string) => toggleIn(requested, id)

function resetBuilder() {
  offered.value = new Set()
  requested.value = new Set()
  message.value = ''
  theirs.value = null
  target.value = ''
}

async function propose() {
  sendError.value = ''
  sending.value = true
  try {
    await $fetch('/api/game/trades', {
      method: 'POST',
      body: { to: theirs.value?.profile.username, offered: [...offered.value], requested: [...requested.value], message: message.value },
    })
    resetBuilder()
    await Promise.all([refresh(), refreshMe()])
  } catch (e: any) {
    sendError.value = e?.data?.statusMessage ?? 'Échec de la proposition'
  } finally {
    sending.value = false
  }
}

// --- Réponses -------------------------------------------------------------------
const actError = ref('')
const acting = ref<string | null>(null)
async function act(id: string, action: 'accept' | 'decline' | 'cancel') {
  actError.value = ''
  acting.value = id
  try {
    await $fetch(`/api/game/trades/${id}`, { method: 'POST', body: { action } })
    resetBuilder()
    await Promise.all([refresh(), refreshMe(), refreshMine()])
  } catch (e: any) {
    actError.value = e?.data?.statusMessage ?? 'Action impossible'
  } finally {
    acting.value = null
  }
}

const incoming = computed(() => trades.value.filter(t => t.status === 'pending' && !t.mine))
const outgoing = computed(() => trades.value.filter(t => t.status === 'pending' && t.mine))
const closed = computed(() => trades.value.filter(t => t.status !== 'pending'))
const statusLabel: Record<string, string> = { accepted: 'Accepté', declined: 'Refusé', cancelled: 'Annulé', pending: 'En attente' }
const fallbackCard = { name: 'Carte inconnue', rarity: 'commune' as const }
</script>

<template>
  <div class="flex flex-col gap-10">
    <PageHeader eyebrow="Échanges" title="Le marché">
      <p class="text-muted">Propose tes doublons contre les cartes qui te manquent. L'autre joueur accepte ou refuse.</p>
    </PageHeader>

    <p v-if="!me?.player" class="card border-dashed p-6 text-muted">Connecte-toi pour échanger.</p>

    <template v-else>
      <!-- Reçus -->
      <section class="flex flex-col gap-3">
        <h2 class="font-display text-xl font-medium">Propositions reçues <span class="text-muted">({{ incoming.length }})</span></h2>
        <p v-if="!incoming.length" class="text-sm text-muted">Personne ne t'a rien proposé pour l'instant.</p>
        <p v-if="actError" class="text-sm text-red-500">{{ actError }}</p>
        <div v-for="t in incoming" :key="t.id" class="card flex flex-col gap-4 p-4 sm:p-5">
          <p class="text-sm"><b>{{ t.from.username }}</b> te propose<span v-if="t.message" class="text-muted"> · « {{ t.message }} »</span></p>
          <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
            <div class="flex flex-col gap-1.5">
              <p class="label text-muted">Tu reçois</p>
              <CardChip v-for="i in t.offered" :key="i.id" :card="i.card ?? fallbackCard" :serial="i.serial" size="sm" />
              <p v-if="!t.offered.length" class="text-sm text-muted">Rien</p>
            </div>
            <span class="hidden self-center text-2xl text-muted sm:block">⇄</span>
            <div class="flex flex-col gap-1.5">
              <p class="label text-muted">Tu donnes</p>
              <CardChip v-for="i in t.requested" :key="i.id" :card="i.card ?? fallbackCard" :serial="i.serial" size="sm" />
              <p v-if="!t.requested.length" class="text-sm text-muted">Rien, c'est un cadeau</p>
            </div>
          </div>
          <div class="flex justify-end gap-2 text-sm">
            <button type="button" class="rounded-full border border-line px-4 py-1.5 hover:bg-surface-2" :disabled="acting === t.id" @click="act(t.id, 'decline')">Refuser</button>
            <button type="button" class="btn-primary !py-1.5" :disabled="acting === t.id" @click="act(t.id, 'accept')">Accepter</button>
          </div>
        </div>
      </section>

      <!-- Constructeur -->
      <section class="card flex flex-col gap-5 p-4 sm:p-6">
        <div class="flex flex-col gap-3">
          <h2 class="font-display text-xl font-medium">Proposer un échange</h2>
          <form class="flex gap-2" @submit.prevent="lookup">
            <input v-model="target" type="text" placeholder="Pseudo du joueur" class="input" />
            <button type="submit" class="shrink-0 rounded-full border border-line px-4 text-sm font-medium hover:bg-surface-2">Chercher</button>
          </form>
          <p v-if="lookupError" class="text-sm text-red-500">{{ lookupError }}</p>
          <p v-if="!theirs && !lookupError" class="text-sm text-muted">Tape le pseudo d'un joueur pour voir ses cartes et composer l'échange.</p>
        </div>

        <template v-if="theirs">
          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Mes cartes -->
            <div class="flex flex-col gap-2 rounded-xl border border-line bg-bg/40 p-3">
              <div class="flex items-center justify-between gap-2">
                <p class="label text-accent">Tu donnes <span class="text-muted">({{ offered.size }})</span></p>
                <label class="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
                  <input v-model="onlyDuplicates" type="checkbox" class="accent-[var(--accent)]" /> Mes doublons
                </label>
              </div>
              <p v-if="!mineSorted.length" class="py-6 text-center text-sm text-muted">{{ onlyDuplicates ? 'Aucun doublon.' : 'Tu n\'as aucune carte.' }}</p>
              <div class="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
                <button v-for="i in mineSorted" :key="i.id" type="button" class="text-left" @click="toggleOffered(i.id)">
                  <CardChip :card="i.card" :serial="i.serial" :selected="offered.has(i.id)" :duplicate="myDuplicates.has(i.card.id)" selectable />
                </button>
              </div>
            </div>
            <!-- Ses cartes -->
            <div class="flex flex-col gap-2 rounded-xl border border-line bg-bg/40 p-3">
              <div class="flex items-center justify-between gap-2">
                <p class="label text-accent">Tu demandes à {{ theirs.profile.username }} <span class="text-muted">({{ requested.size }})</span></p>
                <NuxtLink :to="`/cartes/joueur/${theirs.profile.username}`" class="text-xs text-muted hover:text-ink">Voir sa collection</NuxtLink>
              </div>
              <p v-if="!theirsSorted.length" class="py-6 text-center text-sm text-muted">Ce joueur n'a aucune carte.</p>
              <div class="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
                <button v-for="i in theirsSorted" :key="i.id" type="button" class="text-left" @click="toggleRequested(i.id)">
                  <CardChip :card="i.card" :serial="i.serial" :selected="requested.has(i.id)" :missing="!myCardIds.has(i.card.id)" selectable />
                </button>
              </div>
            </div>
          </div>

          <!-- Récapitulatif -->
          <div class="sticky bottom-3 flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface p-4 shadow-xl">
            <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div class="flex flex-wrap gap-1.5">
                <span class="label mr-1 self-center text-muted">Tu donnes</span>
                <span v-for="i in offeredItems" :key="i.id" class="rounded-full bg-surface-2 px-2.5 py-1 text-xs">{{ i.card.name }} <span class="text-muted">n° {{ i.serial }}</span></span>
                <span v-if="!offeredItems.length" class="self-center text-xs text-muted">rien</span>
              </div>
              <span class="hidden text-xl text-muted sm:block">⇄</span>
              <div class="flex flex-wrap gap-1.5">
                <span class="label mr-1 self-center text-muted">Tu reçois</span>
                <span v-for="i in requestedItems" :key="i.id" class="rounded-full bg-surface-2 px-2.5 py-1 text-xs">{{ i.card.name }} <span class="text-muted">n° {{ i.serial }}</span></span>
                <span v-if="!requestedItems.length" class="self-center text-xs text-muted">rien</span>
              </div>
            </div>
            <div class="flex flex-col gap-2 sm:flex-row">
              <input v-model="message" type="text" maxlength="280" placeholder="Un mot pour accompagner (facultatif)" class="input" />
              <button type="button" class="btn-primary shrink-0" :disabled="sending || (!offered.size && !requested.size)" @click="propose">Envoyer</button>
            </div>
            <p v-if="sendError" class="text-sm text-red-500">{{ sendError }}</p>
          </div>
        </template>
      </section>

      <!-- Envoyés -->
      <section v-if="outgoing.length" class="flex flex-col gap-3">
        <h2 class="font-display text-xl font-medium">Tes propositions en attente <span class="text-muted">({{ outgoing.length }})</span></h2>
        <div v-for="t in outgoing" :key="t.id" class="card flex flex-wrap items-center gap-3 p-4 text-sm">
          <span>À <b>{{ t.to.username }}</b> :</span>
          <span class="text-muted">{{ t.offered.map((i: any) => i.card?.name ?? '?').join(', ') || 'rien' }}</span>
          <span class="text-muted">⇄</span>
          <span class="text-muted">{{ t.requested.map((i: any) => i.card?.name ?? '?').join(', ') || 'rien' }}</span>
          <button type="button" class="ml-auto rounded-full border border-line px-3 py-1 hover:bg-surface-2" :disabled="acting === t.id" @click="act(t.id, 'cancel')">Annuler</button>
        </div>
      </section>

      <!-- Historique -->
      <section v-if="closed.length" class="flex flex-col gap-3">
        <h2 class="font-display text-xl font-medium">Historique</h2>
        <ul class="divide-y divide-line/60 text-sm">
          <li v-for="t in closed" :key="t.id" class="flex flex-wrap items-center gap-2 py-2">
            <span class="label rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">{{ statusLabel[t.status] }}</span>
            <span>{{ t.mine ? `Avec ${t.to.username}` : `De ${t.from.username}` }}</span>
            <span class="text-muted">· {{ t.offered.map((i: any) => i.card?.name ?? '?').join(', ') || 'rien' }} contre {{ t.requested.map((i: any) => i.card?.name ?? '?').join(', ') || 'rien' }}</span>
            <span class="ml-auto text-muted">{{ formatRelative(t.resolved_at ?? t.created_at) }}</span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
