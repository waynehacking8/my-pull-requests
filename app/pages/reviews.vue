<script setup lang="ts">
const { data } = await useReviews()
if (!data.value) throw createError('Could not load review activity')

const { revalidate } = useLiveRecords()

const user = computed(() => data.value!.user)
const threads = computed(() => data.value!.threads)
const items = computed<WallItem[]>(() => threads.value.map(t => ({
  repo: t.repo,
  title: t.title,
  // The title opens my latest comment; the number opens the whole thread.
  url: t.lastUrl,
  threadUrl: t.url,
  created_at: t.lastAt,
  merged_at: null,
  state: t.state,
  number: t.number,
  kind: t.kind,
  activityVerb: 'commented',
})))

const stats = computed(() => ({
  total: threads.value.length,
  prs: threads.value.filter(t => t.kind === 'pr').length,
  issues: threads.value.filter(t => t.kind === 'issue').length,
  rfcs: threads.value.filter(t => t.kind === 'rfc').length,
  projects: new Set(threads.value.map(t => t.repo)).size,
}))

const origin = useRuntimeConfig().public.siteUrl || useRequestURL().origin
useSeoMeta({
  title: 'Wayne Chiu · Reviews',
  description: 'Pull requests, issues and RFCs by others that I reviewed or commented on.',
  ogTitle: 'Wayne Chiu · Reviews',
  ogDescription: 'Pull requests, issues and RFCs by others that I reviewed or commented on.',
  twitterCard: 'summary_large_image',
  ogImage: `${origin}/og.png`,
  twitterImage: `${origin}/og.png`,
})
</script>

<template>
  <UContainer class="px-4 py-6 sm:px-6 sm:py-10 lg:px-8 max-w-4xl">
    <WallHero :user="user">
      <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
        <span>{{ stats.total }} threads</span>
        <span class="opacity-40" aria-hidden="true">·</span>
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-git-pull-request" class="size-3.5 shrink-0" />
          {{ stats.prs }} prs
        </span>
        <span class="opacity-40" aria-hidden="true">·</span>
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-circle-dot" class="size-3.5 shrink-0" />
          {{ stats.issues }} issues
        </span>
        <span class="opacity-40" aria-hidden="true">·</span>
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-lucide-file-text" class="size-3.5 shrink-0" />
          {{ stats.rfcs }} rfcs
        </span>
        <span class="opacity-40" aria-hidden="true">·</span>
        <span>{{ stats.projects }} projects</span>
      </div>
      <FreshnessButton :generated-at="data!.generatedAt" @refresh="revalidate" />
    </WallHero>

    <main class="mt-6 sm:mt-8">
      <PageTabs />
      <PrWall :items="items" noun="threads" />
    </main>
  </UContainer>
</template>
