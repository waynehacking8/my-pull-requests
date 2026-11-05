<script setup lang="ts">
const { data: contributions } = await useContributions()

if (!contributions.value) {
  throw createError('Could not load User activity')
}

// Kept as computed rather than destructured so the page re-renders after a revalidation.
const user = computed(() => contributions.value!.user)
const prs = computed(() => contributions.value!.prs)

const { revalidate } = useLiveRecords()

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

const stats = computed(() => {
  const counts = countStates(prs.value)
  return { total: prs.value.length, completed: counts.merged, inFlight: counts.open, queued: counts.draft }
})
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

      <FreshnessButton :generated-at="contributions!.generatedAt" @refresh="revalidate" />
    </WallHero>

    <main class="mt-6 sm:mt-8">
      <PageTabs />
      <PrWall :items="prs" noun="pull requests" />
    </main>
  </UContainer>
</template>
