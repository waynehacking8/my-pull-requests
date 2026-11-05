<script setup lang="ts">
const { data: contributions } = await useContributions()

if (!contributions.value) {
  throw createError('Could not load User activity')
}

// Kept as computed rather than destructured so the page re-renders after a revalidation.
const user = computed(() => contributions.value!.user)
const prs = computed(() => contributions.value!.prs)

// The page is a static build, so freshness has to be measured from the build
// timestamp instead of asserted with a permanently "live" indicator.
const generatedAt = computed(() => new Date(contributions.value!.generatedAt))
const updatedAgo = useTimeAgo(generatedAt)
const now = useTimestamp({ interval: 10_000 })
// Freshness has to be judged against what actually rebuilds the site: the
// Pages workflow, on a 10-minute cron. A 2-minute window would report stale
// almost permanently even when everything was working.
const isFresh = computed(() => now.value - generatedAt.value.getTime() < 15 * 60_000)

let revalidating = false
async function revalidate() {
  if (revalidating) return
  revalidating = true
  try {
    const next = await $fetch<Contributions>('/api/contributions.json')

    // The page HTML and this endpoint are cached independently, so a poll can
    // hand back an older snapshot than the one already on screen — which showed
    // up as merged PRs reverting to open. Only ever move the payload forward.
    if (!contributions.value || Date.parse(next.generatedAt) > Date.parse(contributions.value.generatedAt)) {
      contributions.value = next
    }
  }
  catch {
    // A failed poll should leave the last good payload rendered.
  }
  finally {
    revalidating = false
  }
}

if (import.meta.client) {
  const visibility = useDocumentVisibility()

  // Coming back to the tab should show current data, not whatever was cached on load.
  watch(visibility, (state, previous) => {
    if (state === 'visible' && previous === 'hidden') revalidate()
  })

  // Poll for a newer build, but only while the tab is open.
  useIntervalFn(() => {
    if (visibility.value === 'visible') revalidate()
  }, 60_000)
}

useHead({
  link: [
    { rel: 'icon', href: '/favicon.png' },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'alternate', type: 'application/rss+xml', title: `${user.value.name}'s recent pull requests`, href: '/feed.xml' },
  ],
})
// Prerendered pages see the build host, so the public origin comes from config.
const origin = useRuntimeConfig().public.siteUrl || useRequestURL().origin
useSeoMeta({
  title: 'Wayne Chiu',
  description: 'Upstream pull requests to TensorRT-LLM, vLLM, SGLang and FlashInfer.',
  ogTitle: 'Wayne Chiu',
  ogDescription: 'Upstream pull requests to TensorRT-LLM, vLLM, SGLang and FlashInfer.',
  twitterCard: 'summary_large_image',
  ogImage: `${origin}/og.png`,
  twitterImage: `${origin}/og.png`,
})

const stats = computed(() => ({
  total: prs.value.length,
  completed: prs.value.filter(pr => pr.state === 'merged').length,
  inFlight: prs.value.filter(pr => pr.state === 'open').length,
  queued: prs.value.filter(pr => pr.state === 'draft').length,
}))
</script>

<template>
  <UContainer class="px-4 py-6 sm:px-6 sm:py-10 lg:px-8 max-w-4xl">
    <WallHero :user="user">
      <!-- Same mono/neutral metadata treatment as the PR rows below, so it reads as one page. -->
      <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
        <span>{{ stats.total }} prs</span>
        <span class="opacity-40" aria-hidden="true">·</span>
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-git-merge" class="size-3.5 shrink-0 text-nvidia dark:text-nvidia-bright" />
          {{ stats.completed }} completed
        </span>
        <span class="opacity-40" aria-hidden="true">·</span>
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-git-pull-request-arrow" class="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          {{ stats.inFlight }} in-flight
        </span>
        <template v-if="stats.queued">
          <span class="opacity-40" aria-hidden="true">·</span>
          <span class="inline-flex items-center gap-1">
            <UIcon name="i-lucide-git-pull-request-draft" class="size-3.5 shrink-0" />
            {{ stats.queued }} queued
          </span>
        </template>
      </div>

      <!-- Client-only: the HTML is prebuilt, so a server-rendered age would hydrate stale. -->
      <ClientOnly>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          :aria-label="`Data updated ${updatedAgo}. Refresh now.`"
          @click="revalidate"
        >
          <span class="relative flex size-1.5">
            <span v-if="isFresh" class="absolute inline-flex h-full w-full animate-ping rounded-full bg-nvidia opacity-60" />
            <span
              class="relative inline-flex size-1.5 rounded-full"
              :class="isFresh ? 'bg-nvidia' : 'bg-neutral-400 dark:bg-neutral-600'"
            />
          </span>
          updated {{ updatedAgo }}
        </button>
        <template #fallback>
          <div class="h-4" />
        </template>
      </ClientOnly>
    </WallHero>

    <main class="mt-6 sm:mt-8">
      <PageTabs />
      <PrWall :items="prs" noun="pull requests" />
    </main>
  </UContainer>
</template>
