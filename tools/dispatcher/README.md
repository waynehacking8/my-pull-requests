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

## Test

`node --test tools/dispatcher/test.mjs` from the repo root.
