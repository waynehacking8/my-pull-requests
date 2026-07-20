<script setup>
useHead({
  htmlAttrs: {
    lang: 'en',
  },
})
</script>

<template>
  <UApp>
    <NuxtPage />
    <footer class="site-footer">
      <p>Wayne Chiu · making every FLOP count</p>
      <nav aria-label="Related links">
        <UButton
          to="https://wayne.is-a.dev/"
          external
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-panels-top-left"
        >
          Portfolio
        </UButton>
        <UButton
          to="https://wayne.is-a.dev/cv.pdf"
          external
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-file-user"
        >
          CV
        </UButton>
        <UButton
          to="https://github.com/waynehacking8/my-pull-requests"
          rel="noopener"
          target="_blank"
          color="neutral"
          variant="link"
          size="sm"
          icon="i-simple-icons-github"
        >
          Source
        </UButton>
        <UButton
          to="/feed.xml"
          target="_blank"
          rel="noopener"
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-rss"
        >
          RSS
        </UButton>
      </nav>
    </footer>
    <ScrollToTop />
  </UApp>
</template>
