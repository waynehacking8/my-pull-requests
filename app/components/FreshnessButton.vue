<script setup lang="ts">
const props = defineProps<{ generatedAt: string }>()
defineEmits<{ refresh: [] }>()

// The page is a static build, so freshness is measured from the build
// timestamp instead of asserted with a permanently "live" indicator.
const generatedAt = computed(() => new Date(props.generatedAt))
const updatedAgo = useTimeAgo(generatedAt)
const now = useTimestamp({ interval: 10_000 })
// Judged against what rebuilds the site: the Pages workflow, on a 10-minute cron.
const isFresh = computed(() => now.value - generatedAt.value.getTime() < 15 * 60_000)
</script>

<template>
  <!-- Client-only: the HTML is prebuilt, so a server-rendered age would hydrate stale. -->
  <ClientOnly>
    <button
      type="button"
      class="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
      :aria-label="`Data updated ${updatedAgo}. Refresh now.`"
      @click="$emit('refresh')"
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
</template>
