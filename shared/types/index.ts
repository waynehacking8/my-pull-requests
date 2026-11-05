export type User = {
  username: string
  name: string
  avatar: string
}

export type PullRequest = {
  repo: string
  title: string
  url: string
  created_at: string
  // Null unless the PR landed. Kept separate from created_at so the card can
  // report when work shipped rather than when it was first proposed.
  merged_at: string | null
  state: 'merged' | 'draft' | 'open' | 'closed'
  number: number
  type: 'User' | 'Organization'
  stars: number
}

// A card on either page. A review thread has no star count or owner type, and
// its title opens my comment while the number opens the thread.
export type WallItem = Omit<PullRequest, 'stars' | 'type'> & {
  stars?: number
  type?: PullRequest['type']
  // Set on review threads; picks the chip text and issue versus PR glyphs.
  kind?: ReviewThread['kind']
  threadUrl?: string
  activityVerb?: string
}

// One PR, issue or RFC by someone else that the user reviewed or commented on.
export type ReviewThread = {
  repo: string
  title: string
  url: string
  number: number
  kind: 'pr' | 'issue' | 'rfc'
  state: 'merged' | 'draft' | 'open' | 'closed'
  // True when at least one entry is a formal PR review, not only a comment.
  reviewed: boolean
  comments: number
  lastAt: string
  lastUrl: string
}

export type Reviews = {
  user: User
  threads: ReviewThread[]
  generatedAt: string
}

export type Contributions = {
  user: User
  prs: PullRequest[]
  // When this payload was built on the server, so the page can show real data freshness
  generatedAt: string
}
