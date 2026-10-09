<script setup lang="ts">
useHead({ title: 'Qui suis-je, Drakeoz' })

// Les passages entre crochets sont à remplacer par Drakeoz : rien n'est inventé ici.
const networks = useSocials()
const twitch = networks.find(n => n.label === 'Twitch')!
</script>

<template>
  <article class="mx-auto flex max-w-3xl flex-col gap-12">
    <header class="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
      <img src="/logo.png" alt="Drakeoz" class="h-36 w-36 shrink-0 rounded-full shadow-[0_0_60px_-10px_var(--glow)]" />
      <div class="flex flex-col gap-3">
        <p class="label text-accent">Qui suis-je</p>
        <h1 class="font-display text-4xl font-semibold uppercase leading-none tracking-wide sm:text-5xl">Drakeoz</h1>
        <p class="text-lg text-muted">
          [Deux lignes de présentation : qui tu es, depuis quand tu streames, d'où tu parles.]
        </p>
      </div>
    </header>

    <section class="flex flex-col gap-4">
      <h2 class="font-display text-2xl font-medium">Le stream</h2>
      <p class="leading-relaxed">
        Tous les matins sur <a :href="twitch.href" target="_blank" rel="noopener" class="text-accent hover:underline">Twitch</a> :
        une revue de presse de l'actualité politique, des réactions en direct à ce qui tombe, et la discussion avec le chat.
        [Précise l'horaire habituel et la durée.]
      </p>
      <p class="leading-relaxed">
        [Comment tu choisis les sujets, ce que tu refuses de traiter, le ton que tu veux donner.]
      </p>
    </section>

    <section class="flex flex-col gap-4">
      <h2 class="font-display text-2xl font-medium">Pourquoi tout sourcer</h2>
      <p class="leading-relaxed">
        Parler de politique en direct, c'est s'exposer à l'erreur et au soupçon de parti pris. La réponse la plus simple, c'est de montrer ses sources.
        Chaque article, vidéo, rapport ou post cité à l'antenne est enregistré ici, à sa date, avec le moment où il a été abordé.
        N'importe qui peut remonter au document d'origine, vérifier, et se faire son avis.
      </p>
      <p class="leading-relaxed">
        [Ton positionnement, assumé ou non : d'où tu parles, ce que tu revendiques, ce que tu ne prétends pas être.]
      </p>
    </section>

    <section class="flex flex-col gap-4">
      <h2 class="font-display text-2xl font-medium">Me suivre</h2>
      <ul class="flex flex-wrap gap-3">
        <li v-for="n in networks" :key="n.label">
          <a :href="n.href" target="_blank" rel="noopener" class="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2">
            <SourceIcon :kind="n.kind" class="h-4 w-4 text-accent" /> {{ n.label }}
          </a>
        </li>
      </ul>
    </section>

    <section class="card flex flex-col gap-3 p-6">
      <h2 class="font-display text-xl font-medium">Une erreur dans une source, un oubli ?</h2>
      <p class="text-muted">[Comment te contacter : mail, DM, Discord.]</p>
    </section>
  </article>
</template>
