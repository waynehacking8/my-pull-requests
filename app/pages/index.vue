<script setup lang="ts">
const colorMode = useColorMode()
const { data: contributions, refresh } = await useFetch <Contributions> ('/api/contributions')

if (!contributions.value) {
  throw createError('Could not load User activity')
}

// Kept as computed rather than destructured so the page re-renders after a revalidation.
const user = computed(() => contributions.value!.user)
const prs = computed(() => contributions.value!.prs)
const userUrl = computed(() => `https://github.com/${user.value.username}`)

// The payload is ISR-cached, so freshness has to be measured from the server
// timestamp instead of asserted with a permanently "live" indicator.
const generatedAt = computed(() => new Date(contributions.value!.generatedAt))
const updatedAgo = useTimeAgo(generatedAt)
const now = useTimestamp({ interval: 10_000 })
const isFresh = computed(() => now.value - generatedAt.value.getTime() < 2 * 60_000)

let revalidating = false
async function revalidate() {
  if (revalidating) return
  revalidating = true
  try {
    await refresh()
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

  // Poll on the same cadence as the ISR window, but only while the tab is open.
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
const url = useRequestURL()
useSeoMeta({
  title: `${user.value.name} ships upstream`,
  description: `${user.value.name}'s open-source GPU kernel, LLM serving, and correctness work across the inference stack.`,
  ogTitle: `${user.value.name} ships upstream`,
  ogDescription: 'GPU kernels, LLM serving, and correctness fixes across the open-source inference stack.',
  twitterCard: 'summary_large_image',
  ogImage: `${url.origin}/og.png`,
  twitterImage: `${url.origin}/og.png`,
})

const stats = computed(() => ({
  total: prs.value.length,
  completed: prs.value.filter(pr => pr.state === 'merged').length,
  inFlight: prs.value.filter(pr => pr.state === 'open').length,
  queued: prs.value.filter(pr => pr.state === 'draft').length,
}))

const order = ref<'asc' | 'desc'>('desc')
const orderKey = ref<'date' | 'star'>('date')

const items = computed(() => [
  [{
    label: 'Star',
    icon: 'i-lucide-star',
    checked: orderKey.value === 'star',
    type: 'checkbox' as const,
    onUpdateChecked(checked: boolean) {
      orderKey.value = checked ? 'star' : 'date'
    },
    onSelect(e: Event) {
      e.preventDefault()
    },
  }],
  [{
    label: orderKey.value === 'date' ? 'Oldest' : 'Ascending',
    icon: 'i-lucide-arrow-up-narrow-wide',
    checked: order.value === 'asc',
    type: 'checkbox' as const,
    onUpdateChecked(checked: boolean) {
      if (!checked) return
      order.value = 'asc'
    },
    onSelect(e: Event) {
      e.preventDefault()
    },
  }, {
    label: orderKey.value === 'date' ? 'Newest' : 'Descending',
    icon: 'i-lucide-arrow-down-narrow-wide',
    checked: order.value === 'desc',
    type: 'checkbox' as const,
    onUpdateChecked(checked: boolean) {
      if (!checked) return
      order.value = 'desc'
    },
    onSelect(e: Event) {
      e.preventDefault()
    },
  }],
])

const orderedPrs = computed(() => {
  const sortedPrs = [...prs.value]
  sortedPrs.sort((a, b) => {
    if (orderKey.value === 'star') {
      return order.value === 'asc' ? a.stars - b.stars : b.stars - a.stars
    }
    else {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return order.value === 'asc' ? dateA - dateB : dateB - dateA
    }
  })
  return sortedPrs
})

const query = ref('')
const stateFilter = ref<'all' | PullRequest['state']>('all')
const stateOptions = computed(() => [
  { value: 'all' as const, label: 'All', count: prs.value.length },
  { value: 'merged' as const, label: 'Merged', count: stats.value.completed },
  { value: 'open' as const, label: 'Open', count: stats.value.inFlight },
  { value: 'draft' as const, label: 'Draft', count: stats.value.queued },
  { value: 'closed' as const, label: 'Closed', count: prs.value.filter(pr => pr.state === 'closed').length },
].filter(option => option.value === 'all' || option.count > 0))

const filteredPrs = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  return orderedPrs.value.filter((pr) => {
    const matchesState = stateFilter.value === 'all' || pr.state === stateFilter.value
    const matchesQuery = !needle || `${pr.title} ${pr.repo} #${pr.number}`.toLocaleLowerCase().includes(needle)
    return matchesState && matchesQuery
  })
})
</script>

