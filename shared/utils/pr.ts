// A merged PR's meaningful timestamp is when it landed, not when it was opened.
// Showing created_at for everything made a PR merged yesterday read "3 weeks
// ago" next to a green "completed" badge, which claims the opposite of the truth.
export function prActivityAt(pr: Pick<PullRequest, 'merged_at' | 'created_at'>): string {
  return pr.merged_at ?? pr.created_at
}

// One count per state, shared by the hero stats and the filter buttons so the
// two can never disagree.
export function countStates(items: Pick<PullRequest, 'state'>[]): Record<PullRequest['state'], number> {
  const counts = { merged: 0, open: 0, draft: 0, closed: 0 }
  for (const item of items) counts[item.state]++
  return counts
}

export const KIND_LABEL: Record<ReviewThread['kind'], string> = { pr: 'PR', issue: 'Issue', rfc: 'RFC' }
