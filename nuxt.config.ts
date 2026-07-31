// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  // https://nuxt.com/modules
  modules: ['@nuxt/eslint', '@nuxt/ui', '@vueuse/nuxt'],

  $production: {
    routeRules: {
      // 60s is how soon a cached copy *may* be rebuilt, not how often it is:
      // Vercel only regenerates when a request arrives, and serves the stale
      // copy to whoever triggers it. Freshness therefore comes from the
      // warm-cache workflow polling these routes, not from this number.
      // One regeneration costs ~13 API calls (search + user + repos).
      '/': { isr: 60 },
      '/api/contributions': { isr: 60 },
      // Feed readers poll on their own schedule, no need to regenerate as often.
      '/feed.xml': { isr: 60 * 5 },
    },
  },

  // https://devtools.nuxt.com
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  // https://nuxt.com/docs/getting-started/upgrade#testing-nuxt-4
  compatibilityDate: '2025-01-01',

  // https://eslint.nuxt.com
  eslint: {
    config: {
      stylistic: {
        quotes: 'single',
      },
    },
  },
})
