<script setup lang="ts">
const props = defineProps<{
  data: WallItem
}>()

// Rendering created_at for every state made a PR merged yesterday read
// "3 weeks ago" beside a green "completed" badge — the timestamp contradicted
// the badge. Merged PRs report when the work landed instead.
const activityAt = computed(() => prActivityAt(props.data))
const timeAgo = useTimeAgo(() => new Date(activityAt.value))
const activityLabel = computed(() => props.data.activityVerb ?? (props.data.merged_at ? 'merged' : props.data.state === 'draft' ? 'drafted' : 'opened'))
const activityTitle = computed(() =>
  `${activityLabel.value} ${new Date(activityAt.value).toISOString().slice(0, 10)}`
  + (props.data.merged_at ? ` · opened ${props.data.created_at.slice(0, 10)}` : ''),
)

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

// Issues and RFCs never merge, so they take GitHub's issue glyphs instead of PR
// ones. A closed issue may be fixed or declined, so it gets a neutral mark, not
// a check (done) or red (failed).
const isIssue = computed(() => props.data.kind === 'issue' || props.data.kind === 'rfc')
const icon = computed(() => isIssue.value
  ? (props.data.state === 'closed' ? 'i-lucide-circle-slash' : 'i-lucide-circle-dot')
  : stateIcons[props.data.state])
const kindLabel = computed(() => props.data.kind && KIND_LABEL[props.data.kind])

const prStateLabels: Record<PullRequest['state'], string> = {
  open: 'in-flight',
  draft: 'queued',
  merged: 'completed',
  closed: 'closed',
}
const stateLabel = computed(() => isIssue.value ? props.data.state : prStateLabels[props.data.state])
</script>

<template>
  <article class="pr-card flex items-center gap-3 sm:gap-4">
    <a
      :href="`https://github.com/${data.repo}`"
      target="_blank"
      rel="noopener"
      :class="['size-10 sm:size-12 shrink-0 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm', data.type === 'User' ? 'rounded-full' : 'rounded-lg']"
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
            :name="icon"
            :title="stateLabel"
            :class="{
              'text-amber-600 dark:text-amber-400': data.state === 'open',
              'text-neutral-500 dark:text-neutral-400': data.state === 'draft' || (isIssue && data.state === 'closed'),
              'text-nvidia dark:text-nvidia-bright': data.state === 'merged',
              'text-red-500 dark:text-red-400': !isIssue && data.state === 'closed',
            }"
            class="size-4 sm:size-5 shrink-0"
          />

          <span><span v-if="kindLabel" class="kind-label">{{ kindLabel }}</span>{{ data.title }}</span>
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
            v-if="data.stars !== undefined"
            :href="`https://github.com/${data.repo}`"
            target="_blank"
            rel="noopener"
            class="items-center hidden sm:inline-flex gap-0.5 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white truncate"
          >
            <UIcon name="i-lucide-star" class="size-3 shrink-0" />
            <span class="text-xs">{{ formatStars(data.stars ?? 0) }}</span>
          </a>
        </div>
      </div>

      <div class="flex flex-col justify-between shrink-0 text-right font-mono">
        <a
          :href="data.threadUrl ?? data.url"
          target="_blank"
          rel="noopener"
          class="hover:underline text-xs sm:text-sm text-neutral-500 dark:text-neutral-400"
        >
          #{{ data.number }}
        </a>

        <!-- The HTML is prebuilt, so a relative time rendered then ("12 hours ago")
             is already wrong when the page opens and breaks hydration. The build
             writes the date; the browser swaps in the relative time. -->
        <time :datetime="activityAt" :title="activityTitle" class="text-xs text-neutral-500 dark:text-neutral-400">
          <ClientOnly :fallback="activityAt.slice(0, 10)">{{ timeAgo }}</ClientOnly>
        </time>
      </div>
    </div>
  </article>
</template>
