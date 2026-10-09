<template>
  <div class="flex min-h-dvh flex-col">
    <SiteHeader />
    <main class="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-8 sm:px-6">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
