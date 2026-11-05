export const useContributions = () => useFetch<Contributions>('/api/contributions', { key: 'contributions' })
export const useReviews = () => useFetch<Reviews>('/api/reviews', { key: 'reviews' })

// The page HTML and the JSON copies are cached independently, so a poll can
// hand back an older snapshot than the one on screen, which showed up as
// merged PRs reverting to open. Only ever move a payload forward.
async function moveForward<T extends { generatedAt: string }>(target: Ref<T | undefined | null>, url: string) {
  const next = await $fetch<T, string>(url)
  if (!target.value || Date.parse(next.generatedAt) > Date.parse(target.value.generatedAt)) target.value = next
}

// Both payloads come from the same Pages build. Polling both keeps the two tab
// counts and the open page on the same snapshot. Call it once per page, after
// both useFetch calls have run.
export function useLiveRecords() {
  const contributions = useNuxtData<Contributions>('contributions').data
  const reviews = useNuxtData<Reviews>('reviews').data

  let revalidating = false
  async function revalidate() {
    if (revalidating) return
    revalidating = true
    // A failed poll leaves the last good payload rendered.
    await Promise.allSettled([
      moveForward(contributions, '/api/contributions.json'),
      moveForward(reviews, '/api/reviews.json'),
    ])
    revalidating = false
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

  return { revalidate }
}
