<script setup lang="ts">
import type { SourceKind } from '#shared/utils/kinds'

useHead({ title: 'Admin, saisie des sources' })

// --- Session ---------------------------------------------------------------
const { data: me, refresh: refreshMe } = await useFetch('/api/auth/me', { default: () => ({ admin: false }) })
const password = ref('')
const loginError = ref('')

async function login() {
  loginError.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { password: password.value } })
    password.value = ''
    await refreshMe()
    await refresh()
  } catch {
    loginError.value = 'Mot de passe incorrect'
  }
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await refreshMe()
}

// --- Jour en cours de saisie ----------------------------------------------
const date = ref(todayIso())
const { data, refresh } = await useFetch(() => `/api/days/${date.value}`, {
  default: () => ({ day: null, links: [] }),
  immediate: me.value.admin,
  watch: [date],
})

const grouped = computed(() => groupBySection(data.value.links))
const sections = computed(() => grouped.value.map(([name]) => name).filter((n): n is string => n !== null))

const dayTitle = ref('')
const dayIntro = ref('')
watch(
  () => data.value.day,
  (d) => {
    dayTitle.value = d?.title ?? ''
    dayIntro.value = d?.intro ?? ''
  },
  { immediate: true },
)

// --- Top départ et coches -----------------------------------------------------
const startedAt = computed(() => data.value.day?.started_at ?? null)
const startTime = ref('')
watch(startedAt, (v) => { startTime.value = clock(v) ?? '' }, { immediate: true })

async function setStart(iso: string | null) {
  await $fetch(`/api/days/${date.value}`, { method: 'PATCH', body: { started_at: iso } })
  await refresh()
}

function startNow() {
  return setStart(new Date().toISOString())
}

/** Corrige l'heure de début à la main ("09:03") sur la date du jour saisi. */
function applyStartTime() {
  const m = startTime.value.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return
  const d = fromIso(date.value)
  d.setHours(Number(m[1]), Number(m[2]), 0, 0)
  return setStart(d.toISOString())
}

async function toggleDone(link: { id: string; done_at: string | null }) {
  await $fetch(`/api/links/${link.id}`, { method: 'PATCH', body: { done: !link.done_at } })
  await refresh()
}

const doneCount = computed(() => data.value.links.filter(l => l.done_at).length)
const chaptersCopied = ref(false)
async function copyChapters() {
  await navigator.clipboard.writeText(youtubeChapters(data.value.links, startedAt.value))
  chaptersCopied.value = true
  setTimeout(() => (chaptersCopied.value = false), 1500)
}

// --- Overlay OBS -----------------------------------------------------------
const origin = ref('')
onMounted(() => { origin.value = window.location.origin })
const overlayUrl = computed(() => `${origin.value}/overlay/sujet?pos=bg`)
const overlayChatUrl = computed(() => `${origin.value}/overlay/sujet?pos=bg&chat=1#key=TON_MOT_DE_PASSE`)
const copiedUrl = ref('')
async function copyUrl(u: string) {
  await navigator.clipboard.writeText(u)
  copiedUrl.value = u
  setTimeout(() => (copiedUrl.value = ''), 1500)
}

const daySaved = ref(false)
async function saveDay() {
  await $fetch(`/api/days/${date.value}`, { method: 'PATCH', body: { title: dayTitle.value, intro: dayIntro.value } })
  daySaved.value = true
  setTimeout(() => (daySaved.value = false), 1500)
  await refresh()
}

// --- Ajout d'un lien --------------------------------------------------------
const form = reactive({ url: '', title: '', source: '', note: '', kind: 'article' as SourceKind, section: '' })
const fetchingMeta = ref(false)
const adding = ref(false)
const addError = ref('')
const urlInput = ref<HTMLInputElement | null>(null)

