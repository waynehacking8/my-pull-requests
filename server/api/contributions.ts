// The search API caps per_page at 100 and refuses to page past 1000 results,
// so both limits have to be respected explicitly rather than assumed away.
const SEARCH_PAGE_SIZE = 100
const SEARCH_RESULT_LIMIT = 1000

// The build prerenders this payload from several places (/, /reviews' tab
// counts, the .json copy, the feed). One shared cache key makes that one set of
// GitHub calls per build instead of one per caller.
export default defineCachedEventHandler(async () => {
  const octokit = useOctokit()
  const user = await fetchUser()
  const hidePrivateRepos = process.env.HIDE_PRIVATE_REPOS === 'true'
  const excludeRepos = listFromEnv(process.env.EXCLUDE_REPOS)
  const excludeOrgs = listFromEnv(process.env.EXCLUDE_ORGS)
  const prCount = positiveIntFromEnv(process.env.PR_COUNT, 50)

  // Fetch pull requests from user
  const queryParts = [
    `is:pr`,
    '(is:open+OR+is:merged)',
    `author:"${user.username}"`,
    hidePrivateRepos ? 'is:public' : null,
    ...excludeRepos.map(repo => `-repo:${repo}`),
    ...excludeOrgs.map(org => `-org:${org}`),
  ].filter(Boolean)

  const q = queryParts.join('+')
  const wanted = Math.min(prCount, SEARCH_RESULT_LIMIT)

  // Page through the results instead of asking for prCount in one shot: once the
  // total crosses per_page's ceiling of 100 a single request silently drops the
  // remainder. per_page stays constant so page boundaries don't shift underneath
  // the loop; the overshoot is trimmed afterwards.
  const items = []
  const seen = new Set<number | bigint>()
  for (let page = 1; items.length < wanted; page++) {
    const { data } = await octokit.request('GET /search/issues', {
      q,
      // Without an explicit sort GitHub orders by relevance, which makes it
      // arbitrary which PRs fall off the end. Newest-first keeps it predictable.
      sort: 'created',
      order: 'desc',
      per_page: SEARCH_PAGE_SIZE,
      page,
      advanced_search: 'true',
    })

    // The search index is eventually consistent, so paging one query can return
    // the same PR on two pages and skip another entirely (measured: 88 distinct
    // results across 90 rows). Deduplicate rather than trusting page boundaries.
    for (const item of data.items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      items.push(item)
    }

    if (data.items.length < SEARCH_PAGE_SIZE) break
    // Deduplication can hold the tally under `wanted` forever, so stop once
    // every page the API is willing to serve has been requested.
    if (page >= Math.ceil(Math.min(data.total_count, SEARCH_RESULT_LIMIT) / SEARCH_PAGE_SIZE)) break
  }

  // Resolve each distinct repository once and in parallel. The previous per-PR
  // sequential await served most lookups from cache, but still serialised one
  // round trip per new repo into the critical path of every regeneration.
  const repoNames = [...new Set(items.slice(0, wanted).map(pr => pr.repository_url.split('/').slice(-2).join('/')))]
  const repos = new Map(await Promise.all(repoNames.map(async (fullName) => {
    const [owner, name] = fullName.split('/')
    return [fullName, await fetchRepo(owner!, name!)] as const
  })))

  const prs: PullRequest[] = items.slice(0, wanted).map((pr) => {
    const fullName = pr.repository_url.split('/').slice(-2).join('/')
    const repo = repos.get(fullName)
    if (!repo) throw new Error(`Repository metadata missing for ${fullName}`)

    return {
      repo: fullName,
      title: pr.title,
      url: pr.html_url,
      created_at: pr.created_at,
      merged_at: pr.pull_request?.merged_at ?? null,
      state: pr.pull_request?.merged_at ? 'merged' : pr.draft ? 'draft' : pr.state as 'open' | 'closed',
      number: pr.number,
      type: repo.owner.type, // Add type information (User or Organization)
      stars: repo.stargazers_count,
    }
  })

  return {
    user,
    prs,
    generatedAt: new Date().toISOString(),
  } as Contributions
}, { name: 'contributions', getKey: () => 'payload', maxAge: 300, swr: false })
