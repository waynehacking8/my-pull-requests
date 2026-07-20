<script setup lang="ts">
defineProps<{
  data: PullRequest
}>()

function formatStars(stars: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(stars)
}

const stateIcons: Record<PullRequest['state'], string> = {
  open: 'i-lucide-git-pull-request-arrow',
  draft: 'i-lucide-git-pull-request-draft',
  merged: 'i-lucide-git-merge',
  closed: 'i-lucide-git-pull-request-closed',
}

const stateLabels: Record<PullRequest['state'], string> = {
  open: 'in-flight',
  draft: 'queued',
  merged: 'completed',
  closed: 'closed',
}
</script>

<template>
  <article class="pr-card flex items-center gap-3 sm:gap-4">
    <a
      :href="`https://github.com/${data.repo}`"
      target="_blank"
      rel="noopener"
      :class="['size-10 sm:size-12 shrink-0 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm', data.type === 'Organization' ? 'rounded-lg' : 'rounded-full']"
    >
      <img
        :src="`https://github.com/${data.repo.split('/')[0]}.png`"
        :alt="`${data.repo.split('/')[0]} avatar`"
        width="48"
        height="48"
        loading="lazy"
        decoding="async"
        class="size-full"
      >
    </a>

    <div class="flex-1 flex justify-between gap-2 lg:gap-4 min-w-0">
      <div class="flex flex-col min-w-0 gap-0.5 sm:gap-1">
        <a
          :href="data.url"
          target="_blank"
          rel="noopener"
          class="pr-title text-sm sm:text-base flex items-start gap-1.5 text-neutral-900 dark:text-white"
        >
          <UIcon
            :name="stateIcons[data.state]"
            :title="stateLabels[data.state]"
            :class="{
              'text-amber-600 dark:text-amber-400': data.state === 'open',
              'text-neutral-500 dark:text-neutral-400': data.state === 'draft',
              'text-nvidia dark:text-nvidia-bright': data.state === 'merged',
              'text-red-500 dark:text-red-400': data.state === 'closed',
            }"
            class="size-4 sm:size-5 shrink-0"
          />

          <span>{{ data.title }}</span>
        </a>

        <div class="flex gap-2 items-bottom font-mono">
          <a
            :href="`https://github.com/${data.repo}`"
            target="_blank"
            rel="noopener"
            class="text-xs sm:text-sm inline-flex gap-1 hover:text-black dark:hover:text-white truncate"
          >
            <span class="opacity-75">{{ data.repo.split('/')[0] }}</span>
            <span class="opacity-50">/</span>
            <span class="truncate">{{ data.repo.split('/')[1] }}</span>
          </a>
          <a
            :href="`https://github.com/${data.repo}`"
            target="_blank"
            rel="noopener"
            class="items-center hidden sm:inline-flex gap-0.5 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white truncate"
          >
            <UIcon name="i-lucide-star" class="size-3 shrink-0" />
            <span class="text-xs">{{ formatStars(data.stars) }}</span>
          </a>
        </div>
      </div>

      <div class="flex flex-col justify-between shrink-0 text-right font-mono">
        <a
          :href="data.url"
          target="_blank"
          rel="noopener"
          class="hover:underline text-xs sm:text-sm text-neutral-500 dark:text-neutral-400"
        >
          #{{ data.number }}
        </a>

        <time :datetime="data.created_at" class="text-xs text-neutral-500 dark:text-neutral-400">{{ useTimeAgo(new Date(data.created_at)) }}</time>
      </div>
    </div>
  </article>
</template>
