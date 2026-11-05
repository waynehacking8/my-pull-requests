// Both payloads are needed on both pages (the tabs show both counts), so each
// is fetched under one key and shared instead of requested twice.
export const useContributions = () => useFetch<Contributions>('/api/contributions', { key: 'contributions' })
export const useReviews = () => useFetch<Reviews>('/api/reviews', { key: 'reviews' })
