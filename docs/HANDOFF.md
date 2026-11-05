# Handoff: prs.wayne.is-a.dev

## State (2026-11-05)

- Static Nuxt 4 site on GitHub Pages, custom domain prs.wayne.is-a.dev (is-a.dev record points at waynehacking8.github.io; HTTPS enforced).
- `.github/workflows/pages.yml` rebuilds every 10 minutes and on push. Pushes also run `pnpm lint && pnpm typecheck && pnpm test`; the cron run skips them. Build job has `contents: read, pages: read`; only the deploy job holds `pages: write` and `id-token: write`.
- Two pages: `/` (my PRs, `server/api/contributions.ts`) and `/reviews` (others' PRs, issues and RFCs I commented on or reviewed, `server/api/reviews.ts`, folding logic in `server/utils/reviews.ts`). Both payloads go through `memoFor` (`server/utils/memo.ts`, in memory, 5 minutes), so one build calls GitHub once per payload. Do not switch to `defineCachedEventHandler`: Nitro persists that cache in `node_modules/.cache`, and the next local build then republishes old data and ignores env changes.
- `useLiveRecords()` polls `/api/contributions.json` and `/api/reviews.json` on both pages and only moves data forward.
- Excluded from both walls: `is-a-dev/register`, this repo, `chihmingyang/cs2680` (EXCLUDE_REPOS in the workflow). Matching is case-insensitive.

- `/api/contributions.json` feeds the portfolio's Patches page (waynehacking8.github.io, `hooks/patches.py`). Keep PR_COUNT above the real open plus merged total, or that page undercounts.

## Local build

`NUXT_GITHUB_TOKEN=$(gh auth token) GITHUB_USERNAME=waynehacking8 HIDE_PRIVATE_REPOS=true PR_COUNT=500 EXCLUDE_REPOS=is-a-dev/register,waynehacking8/my-pull-requests,chihmingyang/cs2680 NUXT_PUBLIC_SITE_URL=https://prs.wayne.is-a.dev pnpm exec nuxi generate`

On Windows, serve `.output/public` with `python -m http.server -d <path>` started from another directory, or the next generate fails with EBUSY.

## Traps

- `vue-tsc --noEmit` on the root tsconfig checks nothing (`"files": []`); use `pnpm typecheck` (nuxi typecheck).
- Never render relative times at build time: the prerendered text goes stale and breaks hydration. `PullRequest.vue` writes the date and fills "x ago" on the client.
- GitHub Pages cannot set security headers; scanners will report HSTS, CSP and frame headers missing.
- Scheduled workflows are disabled by GitHub after 60 days without repository activity; a push re-enables them.

## Supply chain

- Actions pinned to commit SHAs; checkout has `persist-credentials: false`. `.github/dependabot.yml` covers github-actions and npm (pnpm) weekly with a 7-day cooldown.
- This repo is a fork (atinux/my-pull-requests), so Dependabot version updates had to be switched on by hand in Settings → Advanced Security (done 2026-11-05). Alerts and security fixes are on.
- The cooldown hides releases younger than 7 days from Dependabot's resolver, so if package.json already requires one (vue-tsc ^3.3.14, released 2026-10-29), the npm update job fails with ERR_PNPM_NO_MATCHING_VERSION until that release is a week old. It clears on its own; do not remove the cooldown for it.
- `pnpm.overrides` force esbuild >= 0.28.1 and glob >= 14.0.2. Accepted and dismissed as tolerable risk (alerts #2, #4): minimatch (dev only, ESLint plugin chain; forcing 11 breaks eslint-plugin-import-x's `makeRe` import) and deepmerge (no patched release). Neither ships in the static output.
- GitHub runs the `*/10` cron far less often than asked (a few times a day); the "stale" dot is expected between runs.

## Open

- Formal reviews come per contribution year; issue comments stop at 1,000 (MAX_COMMENT_PAGES).
