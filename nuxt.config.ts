import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/color-mode', '@nuxtjs/supabase'],
  supabase: {
    // Auth des joueurs côté client ; les écritures passent par le serveur avec la clé secrète.
    url: process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY,
    secretKey: process.env.NUXT_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY,
    redirect: false,
    types: false,
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
  },
  runtimeConfig: {
    adminPassword: '',
    sessionSecret: '',
    supabaseUrl: '',
    supabaseServiceKey: '',
    twitchClientId: '',
    twitchClientSecret: '',
    public: {
      twitchLogin: 'drakeoz_',
      youtubeChannelId: '',
      xHandle: '',
      blueskyHandle: '',
      // Connexion Twitch directe (OAuth via Supabase). À activer une fois le fournisseur configuré dans Supabase.
      twitchAuth: false,
      socials: {
        twitch: 'https://www.twitch.tv/drakeoz_',
        youtube: 'https://www.youtube.com/@Drakeoz-FR',
        x: 'https://x.com/Drakeoz_G',
        bluesky: 'https://bsky.app/profile/drakeoz.bsky.social',
        instagram: 'https://www.instagram.com/drakeoz_/',
        tiktok: 'https://www.tiktok.com/@drakeoz_',
      },
    },
  },
  nitro: {
    storage: {
      data: { driver: 'fs', base: './.data' },
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Drakeoz, les sources de la matinale',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Toutes les sources citées chaque matin sur le stream de Drakeoz, rangées par jour.' },
        { name: 'theme-color', content: '#120a07' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Public+Sans:wght@300;400;500;600&display=swap',
        },
      ],
    },
  },
})
