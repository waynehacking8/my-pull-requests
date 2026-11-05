import assert from 'node:assert/strict'
import { test } from 'node:test'
import worker, { dispatch } from './src/index.js'

function fakeFetch(status, calls) {
  return async (url, init) => {
    calls.push({ url, init })
    return { status, text: async () => 'body' }
  }
}

test('dispatch posts workflow_dispatch on main with the token', async () => {
  const calls = []
  await dispatch({ repo: 'o/r', workflow: 'w.yml' }, 'tok', fakeFetch(204, calls))
  assert.equal(calls[0].url, 'https://api.github.com/repos/o/r/actions/workflows/w.yml/dispatches')
  assert.equal(calls[0].init.method, 'POST')
  assert.equal(calls[0].init.headers.Authorization, 'Bearer tok')
  assert.deepEqual(JSON.parse(calls[0].init.body), { ref: 'main' })
})

test('a non-204 answer is an error, so the Worker run shows as failed', async () => {
  await assert.rejects(dispatch({ repo: 'o/r', workflow: 'w.yml' }, 'tok', fakeFetch(401, [])), /HTTP 401/)
})

test('each cron starts only its own workflow', async () => {
  const seen = []
  const original = globalThis.fetch
  globalThis.fetch = fakeFetch(204, seen)
  try {
    await worker.scheduled({ cron: '*/10 * * * *' }, { GITHUB_TOKEN: 't' })
    await worker.scheduled({ cron: '17 * * * *' }, { GITHUB_TOKEN: 't' })
  }
  finally {
    globalThis.fetch = original
  }
  assert.deepEqual(seen.map(c => c.url.split('/repos/')[1]), [
    'waynehacking8/my-pull-requests/actions/workflows/pages.yml/dispatches',
    'waynehacking8/waynehacking8.github.io/actions/workflows/deploy.yml/dispatches',
  ])
})
