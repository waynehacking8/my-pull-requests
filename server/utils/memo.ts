// One build prerenders each payload from several routes (/, /reviews, the
// .json copies, the feed). This shares one GitHub fetch between them, in
// memory only: Nitro's cached handlers persist to node_modules/.cache and fed
// the next local build stale data that ignored its env.
export function memoFor<T>(load: () => Promise<T>, ttlMs: number, now: () => number = Date.now) {
  let cached: { at: number, value: Promise<T> } | undefined
  return () => {
    if (!cached || now() - cached.at >= ttlMs) {
      const value = load()
      const entry = { at: now(), value }
      cached = entry
      // A failed fetch must not be served to the next caller.
      value.catch(() => {
        if (cached === entry) cached = undefined
      })
    }
    return cached.value
  }
}
