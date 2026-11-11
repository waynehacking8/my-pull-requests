# Handoff: prs.wayne.is-a.dev

## State (2026-11-05)

- Static Nuxt 4 site on GitHub Pages, custom domain prs.wayne.is-a.dev (is-a.dev record points at waynehacking8.github.io; HTTPS enforced).
- `.github/workflows/pages.yml` rebuilds on push and every 10 minutes, started by the Cloudflare dispatcher (`tools/dispatcher`, workflow_dispatch); GitHub's cron is the fallback. Pushes also run `pnpm lint && pnpm typecheck && pnpm test`; dispatch and cron runs skip them. Build job has `contents: read, pages: read`; only the deploy job holds `pages: write` and `id-token: write`.
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

- Actions pinned to commit SHAs; checkout has `persist-credentials: false`. `.github/dependabot.yml` covers github-actions (7-day cooldown) and npm (pnpm, 3-day cooldown) weekly.
- This repo is a fork (atinux/my-pull-requests), so Dependabot version updates had to be switched on by hand in Settings → Advanced Security (done 2026-11-05). Alerts and security fixes are on.
- npm Dependabot cooldown is 3 days (GitHub's default, written out). Dependabot passes it to pnpm as `minimum-release-age`, which also rejects versions the lockfile already pins while they are younger than the window, so an npm update job fails with ERR_PNPM_NO_MATCHING_VERSION if the lockfile was refreshed with a fresh release in the last 3 days. 7 days broke every weekly job. It clears on its own.
- `pnpm.overrides` force esbuild >= 0.28.1 and glob >= 14.0.2. Accepted and dismissed as tolerable risk (alerts #2, #4): minimatch (build time only: ESLint plugin chain and nuxt > nitropack > archiver > readdir-glob; forcing 11 breaks eslint-plugin-import-x's `makeRe` import) and deepmerge (no patched release). Neither ships in the static output.
- GitHub runs the `*/10` cron far less often than asked (a few times a day). The Cloudflare Worker in `tools/dispatcher` (live since 2026-11-06) starts `pages.yml` every 10 minutes and the portfolio's `deploy.yml` hourly through workflow_dispatch; GitHub's cron stays as the fallback. Its token expires 2027-11-06: renew before then (steps in `tools/dispatcher/README.md`), or both sites quietly drop back to GitHub's slow cron.
- If the page says stale while every `pages.yml` run succeeds, compare `generatedAt` in `/api/contributions.json` with the latest run. On 2026-11-10 Pages kept serving the 20:01 UTC build for 8 hours although every later deploy reported success; all of them reused the same commit SHA as `pages_build_version`. A push (new SHA) brought it back on 2026-11-11, and same-SHA dispatches went live again after it. Root cause unknown.

## Open

- Formal reviews come per contribution year; issue comments stop at 1,000 (MAX_COMMENT_PAGES).
