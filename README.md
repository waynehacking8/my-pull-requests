# Showcase your Open Source Contributions 🤍

Create a website with an RSS feed of your recent GitHub pull requests across the Open Source projects you contribute to.

![atinux-pull-requests](https://github.com/user-attachments/assets/cfa82cc2-51af-4fd4-9012-1f8517dd370f)

Demo: https://prs.atinux.com

## Features

- List the 50 most recent pull requests you've contributed to.
- RSS feed
- Only add your GitHub token to get started

## Setup

Make sure to install the dependencies with [pnpm](https://pnpm.io/installation#using-corepack):

```bash
pnpm install
```

Copy the `.env.example` file to `.env` and fill in your GitHub token:

```bash
cp .env.example .env
```

Create a GitHub token with no special scope on [GitHub](https://github.com/settings/personal-access-tokens/new) and set it in the `.env` file:

```bash
NUXT_GITHUB_TOKEN=<TOKEN>
```

If you want to customize the number of displayed PRs (Default: 50):
```bash
PR_COUNT=<NUMBER>
```

If you want to hide private repos:
```bash
HIDE_PRIVATE_REPOS=<BOOLEAN>
```

If you want to exclude specifics orgs:
```bash
EXCLUDE_ORGS=<COMMA_SEPERATED_LIST>
```

If you want to exclude specifics repos:
```bash
EXCLUDE_ORGS=<COMMA_SEPERATED_LIST>
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

This fork is a static site on GitHub Pages. `.github/workflows/pages.yml` runs
`nuxi generate` on every push to `main` and every 10 minutes, with the workflow's
own `GITHUB_TOKEN`, so no token secret is needed. To set it up, choose
**GitHub Actions** as the Pages source in the repository settings.

Build the static site locally:

```bash
pnpm exec nuxi generate
```

## Credits

This project is inspired by [Anthony Fu](https://github.com/antfu)'s [releases.antfu.me](https://github.com/antfu/releases.antfu.me) project.

## License

[MIT](./LICENSE)
