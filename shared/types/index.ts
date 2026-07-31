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

export type Contributions = {
  user: User
  prs: PullRequest[]
  // When this payload was built on the server, so the page can show real data freshness
  generatedAt: string
}
