import { test } from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml } from '../server/utils/html.ts'

// PR titles are editable by upstream maintainers, so the feed must not treat
// them as markup.
test('escapeHtml neutralises markup in a PR title', () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert(1)"> & 'q'`),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;q&#39;',
  )
})
