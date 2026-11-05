// Run with `node --test tests/`; Node 24 strips the types itself.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildThreads, type RawEntry, type RawThread } from '../server/utils/reviews.ts'

const filters = { username: 'me', hidePrivateRepos: true, excludeRepos: new Set(['org/skip']), excludeOrgs: new Set(['ignored']) }

function thread(over: Partial<RawThread> = {}): RawThread {
  return {
    title: 'Fix the thing',
    number: 1,
    url: 'https://github.com/org/repo/pull/1',
    author: { login: 'someone' },
    repository: { nameWithOwner: 'org/repo', isPrivate: false },
    state: 'OPEN',
    ...over,
  }
}

function entry(over: Partial<RawEntry> = {}): RawEntry {
  return { at: '2026-10-01T00:00:00Z', url: 'https://github.com/org/repo/pull/1#c1', review: false, isPullRequest: true, thread: thread(), ...over }
}

test('folds a thread\'s comments into one row whose link is the latest comment', () => {
  const rows = buildThreads([
    entry({ at: '2026-10-03T00:00:00Z', url: 'latest', review: false }),
    entry({ at: '2026-10-01T00:00:00Z', url: 'first', review: true }),
  ], filters)
  assert.equal(rows.length, 1)
  assert.deepEqual(
    { comments: rows[0]!.comments, reviewed: rows[0]!.reviewed, lastUrl: rows[0]!.lastUrl, lastAt: rows[0]!.lastAt },
    { comments: 2, reviewed: true, lastUrl: 'latest', lastAt: '2026-10-03T00:00:00Z' },
  )
})

test('drops my own threads, my own repos, private repos and excluded repos or orgs', () => {
  const rows = buildThreads([
    entry({ thread: thread({ url: 'a', author: { login: 'me' } }) }),
    entry({ thread: thread({ url: 'b', repository: { nameWithOwner: 'Me/fork', isPrivate: false } }) }),
    entry({ thread: thread({ url: 'c', repository: { nameWithOwner: 'org/secret', isPrivate: true } }) }),
    entry({ thread: thread({ url: 'd', repository: { nameWithOwner: 'org/skip', isPrivate: false } }) }),
    entry({ thread: thread({ url: 'e', repository: { nameWithOwner: 'ignored/x', isPrivate: false } }) }),
    entry({ thread: thread({ url: 'kept' }) }),
  ], filters)
  assert.deepEqual(rows.map(r => r.url), ['kept'])
})

test('labels PRs, issues and RFCs and maps GitHub states', () => {
  const rows = buildThreads([
    entry({ at: '2026-10-04T00:00:00Z', thread: thread({ url: 'pr', state: 'MERGED' }) }),
    entry({ at: '2026-10-03T00:00:00Z', isPullRequest: false, thread: thread({ url: 'issue', state: 'CLOSED' }) }),
    entry({ at: '2026-10-02T00:00:00Z', isPullRequest: false, thread: thread({ url: 'rfc', title: '[RFC]: Autotuner v2' }) }),
    entry({ at: '2026-10-01T00:00:00Z', thread: thread({ url: 'draft', isDraft: true }) }),
  ], filters)
  assert.deepEqual(rows.map(r => [r.url, r.kind, r.state]), [
    ['pr', 'pr', 'merged'],
    ['issue', 'issue', 'closed'],
    ['rfc', 'rfc', 'open'],
    ['draft', 'pr', 'draft'],
  ])
})

test('matches excluded repos and orgs regardless of case', () => {
  const rows = buildThreads([
    entry({ thread: thread({ url: 'a', repository: { nameWithOwner: 'Org/Skip', isPrivate: false } }) }),
    entry({ thread: thread({ url: 'b', repository: { nameWithOwner: 'IGNORED/x', isPrivate: false } }) }),
    entry({ thread: thread({ url: 'kept' }) }),
  ], { ...filters, excludeRepos: new Set(['ORG/skip']), excludeOrgs: new Set(['Ignored']) })
  assert.deepEqual(rows.map(r => r.url), ['kept'])
})