async function fillMeta() {
  const url = form.url.trim()
  if (!/^https?:\/\//i.test(url)) return
  form.kind = kindOf(url)
  if (!form.source) form.source = sourceOf(url, form.kind)
  if (form.title) return
  fetchingMeta.value = true
  try {
    const meta = await $fetch('/api/meta', { method: 'POST', body: { url } })
    if (!form.title) form.title = meta.title
    form.source = meta.source || form.source
  } catch {
    // Pas grave, il remplira à la main.
  } finally {
    fetchingMeta.value = false
  }
}

async function addLink() {
  addError.value = ''
  adding.value = true
  try {
    await $fetch('/api/links', { method: 'POST', body: { date: date.value, ...form } })
    // On garde la section : les liens suivants vont souvent au même endroit.
    form.url = ''
    form.title = ''
    form.source = ''
    form.note = ''
    form.kind = 'article'
    await refresh()
    urlInput.value?.focus()
  } catch (e: any) {
    addError.value = e?.data?.statusMessage ?? 'Impossible d\'ajouter ce lien'
  } finally {
    adding.value = false
  }
}

async function removeLink(id: string) {
  if (!confirm('Supprimer ce lien ?')) return
  await $fetch(`/api/links/${id}`, { method: 'DELETE' })
  await refresh()
}

// --- Édition inline ---------------------------------------------------------
const editingId = ref<string | null>(null)
const edit = reactive({ title: '', source: '', note: '', kind: 'article' as SourceKind, section: '' })

function startEdit(link: { id: string; title: string; source: string; note: string | null; kind: SourceKind; section: string | null }) {
  editingId.value = link.id
  edit.title = link.title
  edit.source = link.source
  edit.note = link.note ?? ''
  edit.kind = link.kind
  edit.section = link.section ?? ''
}

async function saveEdit() {
  if (!editingId.value) return
  await $fetch(`/api/links/${editingId.value}`, { method: 'PATCH', body: { ...edit } })
  editingId.value = null
  await refresh()
}
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-8">
    <!-- Connexion -->
    <form v-if="!me.admin" class="card mx-auto mt-10 flex w-full max-w-sm flex-col gap-4 p-6" @submit.prevent="login">
      <img src="/logo.png" alt="" class="mx-auto h-16 w-16 rounded-full" />
      <h1 class="font-display text-center text-2xl font-semibold uppercase tracking-wide">Admin</h1>
      <label class="flex flex-col gap-1 text-sm">
        <span class="text-muted">Mot de passe</span>
        <input v-model="password" type="password" autocomplete="current-password" required class="input" />
      </label>
      <p v-if="loginError" class="text-sm text-red-500">{{ loginError }}</p>
      <button type="submit" class="btn-primary">Se connecter</button>
    </form>

    <template v-else>
      <PageHeader eyebrow="Saisie des sources" :title="formatLong(date)">
        <template #actions>
          <NuxtLink to="/admin/cartes" class="text-sm text-muted hover:text-ink">Cartes</NuxtLink>
          <input v-model="date" type="date" class="input" />
          <button type="button" class="text-sm text-muted hover:text-ink" @click="logout">Déconnexion</button>
        </template>
      </PageHeader>

      <!-- Top départ -->
      <div class="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div class="flex items-center gap-3">
          <span class="h-2.5 w-2.5 rounded-full" :class="startedAt ? 'animate-pulse bg-accent' : 'bg-line'" />
          <template v-if="startedAt">
            <span class="text-sm">Matinale lancée à</span>
            <input v-model="startTime" type="time" class="input !w-auto !py-1" @change="applyStartTime" />
            <span class="text-sm text-muted">· {{ doneCount }} / {{ data.links.length }} abordés</span>
          </template>
          <span v-else class="text-sm text-muted">Pas encore lancée. Le top départ sert à calculer les timecodes.</span>
        </div>
        <div class="flex items-center gap-2">
          <button v-if="startedAt" type="button" class="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-surface-2" :disabled="!doneCount" @click="copyChapters">
            {{ chaptersCopied ? 'Copié' : 'Copier les chapitres YouTube' }}
          </button>
          <button v-if="startedAt" type="button" class="px-2 py-1.5 text-sm text-muted hover:text-ink" @click="setStart(null)">Réinitialiser</button>
          <button v-else type="button" class="btn-primary !py-1.5" @click="startNow">Top départ</button>
        </div>
      </div>

      <!-- Ajout -->
      <form class="card flex flex-col gap-3 p-5" @submit.prevent="addLink">
        <h2 class="font-display text-lg font-medium">Ajouter une info</h2>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-muted">Lien</span>
          <input
            ref="urlInput"
            v-model="form.url"
            type="url"
            placeholder="https://..."
            required
            class="input"
            @blur="fillMeta"
            @paste="() => setTimeout(fillMeta, 50)"
          />
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-muted">Titre {{ fetchingMeta ? '(récupération...)' : '' }}</span>
          <input v-model="form.title" type="text" required class="input" placeholder="De quoi ça parle, en une ligne" />
        </label>
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-muted">Type</span>
            <KindSelect v-model="form.kind" />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-muted">Source</span>
            <input v-model="form.source" type="text" placeholder="Le Monde, @compte..." class="input" />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span class="text-muted">Section</span>
            <input v-model="form.section" type="text" list="sections" placeholder="Budget, Inter..." class="input" />
            <datalist id="sections">
              <option v-for="s in sections" :key="s" :value="s" />
            </datalist>
          </label>
        </div>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-muted">Note (facultatif)</span>
          <textarea v-model="form.note" rows="2" placeholder="Ce que tu en as dit, un chiffre clé, une réserve..." class="input" />
        </label>
        <p v-if="addError" class="text-sm text-red-500">{{ addError }}</p>
        <button type="submit" class="btn-primary self-end" :disabled="adding">Ajouter</button>
      </form>

      <!-- Liste du jour -->
      <section class="flex flex-col gap-5">
        <h2 class="font-display text-lg font-medium">{{ plural(data.links.length, 'info') }} ce jour</h2>
        <p v-if="!data.links.length" class="text-sm text-muted">Rien pour l'instant.</p>

        <div v-for="[name, items] in grouped" :key="name ?? '_'" class="flex flex-col gap-2">
          <p class="label border-b border-line pb-1 text-accent">{{ name ?? 'Sans section' }}</p>
          <div v-for="link in items" :key="link.id" class="card p-3">
            <form v-if="editingId === link.id" class="flex flex-col gap-2" @submit.prevent="saveEdit">
              <input v-model="edit.title" type="text" required class="input" />
              <div class="grid gap-2 sm:grid-cols-3">
                <KindSelect v-model="edit.kind" />
                <input v-model="edit.source" type="text" placeholder="Source" class="input" />
                <input v-model="edit.section" type="text" list="sections" placeholder="Section" class="input" />
              </div>
              <textarea v-model="edit.note" rows="2" placeholder="Note" class="input" />
              <div class="flex justify-end gap-2 text-sm">
                <button type="button" class="px-3 py-1.5 text-muted hover:text-ink" @click="editingId = null">Annuler</button>
                <button type="submit" class="btn-primary !py-1.5">Enregistrer</button>
              </div>
            </form>
            <div v-else class="flex items-start gap-3" :class="{ 'opacity-60': doneCount && !link.done_at }">
              <button
                type="button"
                class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 transition"
                :class="link.done_at ? 'bg-accent text-bg ring-accent' : 'bg-bg text-transparent ring-line hover:text-muted'"
                :title="link.done_at ? `Abordé à ${doneLabel(link.done_at, startedAt)}, cliquer pour annuler` : 'Marquer comme abordé'"
                @click="toggleDone(link)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="m5 12 5 5L20 7" /></svg>
              </button>
              <KindBadge :kind="link.kind" class="mt-0.5" />
              <div class="min-w-0 flex-1">
                <p class="leading-snug">
                  <a :href="link.url" target="_blank" rel="noopener" class="font-medium hover:underline">{{ link.title }}</a>
                  <span class="ml-2 text-sm text-muted">{{ link.source }}</span>
                  <span v-if="link.done_at" class="ml-2 font-display text-sm tabular-nums text-accent">{{ doneLabel(link.done_at, startedAt) }}</span>
                </p>
                <p v-if="link.note" class="mt-0.5 whitespace-pre-line text-sm text-muted">{{ link.note }}</p>
              </div>
              <div class="flex shrink-0 gap-1 text-sm">
                <button type="button" class="rounded px-2 py-1 text-muted hover:bg-surface-2 hover:text-ink" @click="startEdit(link)">Modifier</button>
                <button type="button" class="rounded px-2 py-1 text-muted hover:bg-red-500/10 hover:text-red-500" @click="removeLink(link.id)">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Titre et intro du jour -->
      <form class="card flex flex-col gap-3 p-5" @submit.prevent="saveDay">
        <h2 class="font-display text-lg font-medium">Titre et intro de la matinale</h2>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-muted">Titre (facultatif)</span>
          <input v-model="dayTitle" type="text" placeholder="Budget, motion de censure, et le reste" class="input" />
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-muted">Intro (facultatif)</span>
          <textarea v-model="dayIntro" rows="3" placeholder="Deux ou trois lignes sur ce qu'on a traité ce matin." class="input" />
        </label>
        <div class="flex items-center justify-end gap-3">
          <span v-if="daySaved" class="text-sm text-muted">Enregistré</span>
          <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
      </form>

      <!-- Overlay OBS -->
      <details class="card p-5">
        <summary class="font-display cursor-pointer text-lg font-medium">Overlay OBS et commandes chat</summary>
        <div class="mt-4 flex flex-col gap-4 text-sm">
          <p class="text-muted">Dans OBS : Sources, +, Source navigateur, coller l'URL, largeur 1920, hauteur 1080. L'overlay affiche le sujet coché et une pastille « Sujet 4 / 10 ».</p>
          <div class="flex flex-col gap-1">
            <span class="text-muted">Affichage seul</span>
            <div class="flex gap-2">
              <code class="input flex-1 truncate !py-1.5 text-xs">{{ overlayUrl }}</code>
              <button type="button" class="rounded-full border border-line px-3 hover:bg-surface-2" @click="copyUrl(overlayUrl)">{{ copiedUrl === overlayUrl ? 'Copié' : 'Copier' }}</button>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-muted">Avec les commandes chat (remplacer TON_MOT_DE_PASSE, il reste dans OBS et n'est jamais envoyé dans l'URL)</span>
            <div class="flex gap-2">
              <code class="input flex-1 truncate !py-1.5 text-xs">{{ overlayChatUrl }}</code>
              <button type="button" class="rounded-full border border-line px-3 hover:bg-surface-2" @click="copyUrl(overlayChatUrl)">{{ copiedUrl === overlayChatUrl ? 'Copié' : 'Copier' }}</button>
            </div>
          </div>
          <p class="text-muted">Options d'URL : <code>pos=bg|bd|hg|hd</code> pour le coin, <code>duree=15</code> pour les secondes d'affichage de la carte, <code>chaine=login</code> pour écouter un autre chat Twitch (tests).</p>
          <table class="w-full text-left">
            <tbody>
            <tr class="text-muted"><th class="pb-1 font-medium">Commande (toi ou un mod)</th><th class="pb-1 font-medium">Effet</th></tr>
            <tr><td class="py-1 pr-3"><code>!src https://... | Titre</code></td><td class="py-1">Ajoute l'info au jour. Le titre est facultatif, il est récupéré sur la page.</td></tr>
            <tr><td class="py-1 pr-3"><code>!ok</code> ou <code>!ok 3</code></td><td class="py-1">Coche le prochain sujet non abordé, ou le numéro 3.</td></tr>
            <tr><td class="py-1 pr-3"><code>!retour</code></td><td class="py-1">Annule la dernière coche.</td></tr>
            <tr><td class="py-1 pr-3"><code>!top</code></td><td class="py-1">Top départ de la matinale.</td></tr>
            <tr><td class="py-1 pr-3"><code>!section Budget</code></td><td class="py-1">Les prochains <code>!src</code> vont dans cette section. Sans argument : plus de section.</td></tr>
            </tbody>
          </table>
        </div>
      </details>

      <NuxtLink :to="`/jour/${date}`" class="text-center text-sm text-accent hover:underline">Voir la page publique de ce jour</NuxtLink>
    </template>
  </div>
</template>
