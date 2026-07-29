# Armz Clash

**ARMZ CLASH** — premium browser-based Solana arm-wrestling game.

**Current phase: Phase 3.4A — premium battle-asset contract repair**

This repository contains the Armz Clash monorepo and a complete simulated Demo Mode loop built around Rookie Brawler versus Practice Automaton. Phase 3.4 includes the premium shell, reveal, collection, versus screen, battle HUD, responsive camera, and truthful result flow. Wallet authentication is Devnet-only when configured; minting, real rewards, claims, marketplace settlement, mainnet, and staking are **not active**.

> **Asset gate:** Phase 3.4A replaces the flat fighter sprites with paired layered rigs, repairs arena/table composition, and adds directional VFX. The revised manifest contains **21 Tier A required**, **12 Tier B required**, and **5 Tier C optional** slots: **33 required / 38 declared**. No owner-approved final PNG/WebP files are present, so the current state is **0/33 required final**. Final visual acceptance remains **PENDING OWNER TEST**.

## Safety posture

- Gameplay rewards are **probabilistic**, not guaranteed
- Real-value systems are **disabled by default**
- **Mainnet is disabled by default**
- **No staking** in this version
- Not an investment product, fixed-income product, or guaranteed ROI scheme
- Reward obligations must never depend on new player purchases

## Architecture

```
apps/web        Public landing, docs, legal (port 3000)
apps/game       Player game shell (port 3001)
apps/admin      Admin shell (port 3002)
services/api    Fastify API health + public config (port 4000)
services/worker Worker health + job registry foundation (port 4002)
packages/*      Shared UI, config, domain, observability, database
supabase/       Hosted Supabase migrations and seed
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Requirements

- Node.js 22+
- pnpm 11+

## Install

```bash
pnpm install
cp .env.example .env
```

Do not invent production secrets. Leave optional Phase 2+ credentials empty for local foundation work.

## Development

Use **`127.0.0.1`** for all local URLs (do not mix with `localhost` under strict CORS).

```bash
pnpm doctor        # local env + connectivity checks (no secrets printed)
pnpm clean:next    # clear .next / .turbo after NEXT_PUBLIC_* changes

pnpm dev:web       # http://127.0.0.1:3000
pnpm dev:game      # http://127.0.0.1:3001
pnpm dev:admin     # http://127.0.0.1:3002
pnpm dev:api       # http://127.0.0.1:4000
pnpm dev:worker    # health http://127.0.0.1:4002
```

Demo Mode smoke path:

```bash
# Terminal 1
pnpm dev:api
# Terminal 2
pnpm dev:game
# Browser
open http://127.0.0.1:3001/demo
```

Build legacy fallbacks plus the Phase 3.4 owner-asset pack:

```bash
pnpm build:assets
pnpm assets:validate
```

Owner files belong under `apps/game/assets/phase3-4/final/` using the exact stems in [docs/PHASE3_4A_IMAGE_GENERATION_HANDOFF.md](docs/PHASE3_4A_IMAGE_GENERATION_HANDOFF.md). The builder emits responsive WebP/PNG variants, hashes, acceptance counts, and battle rig/pose manifests; missing files never become `final` silently.

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) and [docs/REOWN_SETUP.md](docs/REOWN_SETUP.md).

## Quality gates

```bash
pnpm check          # format, lint, typecheck, unit tests, env, secrets, db validate
pnpm quality:ci     # deterministic CI suite including build (do not use bare `pnpm ci`)
pnpm test:unit
pnpm test:e2e       # requires Playwright browsers
pnpm assets:validate
pnpm test:simulation # one million deterministic battle integrity checks
pnpm db:validate    # static migration checks (no hosted writes)
pnpm env:check
pnpm secrets:scan
pnpm doctor
```

## Feature flags (defaults)

| Flag                                  | Default |
| ------------------------------------- | ------- |
| `ARMZ_DEMO_MODE_ENABLED`              | `true`  |
| `ARMZ_REAL_MINT_ENABLED`              | `false` |
| `ARMZ_REAL_REWARDS_ENABLED`           | `false` |
| `ARMZ_CLAIMS_ENABLED`                 | `false` |
| `ARMZ_MARKETPLACE_ENABLED`            | `false` |
| `ARMZ_MARKETPLACE_SETTLEMENT_ENABLED` | `false` |
| `ARMZ_ORACLE_ENABLED`                 | `false` |
| `ARMZ_MAINNET_ENABLED`                | `false` |
| `ARMZ_ADMIN_ECONOMY_WRITES_ENABLED`   | `false` |

Only the strings `true` and `false` are accepted.

## Git safety

Armz Clash must be its **own** Git root. Do not commit this project into the parent Atlas Game Studio repository.

```bash
git rev-parse --show-toplevel
# must print: .../armz-clash
```

If `gh` is available later:

```bash
gh repo create armz-clash --private --source=. --remote=origin
git push -u origin main
```

## Hosted Supabase

Migrations live in `supabase/migrations/`. CI never pushes hosted migrations.

See [docs/HOSTED_SUPABASE.md](docs/HOSTED_SUPABASE.md).

```bash
# Local static checks
pnpm db:validate

