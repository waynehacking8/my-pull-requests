// Folding raw comments and reviews into one row per thread is kept free of
// I/O, so the rules (whose threads count, which repos drop out, what the
// latest activity is) can be tested without GitHub.

export type RawThread = {
  title: string
  number: number
  url: string
  author: { login: string } | null
  repository: { nameWithOwner: string, isPrivate: boolean }
  labels?: { nodes: { name: string }[] }
  state: 'OPEN' | 'CLOSED' | 'MERGED'
  isDraft?: boolean
}

export type RawEntry = {
  at: string
  url: string
  review: boolean
  isPullRequest: boolean
  thread: RawThread
}

export type ThreadFilters = {
  username: string
  hidePrivateRepos: boolean
  excludeRepos: Set<string>
  excludeOrgs: Set<string>
}

function kindOf(entry: RawEntry): ReviewThread['kind'] {
  if (entry.isPullRequest) return 'pr'
  const { title, labels } = entry.thread
  const rfc = /\bRFC\b/i.test(title) || (labels?.nodes ?? []).some(label => /^rfc$/i.test(label.name))
  return rfc ? 'rfc' : 'issue'
}

function stateOf(thread: RawThread): ReviewThread['state'] {
  if (thread.state === 'MERGED') return 'merged'
  if (thread.state === 'CLOSED') return 'closed'
  return thread.isDraft ? 'draft' : 'open'
}

export function buildThreads(entries: RawEntry[], filters: ThreadFilters): ReviewThread[] {
  // Oldest first, so each later entry becomes the thread's latest.
  const ordered = [...entries].sort((a, b) => a.at.localeCompare(b.at))
  // GitHub names are case-insensitive, and so is the PR wall's search filter.
  const excludeRepos = new Set([...filters.excludeRepos].map(name => name.toLowerCase()))
  const excludeOrgs = new Set([...filters.excludeOrgs].map(name => name.toLowerCase()))
  const threads = new Map<string, ReviewThread>()
  for (const entry of ordered) {
    const { thread } = entry
    const repo = thread.repository.nameWithOwner
    const owner = repo.split('/')[0]!.toLowerCase()
    if (thread.author?.login.toLowerCase() === filters.username.toLowerCase()) continue
    // Threads in my own repos and forks are housekeeping, not reviewing someone else's project.
    if (owner === filters.username.toLowerCase()) continue
    if (filters.hidePrivateRepos && thread.repository.isPrivate) continue
    if (excludeRepos.has(repo.toLowerCase()) || excludeOrgs.has(owner)) continue

    const current = threads.get(thread.url) ?? {
      repo,
      title: thread.title,
      url: thread.url,
      number: thread.number,
      kind: kindOf(entry),
      state: stateOf(thread),
      reviewed: false,
      comments: 0,
      lastAt: entry.at,
      lastUrl: entry.url,
    }
    current.comments++
    current.reviewed ||= entry.review
    current.lastAt = entry.at
    current.lastUrl = entry.url
    threads.set(thread.url, current)
  }
  return [...threads.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt))
}
