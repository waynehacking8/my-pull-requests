# Dispatcher

Cloudflare Worker that starts the deploy workflows on time. GitHub's own
scheduled runs arrive hours late (about four a day for a 10-minute cron).

- Every 10 minutes: `waynehacking8/my-pull-requests` → `pages.yml` (PR wall).
- Hourly at :17: `waynehacking8/waynehacking8.github.io` → `deploy.yml` (portfolio, CV).

It has no HTTP route (`workers_dev = false`), only cron triggers.

## Deploy

```sh
cd tools/dispatcher
npx wrangler@4 deploy
npx wrangler@4 secret put GITHUB_TOKEN   # paste the token; never commit it
```

The token is a fine-grained PAT, resource owner waynehacking8, only these two
repos, permission **Actions: read and write**, nothing else. It expires; when
it does the Worker logs HTTP 401 and the sites fall back to GitHub's slow cron.
Renew it at github.com/settings/personal-access-tokens and run `secret put`
again.

## Live (2026-11-06)

- Cloudflare account: Waynehacking8@gmail.com's Account (sign in with Google;
  GitHub sign-in is refused because the account was created with Google).
  Wrangler's OAuth grant covers only that account.
- Worker `wayne-sites-dispatcher`, no route, crons `*/10 * * * *` and `17 * * * *`.
- Token `wayne-sites-dispatcher` (fine-grained), expires **2027-11-06**.
  GitHub's settings page needs sudo mode; the email code works.
- Check it works: dispatched runs show up as event `workflow_dispatch` in
  `gh run list -R waynehacking8/my-pull-requests --workflow pages.yml`.
  Logs: `npx wrangler@4 tail` here, or Workers → wayne-sites-dispatcher → Logs.

## Test

`node --test tools/dispatcher/test.mjs` from the repo root.