<template>
  <UContainer class="px-4 py-6 sm:px-6 sm:py-10 lg:px-8 max-w-4xl">
    <header class="hero-panel flex flex-col items-center gap-2 px-5 py-7 sm:px-8 sm:py-9">
      <p class="eyebrow">
        Open-source activity
      </p>
      <a :href="userUrl" target="_blank"><UAvatar
        :src="user.avatar"
        :alt="user.name"
        size="xl"
      />
      </a>
      <h1 class="text-2xl sm:text-4xl text-center font-semibold tracking-tight text-neutral-950 dark:text-white">
        <a :href="userUrl" target="_blank">
          {{ user.name }}
        </a>
        <span class="text-primary"> ships upstream.</span>
      </h1>
      <p class="max-w-xl text-center text-sm sm:text-base text-neutral-600 dark:text-neutral-300">
        GPU kernels, LLM serving, and correctness fixes across the open-source inference stack.
      </p>
      <div class="flex items-center justify-center gap-1 text-neutral-700 dark:text-neutral-300">
        <ClientOnly>
          <UButton
            :aria-label="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            :icon="colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
            color="neutral"
            variant="link"
            @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
          />
          <template #fallback>
            <div class="w-8 h-8" />
          </template>
        </ClientOnly>
        <UButton
          :to="userUrl"
          external
          target="_blank"
          :aria-label="`${user.name}'s GitHub profile`"
          icon="i-lucide-github"
          color="neutral"
          variant="link"
        />
        <UButton
          to="/feed.xml"
          external
          target="_blank"
          aria-label="RSS Feed"
          icon="i-lucide-rss"
          color="neutral"
          variant="link"
        />
        <UButton
          to="https://wayne.is-a.dev/"
          external
          aria-label="Open Wayne's portfolio"
          icon="i-lucide-panels-top-left"
          color="neutral"
          variant="link"
        />
        <UButton
          to="https://wayne.is-a.dev/cv.pdf"
          external
          aria-label="Open Wayne's CV"
          icon="i-lucide-file-user"
          color="neutral"
          variant="link"
        />
      </div>
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

      <!-- Client-only: the HTML is ISR-cached, so a server-rendered age would hydrate stale. -->
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
    </header>

    <main class="mt-6 sm:mt-8">
      <section class="toolbar" aria-label="Pull request filters">
        <label class="search-field">
          <UIcon name="i-lucide-search" class="size-4 shrink-0" aria-hidden="true" />
          <span class="sr-only">Search pull requests</span>
          <input
            v-model="query"
            type="search"
            placeholder="Search title, repository, or PR number"
            autocomplete="off"
          >
          <button
            v-if="query"
            type="button"
            class="clear-search"
            aria-label="Clear search"
            @click="query = ''"
          >
            <UIcon name="i-lucide-x" class="size-4" />
          </button>
        </label>
        <div class="state-filters" aria-label="Filter by pull request state">
          <button
            v-for="option of stateOptions"
            :key="option.value"
            type="button"
            :class="{ active: stateFilter === option.value }"
            :aria-pressed="stateFilter === option.value"
            @click="stateFilter = option.value"
          >
            {{ option.label }} <span>{{ option.count }}</span>
          </button>
        </div>
        <UDropdownMenu
          :items="items"
          :content="{
            align: 'start',
            side: 'bottom',
            sideOffset: 8,
          }"
          :ui="{
            content: 'w-48',
          }"
          size="xs"
        >
          <UButton
            :label="orderKey === 'star' ? 'Stars': order === 'asc' ? 'Oldest': 'Newest'"
            :icon="order === 'asc' ? 'i-lucide-arrow-up-narrow-wide': 'i-lucide-arrow-down-narrow-wide' "
            color="neutral"
            variant="soft"
            size="xs"
          />
        </UDropdownMenu>
      </section>

      <p class="results-summary" aria-live="polite">
        Showing {{ filteredPrs.length }} of {{ prs.length }} pull requests
      </p>

      <div v-if="filteredPrs.length" class="flex flex-col gap-3 sm:gap-4">
        <PullRequest v-for="pr of filteredPrs" :key="pr.url" :data="pr" />
      </div>
      <div v-else class="empty-state">
        <UIcon name="i-lucide-search-x" class="size-7" />
        <p>No pull requests match this view.</p>
        <button type="button" @click="query = ''; stateFilter = 'all'">
          Reset filters
        </button>
      </div>
    </main>
  </UContainer>
</template>
