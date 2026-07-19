# Development — Armz Clash

## Prerequisites

- Node.js 22+
- pnpm 11.9+

## Install

```bash
pnpm install
cp .env.example .env
# Fill NEXT_PUBLIC_REOWN_PROJECT_ID and other owner values in root .env
```

## Environment strategy

| Location                                      | Purpose                                                              |
| --------------------------------------------- | -------------------------------------------------------------------- |
| Root `.env`                                   | Owner source of truth (public + server). Never commit.               |
| Root `.env.example`                           | Safe template without secrets.                                       |
| `apps/web/.env.local`, `apps/game/.env.local` | Optional **client-only** public overrides for Next.js. Never commit. |
| `apps/*/ .env.example`                        | Safe app templates for public vars only.                             |

Rules:

1. Prefer root `.env` for local development.
2. API loads monorepo root `.env` even when started from `services/api`.
3. Next apps load root `NEXT_PUBLIC_*` via `next.config.ts` and may use app `.env.local`.
4. Do not copy server secrets into app env files.
5. Do not mix `localhost` and `127.0.0.1` — use **`127.0.0.1` everywhere**.
6. Changing `NEXT_PUBLIC_*` requires restarting Next apps (rebuild for production).
7. After env changes, clear stale Next/Turbo caches: `pnpm clean:next`.

## Start apps

| Command           | URL                                                 |
| ----------------- | --------------------------------------------------- |
| `pnpm dev`        | All packages with a `dev` task (parallel via Turbo) |
| `pnpm dev:web`    | http://127.0.0.1:3000                               |
| `pnpm dev:game`   | http://127.0.0.1:3001                               |
| `pnpm dev:admin`  | http://127.0.0.1:3002                               |
| `pnpm dev:api`    | http://127.0.0.1:4000                               |
| `pnpm dev:worker` | health http://127.0.0.1:4002                        |

### Recommended Demo Mode smoke path

```bash
# Terminal 1
pnpm dev:api

# Terminal 2
pnpm dev:game
```

Browser: http://127.0.0.1:3001/demo

API probes:

```bash
curl -s http://127.0.0.1:4000/health
curl -s http://127.0.0.1:4000/ready
curl -s http://127.0.0.1:4000/version
curl -s -H "Origin: http://127.0.0.1:3001" http://127.0.0.1:4000/api/v1/config/public
```

CORS must return `Access-Control-Allow-Origin: http://127.0.0.1:3001`.

## Doctor

```bash
pnpm doctor
# alias
pnpm dev:doctor
```

Checks (never prints secret values):

- Reown Project ID presence (configured / missing)
- API / web / game URLs
- Devnet selection
- localhost vs 127.0.0.1 mismatch
- Demo Mode enabled, mainnet and real-value flags disabled
- API reachability and game-origin CORS when API is up
- Optional Supabase public config and auth secrets presence

## Clear Next / Turbo caches

```bash
pnpm clean:next
```

Removes only:

- `apps/web/.next`, `apps/game/.next`, `apps/admin/.next`
- `.turbo` caches under apps and root

Does **not** delete source, `.env*`, Supabase migrations, or `.git`.

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
pnpm audit:client-bundles
pnpm check
pnpm quality:ci
```

## E2E

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright starts **API (4000)**, **web (3000)**, **game (3001)**, and **admin (3002)** on `127.0.0.1`.

- Root `.env` is loaded for `NEXT_PUBLIC_*` and API secrets (never committed).
- Hostnames are standardized to `127.0.0.1` (not mixed with `localhost`).
- Apps use `next dev` + `allowedDevOrigins: ['127.0.0.1']` for iteration.
- Foundation tests assert safe Reown **unconfigured** state when no Project ID is set.
- With `NEXT_PUBLIC_REOWN_PROJECT_ID` present, tests assert the unconfigured banner is absent.
- Wallet modal open tests are skipped unless Reown is configured.

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

| Symptom                                     | Fix                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Reown project ID is not configured          | Set `NEXT_PUBLIC_REOWN_PROJECT_ID` in root `.env`, run `pnpm clean:next`, restart web/game |
| Could not start Demo Mode / Failed to fetch | Start API (`pnpm dev:api`), confirm CORS origins use `127.0.0.1`                           |
| CORS origin denied                          | Align `ARMZ_WEB_ORIGIN` / `ARMZ_GAME_ORIGIN` with the browser origin                       |
| Mixed localhost / 127.0.0.1                 | Use `127.0.0.1` only for local config                                                      |
| Git root is parent Programming folder       | Work inside `armz-clash` with its own `.git`                                               |
| Feature flag parse error                    | Use only `true` or `false`                                                                 |
| Service fails on mainnet in development     | Keep `ARMZ_MAINNET_ENABLED=false`                                                          |
| Browser refuses Supabase client             | Provide anon key, never service role                                                       |

## Git safety

```bash
git rev-parse --show-toplevel
# must end with /armz-clash
```

Never `git add ..` from this directory.
Never push to Atlas Game Studio.
Never commit `.env`, `.env.local`, or secrets.
