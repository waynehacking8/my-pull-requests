// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  // https://nuxt.com/modules
  modules: ['@nuxt/eslint', '@nuxt/ui', '@vueuse/nuxt'],

  $production: {
    routeRules: {
      // 60s keeps the page close to real-time while staying far inside GitHub's
      // rate limits: one regeneration costs ~13 API calls (search + user + repos).
      // The client also revalidates on tab focus, so returning to the page is instant.
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
