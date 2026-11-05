// GitHub runs scheduled workflows late and drops many of them (about four
// runs a day against a 10-minute cron). This Cloudflare Worker fires on
// Cloudflare's own cron and starts the two deploy workflows through the
// workflow_dispatch API, so the PR wall and the portfolio rebuild on time.
// GitHub's own cron stays in the workflows as a fallback; each workflow's
// concurrency group keeps overlapping runs from racing.
//
// Secret: GITHUB_TOKEN, a fine-grained PAT limited to the two repos below
// with "Actions: read and write" and nothing else.

const TARGETS = {
  // Cron expression (must match wrangler.toml) -> workflows to start.
  '*/10 * * * *': [{ repo: 'waynehacking8/my-pull-requests', workflow: 'pages.yml' }],
  '17 * * * *': [{ repo: 'waynehacking8/waynehacking8.github.io', workflow: 'deploy.yml' }],
}

export async function dispatch(target, token, fetchImpl = fetch) {
  const res = await fetchImpl(
    `https://api.github.com/repos/${target.repo}/actions/workflows/${target.workflow}/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'wayne-sites-dispatcher',
      },
      body: JSON.stringify({ ref: 'main' }),
    },
  )
  // 204 is success; anything else is logged and surfaces in the Worker's logs.
  if (res.status !== 204) {
    throw new Error(`${target.repo}/${target.workflow}: HTTP ${res.status} ${await res.text()}`)
  }
}

export default {
  async scheduled(event, env) {
    const targets = TARGETS[event.cron] ?? []
    const results = await Promise.allSettled(targets.map(t => dispatch(t, env.GITHUB_TOKEN)))
    const failed = results.filter(r => r.status === 'rejected')
    for (const f of failed) console.error(f.reason.message)
    if (failed.length) throw new Error(`${failed.length} dispatch(es) failed`)
  },
}
