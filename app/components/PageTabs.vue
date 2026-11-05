<script setup lang="ts">
const { data: contributions } = await useContributions()
const { data: reviews } = await useReviews()

// Counts sit on the tabs so a visitor sees both totals before choosing.
const tabs = computed(() => [
  { to: '/', label: 'Pull requests', count: contributions.value?.prs.length ?? 0 },
  { to: '/reviews', label: 'Reviews', count: reviews.value?.threads.length ?? 0 },
])
</script>

<template>
  <nav class="page-tabs" aria-label="Sections">
    <NuxtLink
      v-for="tab of tabs"
      :key="tab.to"
      :to="tab.to"
      exact-active-class="active"
    >
      {{ tab.label }} <span>{{ tab.count }}</span>
    </NuxtLink>
  </nav>
</template>
