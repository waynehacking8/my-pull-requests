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
  title: `${user.value.name} is Contributing`,
  description: `Making every FLOP count — ${user.value.name}'s recent pull requests on GitHub.`,
  ogTitle: `${user.value.name} is Contributing`,
  ogDescription: `Making every FLOP count — ${user.value.name}'s recent pull requests on GitHub.`,
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
    label: orderKey.value === 'date' ? 'Oldset' : 'Ascending',
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
</script>

<template>
  <UContainer class="p-4 sm:p-6 lg:p-8 lg:pt-10 max-w-3xl">
    <div class="flex flex-col items-center gap-2">
      <a :href="userUrl" target="_blank"><UAvatar
        :src="user.avatar"
        :alt="user.name"
        size="xl"
      />
      </a>
      <h1 class="text-2xl sm:text-3xl text-center">
        <a :href="userUrl" target="_blank">
          {{ user.name }}
        </a>
        is <span class="animate-pulse">Contributing...</span>
      </h1>
      <p class="text-center text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300">
        <NuxtLink :to="userUrl" target="_blank">
          @{{ user.username }}'s recent pull requests on GitHub.
        </NuxtLink>
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
      <div class="mb-6 sm:mb-10" />
    </div>

    <div class="relative">
      <div class="flex justify-end absolute -top-10 lg:-top-12 right-0">
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
            :label="orderKey === 'star' ? 'Stars': order === 'asc' ? 'Oldset': 'Newset'"
            :icon="order === 'asc' ? 'i-lucide-arrow-up-narrow-wide': 'i-lucide-arrow-down-narrow-wide' "
            color="neutral"
            variant="soft"
            size="xs"
          />
        </UDropdownMenu>
      </div>
      <div class="flex flex-col gap-6 mt-5 sm:gap-10">
        <PullRequest v-for="pr of orderedPrs" :key="pr.url" :data="pr" />
      </div>
    </div>
  </UContainer>
</template>
