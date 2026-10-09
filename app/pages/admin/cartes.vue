<script setup lang="ts">
useHead({ title: 'Admin, les cartes' })

const { data: me } = await useFetch('/api/auth/me', { default: () => ({ admin: false }) })
const { data: cards, refresh } = await useFetch('/api/game/admin/cards', { default: () => [], immediate: me.value.admin })
const { data: collections } = await useFetch('/api/game/collections', { default: () => [] })

const blank = () => ({
  name: '', subtitle: '', category: 'politique', faction: '', rarity: 'commune', image_url: '', flavor: '', source_url: '', set_code: 's1', collection_slug: '',
  stats: [{ k: '', v: '' }, { k: '', v: '' }, { k: '', v: '' }],
})
const form = ref(blank())
const saving = ref(false)
const error = ref('')

const preview = computed(() => ({
  ...form.value,
  stats: Object.fromEntries(form.value.stats.filter(s => s.k.trim()).map(s => [s.k.trim(), Number.isFinite(Number(s.v)) && s.v !== '' ? Number(s.v) : s.v])),
}))

async function create() {
  error.value = ''
  saving.value = true
  try {
    await $fetch('/api/game/admin/cards', { method: 'POST', body: preview.value })
    form.value = blank()
    await refresh()
  } catch (e: any) {
    error.value = e?.data?.statusMessage ?? 'Échec'
  } finally {
    saving.value = false
  }
}

async function toggleActive(c: any) {
  await $fetch(`/api/game/admin/cards/${c.id}`, { method: 'PATCH', body: { active: !c.active } })
  await refresh()
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <PageHeader eyebrow="Admin" title="Les cartes">
      <p class="text-muted">{{ plural(cards.length, 'carte') }}. Les cartes sur des personnes réelles restent satiriques, jamais diffamatoires, et renvoient vers une source.</p>
      <template #actions>
        <NuxtLink to="/admin" class="text-sm text-muted hover:text-ink">Sources du jour</NuxtLink>
      </template>
    </PageHeader>

    <p v-if="!me.admin" class="card border-dashed p-6 text-muted">
      Connecte-toi d'abord sur <NuxtLink to="/admin" class="text-accent hover:underline">la page admin</NuxtLink>.
    </p>

    <template v-else>
      <section class="grid gap-6 lg:grid-cols-[1fr_260px]">
        <form class="card flex flex-col gap-3 p-5" @submit.prevent="create">
          <h2 class="font-display text-lg font-medium">Nouvelle carte</h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-sm"><span class="text-muted">Nom</span><input v-model="form.name" type="text" required class="input" /></label>
            <label class="flex flex-col gap-1 text-sm"><span class="text-muted">Sous-titre</span><input v-model="form.subtitle" type="text" class="input" /></label>
            <label class="flex flex-col gap-1 text-sm"><span class="text-muted">Catégorie</span>
              <select v-model="form.category" class="input"><option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option></select>
            </label>
            <label class="flex flex-col gap-1 text-sm"><span class="text-muted">Rareté</span>
              <select v-model="form.rarity" class="input"><option v-for="r in RARITIES" :key="r.value" :value="r.value">{{ r.label }}</option></select>
            </label>
            <label class="flex flex-col gap-1 text-sm"><span class="text-muted">Camp, parti, faction</span><input v-model="form.faction" type="text" class="input" placeholder="La matinale, République, un parti..." /></label>
            <label class="flex flex-col gap-1 text-sm"><span class="text-muted">Collection</span>
              <select v-model="form.collection_slug" class="input">
                <option value="">Aucune</option>
                <option v-for="c in collections" :key="c.slug" :value="c.slug">{{ c.emoji }} {{ c.name }}</option>
              </select>
            </label>
          </div>
          <label class="flex flex-col gap-1 text-sm"><span class="text-muted">Image (URL, illustration ou caricature, pas de photo sans droits)</span><input v-model="form.image_url" type="url" class="input" /></label>
          <label class="flex flex-col gap-1 text-sm"><span class="text-muted">Phrase</span><input v-model="form.flavor" type="text" class="input" /></label>
          <label class="flex flex-col gap-1 text-sm"><span class="text-muted">Source (URL)</span><input v-model="form.source_url" type="url" class="input" /></label>
          <div class="flex flex-col gap-1 text-sm">
            <span class="text-muted">Stats (trois max)</span>
            <div v-for="(s, i) in form.stats" :key="i" class="grid grid-cols-[1fr_100px] gap-2">
              <input v-model="s.k" type="text" placeholder="Nom" class="input" />
              <input v-model="s.v" type="text" placeholder="Valeur" class="input" />
            </div>
          </div>
          <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
          <button type="submit" class="btn-primary self-end" :disabled="saving">Créer la carte</button>
        </form>
        <div class="flex flex-col gap-2 self-start">
          <p class="label text-muted">Aperçu</p>
          <GameCard :card="{ ...preview, name: preview.name || 'Nom de la carte' } as any" />
        </div>
      </section>

      <section class="flex flex-col gap-3">
        <h2 class="font-display text-lg font-medium">Cartes existantes</h2>
        <table class="w-full text-sm">
          <thead><tr class="text-left text-muted"><th class="pb-2 font-medium">Nom</th><th class="pb-2 font-medium">Collection</th><th class="pb-2 font-medium">Rareté</th><th class="pb-2 font-medium">Exemplaires</th><th class="pb-2 font-medium"></th></tr></thead>
          <tbody class="divide-y divide-line/60">
            <tr v-for="c in cards" :key="c.id" :class="{ 'opacity-50': !c.active }">
              <td class="py-2 font-medium">
                <span v-if="!c.active" class="label mr-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-300">Brouillon</span>{{ c.name }}<span v-if="c.subtitle" class="text-muted"> · {{ c.subtitle }}</span>
              </td>
              <td class="py-2 text-muted">{{ collections.find(x => x.slug === c.collection_slug)?.name ?? '' }}</td>
              <td class="py-2">{{ rarityLabel(c.rarity) }}</td>
              <td class="py-2 tabular-nums">{{ c.circulating }}</td>
              <td class="py-2 text-right"><button type="button" class="text-muted hover:text-ink" @click="toggleActive(c)">{{ c.active ? 'Retirer du tirage' : 'Mettre en circulation' }}</button></td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
