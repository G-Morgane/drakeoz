<script setup lang="ts">
// Sous-menu de navigation : survol sur grand écran, clic partout.
defineOptions({ inheritAttrs: false })
defineProps<{
  label: string
  active?: boolean
  items: { to: string; label: string; hint?: string }[]
}>()

const open = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => (open.value = false))

// Ouvert au survol : le clic qui suit ne doit pas le refermer.
let hovered = false
let closeTimer: ReturnType<typeof setTimeout> | undefined
function enter(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  clearTimeout(closeTimer)
  hovered = true
  open.value = true
}
function leave(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  hovered = false
  closeTimer = setTimeout(() => (open.value = false), 150)
}
function toggle() {
  open.value = hovered ? true : !open.value
}
</script>

<template>
  <div class="relative" @pointerenter="enter" @pointerleave="leave">
    <button
      type="button"
      v-bind="$attrs"
      class="flex items-center gap-1"
      :class="{ '!text-ink after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-gradient-to-r after:from-transparent after:via-gold-2 after:to-transparent': active, '!text-ink': open }"
      :aria-expanded="open"
      @click="toggle"
    >
      {{ label }}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5 transition" :class="{ 'rotate-180': open }"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    <Transition enter-active-class="transition duration-150" enter-from-class="-translate-y-1 opacity-0" leave-active-class="transition duration-100" leave-to-class="-translate-y-1 opacity-0">
      <div v-if="open" class="absolute left-1/2 top-full z-30 w-[22rem] -translate-x-1/2 pt-3">
        <div class="card grid grid-cols-2 gap-1 border-gold-2/30 bg-surface p-2 shadow-2xl shadow-black/40">
          <NuxtLink
            v-for="it in items"
            :key="it.to"
            :to="it.to"
            class="flex flex-col gap-0.5 rounded-xl px-3 py-2.5 text-sm transition hover:bg-surface-2"
            exact-active-class="bg-surface-2 ring-1 ring-gold-2/40"
          >
            <span class="font-medium">{{ it.label }}</span>
            <span v-if="it.hint" class="text-xs leading-snug text-muted">{{ it.hint }}</span>
          </NuxtLink>
          <div v-if="$slots.default" class="col-span-2"><slot /></div>
        </div>
      </div>
    </Transition>
  </div>
</template>
