// A merged PR's meaningful timestamp is when it landed, not when it was opened.
// Showing created_at for everything made a PR merged yesterday read "3 weeks
// ago" next to a green "completed" badge, which claims the opposite of the truth.
export function prActivityAt(pr: PullRequest): string {
  return pr.merged_at ?? pr.created_at
}
