import { test } from 'node:test'
import assert from 'node:assert/strict'
import { memoFor } from '../server/utils/memo.ts'

test('memoFor shares one call between concurrent and repeat callers within the TTL', async () => {
  let runs = 0
  let now = 0
  const get = memoFor(async () => ++runs, 1000, () => now)
  assert.deepEqual(await Promise.all([get(), get()]), [1, 1])
  now = 999
  assert.equal(await get(), 1)
  now = 1000
  assert.equal(await get(), 2)
})

test('memoFor does not keep a failed call', async () => {
  let runs = 0
  const get = memoFor(async () => {
    if (++runs === 1) throw new Error('boom')
    return runs
  }, 1000, () => 0)
  await assert.rejects(get())
  assert.equal(await get(), 2)
})
