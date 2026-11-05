// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  // https://nuxt.com/modules
  modules: ['@nuxt/eslint', '@nuxt/ui', '@vueuse/nuxt'],

  // https://devtools.nuxt.com
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  // https://nuxt.com/docs/getting-started/upgrade#testing-nuxt-4
  // Public origin for absolute links (feed, og:image); set NUXT_PUBLIC_SITE_URL at build.
  runtimeConfig: {
    public: {
      siteUrl: '',
    },
  },

  compatibilityDate: '2025-01-01',

  // Static site on GitHub Pages, rebuilt on a schedule by .github/workflows/pages.yml.
  // contributions.json is the copy the page polls: Pages serves extensionless files
  // as octet-stream, which $fetch would not parse as JSON.
  nitro: {
    preset: 'github_pages',
    prerender: {
      routes: ['/', '/api/contributions', '/api/contributions.json', '/feed.xml'],
    },
  },

  // https://eslint.nuxt.com
  eslint: {
    config: {
      stylistic: {
        quotes: 'single',
      },
    },
  },
})
