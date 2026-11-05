import { Octokit } from 'octokit'

let _octokit: Octokit

export function useOctokit() {
  if (!_octokit) {
    _octokit = new Octokit({
      auth: process.env.NUXT_GITHUB_TOKEN,
    })
  }
  return _octokit
}

// The Actions GITHUB_TOKEN cannot call GET /user, so the Pages build names the
// account in GITHUB_USERNAME instead.
export async function fetchUser(): Promise<User> {
  const octokit = useOctokit()
  const username = process.env.GITHUB_USERNAME?.trim()
  const { data } = username
    ? await octokit.request('GET /users/{username}', { username })
    : await octokit.request('GET /user')
  return { name: data.name ?? data.login, username: data.login, avatar: data.avatar_url }
}

// In memory cache as this is called internally in /api/contributions
const RepoCache = new Map()

// Read more about caching functions https://hub.nuxt.com/docs/features/cache#server-functions-caching
export async function fetchRepo(owner: string, name: string) {
  if (RepoCache.has(`${owner}/${name}`)) {
    return RepoCache.get(`${owner}/${name}`)
  }
  // Fetch repository details to get owner type
  const { data } = await useOctokit().request('GET /repos/{owner}/{name}', {
    owner,
    name,
  })

  RepoCache.set(`${owner}/${name}`, data)
  return data
}
