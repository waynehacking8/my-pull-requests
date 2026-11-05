// PRs, issues and RFCs by other people that the user reviewed or commented on.
// Two GraphQL queries cover it: the user's issue comments (which include PR
// conversation comments) and their PR review contributions. The search API
// would need one extra request per thread to find the comment itself.

type CommentsPage = {
  user: {
    issueComments: {
      pageInfo: { hasPreviousPage: boolean, startCursor: string | null }
      nodes: { url: string, createdAt: string, pullRequest: { state: RawThread['state'], isDraft: boolean } | null, issue: RawThread }[]
    }
  }
}

type ReviewsPage = {
  user: {
    contributionsCollection: {
      pullRequestReviewContributions: {
        nodes: { occurredAt: string, pullRequestReview: { url: string }, pullRequest: RawThread }[]
      }
    }
  }
}

const THREAD = `title number url author { login } repository { nameWithOwner isPrivate }`

const COMMENTS_QUERY = `query($login: String!, $before: String) {
  user(login: $login) {
    issueComments(last: 100, before: $before) {
      pageInfo { hasPreviousPage startCursor }
      nodes { url createdAt pullRequest { state isDraft } issue { ${THREAD} state labels(first: 20) { nodes { name } } } }
    }
  }
}`

const REVIEWS_QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      pullRequestReviewContributions(last: 100) {
        nodes { occurredAt pullRequestReview { url } pullRequest { ${THREAD} state isDraft } }
      }
    }
  }
}`

// 10 pages of 100 comments reaches far enough back without letting one build
// spend an unbounded share of the token's hourly GraphQL budget.
const MAX_COMMENT_PAGES = 10

function listFromEnv(value: string | undefined): string[] {
  return value?.split(',').map(item => item.trim()).filter(Boolean) ?? []
}

export default defineEventHandler(async () => {
  const octokit = useOctokit()
  const user = await fetchUser()
  const entries: RawEntry[] = []

  let before: string | null = null
  for (let page = 0; page < MAX_COMMENT_PAGES; page++) {
    const data: CommentsPage = await octokit.graphql(COMMENTS_QUERY, { login: user.username, before })
    const { nodes, pageInfo } = data.user.issueComments
    for (const node of nodes) {
      // On a PR the issue view reports OPEN or CLOSED only; the PR knows MERGED.
      const thread = node.pullRequest ? { ...node.issue, ...node.pullRequest } : node.issue
      entries.push({ at: node.createdAt, url: node.url, review: false, isPullRequest: !!node.pullRequest, thread })
    }
    if (!pageInfo.hasPreviousPage) break
    before = pageInfo.startCursor
  }

  const reviewData: ReviewsPage = await octokit.graphql(REVIEWS_QUERY, { login: user.username })
  for (const node of reviewData.user.contributionsCollection.pullRequestReviewContributions.nodes) {
    entries.push({ at: node.occurredAt, url: node.pullRequestReview.url, review: true, isPullRequest: true, thread: node.pullRequest })
  }

  return {
    user,
    threads: buildThreads(entries, {
      username: user.username,
      hidePrivateRepos: process.env.HIDE_PRIVATE_REPOS === 'true',
      excludeRepos: new Set(listFromEnv(process.env.EXCLUDE_REPOS)),
      excludeOrgs: new Set(listFromEnv(process.env.EXCLUDE_ORGS)),
    }),
    generatedAt: new Date().toISOString(),
  } satisfies Reviews
})