# After owner provisions a development project and approves remote writes:
SUPABASE_REMOTE_WRITES_APPROVED=true pnpm dlx supabase db push --linked
RUN_HOSTED_SUPABASE_TESTS=true pnpm test:db:hosted
RUN_HOSTED_SUPABASE_TESTS=true pnpm test:rls:hosted
```

Secrets belong in `.env` only — never in `.env.example`.

## Token ticker

The temporary game token ticker is centralized as **ARMZ** (`$ARMZ` display) in `@armz-clash/config`. Rename there — do not hardcode across components.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/ECONOMY_SAFETY.md](docs/ECONOMY_SAFETY.md)
- [docs/PHASE1_REPORT_TEMPLATE.md](docs/PHASE1_REPORT_TEMPLATE.md)
- [docs/DEMO_MODE.md](docs/DEMO_MODE.md)
- [docs/PHASE3_4_PREMIUM_REBUILD.md](docs/PHASE3_4_PREMIUM_REBUILD.md)
- [docs/PHASE3_4_ASSET_PIPELINE.md](docs/PHASE3_4_ASSET_PIPELINE.md)
- [docs/PHASE3_4_BATTLE_PRESENTATION.md](docs/PHASE3_4_BATTLE_PRESENTATION.md)
- [docs/PHASE3_4_RESULT_UX.md](docs/PHASE3_4_RESULT_UX.md)
- [docs/PHASE3_4_OWNER_ACCEPTANCE.md](docs/PHASE3_4_OWNER_ACCEPTANCE.md)
- [docs/PHASE3_4_FINAL_REPORT_TEMPLATE.md](docs/PHASE3_4_FINAL_REPORT_TEMPLATE.md)
- [docs/PHASE3_4A_CONTRACT_REPAIR.md](docs/PHASE3_4A_CONTRACT_REPAIR.md)
- [docs/PHASE3_4A_LAYERED_RIG.md](docs/PHASE3_4A_LAYERED_RIG.md)
- [docs/PHASE3_4A_POSE_MANIFEST.md](docs/PHASE3_4A_POSE_MANIFEST.md)
- [docs/PHASE3_4A_ARENA_AND_TABLE.md](docs/PHASE3_4A_ARENA_AND_TABLE.md)
- [docs/PHASE3_4A_DIRECTIONAL_VFX.md](docs/PHASE3_4A_DIRECTIONAL_VFX.md)
- [docs/PHASE3_4A_IMAGE_GENERATION_HANDOFF.md](docs/PHASE3_4A_IMAGE_GENERATION_HANDOFF.md)
- [docs/PHASE3_4A_OWNER_ACCEPTANCE.md](docs/PHASE3_4A_OWNER_ACCEPTANCE.md)
- [docs/PHASE3_4A_FINAL_REPORT_TEMPLATE.md](docs/PHASE3_4A_FINAL_REPORT_TEMPLATE.md)
- [docs/PHASE3_3B_QWEN_ONLY_ASSET_PIPELINE.md](docs/PHASE3_3B_QWEN_ONLY_ASSET_PIPELINE.md)
- [docs/PHASE3_3B_OWNER_ACCEPTANCE.md](docs/PHASE3_3B_OWNER_ACCEPTANCE.md)

## Current limitations

- Owner-approved final visual assets are not present: 0/33 required final, 0/38 total final
- No real minting, real rewards, claims, marketplace settlement, mainnet, or staking
- Hosted Supabase validation pending owner credentials
- Phase 3.4 owner visual acceptance: **PENDING OWNER TEST**
- Phase 4 not started

## Next phase

Generate Tier A and Tier B using the Phase 3.4A handoff, integrate the owner-approved PNG/WebP pack,
rerun the complete acceptance matrix, and obtain owner approval. **Phase 4 must not start before that
approval.**
