# Development — Armz Clash

## Prerequisites

- Node.js 22+
- pnpm 11.9+

## Install

```bash
pnpm install
cp .env.example .env
```

## Start apps

| Command           | URL                          |
| ----------------- | ---------------------------- |
| `pnpm dev:web`    | http://127.0.0.1:3000        |
| `pnpm dev:game`   | http://127.0.0.1:3001        |
| `pnpm dev:admin`  | http://127.0.0.1:3002        |
| `pnpm dev:api`    | http://127.0.0.1:4000        |
| `pnpm dev:worker` | health http://127.0.0.1:4002 |

## Quality

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm env:check
pnpm db:validate
pnpm secrets:scan
pnpm build
pnpm check
pnpm ci
```

## E2E

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright starts **API (4000)**, **web (3000)**, **game (3001)**, and **admin (3002)** on `127.0.0.1`.

- Root `.env` is loaded for `NEXT_PUBLIC_*` and API secrets (never committed).
- Hostnames are standardized to `127.0.0.1` (not mixed with `localhost`).
- Apps use `next dev` + `allowedDevOrigins` for iteration; production-like `next start` is preferred long-term.
- Foundation tests assert safe Reown **unconfigured** state when no Project ID is set.
- With `NEXT_PUBLIC_REOWN_PROJECT_ID` present, tests assert the unconfigured banner is absent.
- Lit multi-version console warnings may appear from Reown’s dependency tree; currently non-blocking (single `lit@3.3.0` in the lockfile).

## Database validation

Static migration validation (no hosted writes):

```bash
pnpm db:validate
```

Hosted writes require explicit approval:

```bash
SUPABASE_REMOTE_WRITES_APPROVED=true
RUN_HOSTED_SUPABASE_TESTS=true
```

## Common errors

| Symptom                                 | Fix                                          |
| --------------------------------------- | -------------------------------------------- |
| Git root is parent Programming folder   | Work inside `armz-clash` with its own `.git` |
| Feature flag parse error                | Use only `true` or `false`                   |
| Service fails on mainnet in development | Keep `ARMZ_MAINNET_ENABLED=false`            |
| Browser refuses Supabase client         | Provide anon key, never service role         |

## Git safety

```bash
git rev-parse --show-toplevel
# must end with /armz-clash
```

Never `git add ..` from this directory.
Never push to Atlas Game Studio.
