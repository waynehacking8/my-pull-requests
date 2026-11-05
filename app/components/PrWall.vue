<script setup lang="ts">
const props = defineProps<{
  items: WallItem[]
  // Plural noun for the filter labels and empty state, e.g. "pull requests".
  noun: string
}>()

const counts = computed(() => countStates(props.items))
// Review threads carry no star counts, so the star sort only exists where it can work.
const hasStars = computed(() => props.items.some(pr => pr.stars !== undefined))

const order = ref<'asc' | 'desc'>('desc')
const orderKey = ref<'date' | 'star'>('date')

const menu = computed(() => [
  ...(hasStars.value
    ? [[{
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
      }]]
    : []),
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
  const sortedPrs = [...props.items]
  sortedPrs.sort((a, b) => {
    if (orderKey.value === 'star') {
      return order.value === 'asc' ? (a.stars ?? 0) - (b.stars ?? 0) : (b.stars ?? 0) - (a.stars ?? 0)
    }
    else {
      // Order by when each PR last moved, not when it was opened. Sorting on
      // created_at buried a PR merged yesterday behind three weeks of newer
      // proposals, so freshly landed work never surfaced on an activity wall.
      const dateA = new Date(prActivityAt(a)).getTime()
      const dateB = new Date(prActivityAt(b)).getTime()
      return order.value === 'asc' ? dateA - dateB : dateB - dateA
    }
  })
  return sortedPrs
})

const query = ref('')
const stateFilter = ref<'all' | WallItem['state']>('all')
const stateOptions = computed(() => [
  { value: 'all' as const, label: 'All', count: props.items.length },
  { value: 'merged' as const, label: 'Merged', count: counts.value.merged },
  { value: 'open' as const, label: 'Open', count: counts.value.open },
  { value: 'draft' as const, label: 'Draft', count: counts.value.draft },
  { value: 'closed' as const, label: 'Closed', count: counts.value.closed },
].filter(option => option.value === 'all' || option.count > 0))

// A refresh can empty a state and remove its button; fall back to All rather
// than leave an empty list with nothing highlighted.
watch(stateOptions, (options) => {
  if (!options.some(option => option.value === stateFilter.value)) stateFilter.value = 'all'
})

const filteredPrs = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  return orderedPrs.value.filter((pr) => {
    const matchesState = stateFilter.value === 'all' || pr.state === stateFilter.value
    const matchesQuery = !needle || `${pr.title} ${pr.repo} #${pr.number} ${pr.kind ? KIND_LABEL[pr.kind] : ''}`.toLocaleLowerCase().includes(needle)
    return matchesState && matchesQuery
  })
})
</script>

<template>
  <div>
    <section class="toolbar" :aria-label="`Filter ${noun}`">
      <label class="search-field">
        <UIcon name="i-lucide-search" class="size-4 shrink-0" aria-hidden="true" />
        <span class="sr-only">Search {{ noun }}</span>
        <input
          v-model="query"
          type="search"
          placeholder="Search title, repository, or number"
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
      <div class="state-filters" aria-label="Filter by state">
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
        :items="menu"
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
      Showing {{ filteredPrs.length }} of {{ items.length }} {{ noun }}
    </p>

    <div v-if="filteredPrs.length" class="flex flex-col gap-3 sm:gap-4">
      <PullRequest v-for="pr of filteredPrs" :key="pr.url" :data="pr" />
    </div>
    <div v-else class="empty-state">
      <UIcon name="i-lucide-search-x" class="size-7" />
      <p>No {{ noun }} match this view.</p>
      <button type="button" @click="query = ''; stateFilter = 'all'">
        Reset filters
      </button>
    </div>
  </div>
</template>
