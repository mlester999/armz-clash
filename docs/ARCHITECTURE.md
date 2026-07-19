# Architecture — Armz Clash

## Monorepo responsibilities

| Path                     | Responsibility                                     |
| ------------------------ | -------------------------------------------------- |
| `apps/web`               | Public marketing, how-to-play, docs, legal, status |
| `apps/game`              | Authenticated player experience (later phases)     |
| `apps/admin`             | Internal operations portal (later phases)          |
| `services/api`           | Authoritative HTTP API (Fastify)                   |
| `services/worker`        | Background reconciliation and monitoring           |
| `packages/ui`            | Design tokens, spacing system, shared components   |
| `packages/config`        | Product constants, env validation, feature flags   |
| `packages/game-core`     | Combat/rarity domain types and static configs      |
| `packages/economy-core`  | Treasury/fee domain types and validators           |
| `packages/blockchain`    | Solana network helpers and future interfaces       |
| `packages/database`      | DB types and Supabase client boundaries            |
| `packages/observability` | Logging, correlation, health types                 |
| `supabase/`              | SQL migrations, seed, hosted project config        |

## Application boundaries

- **web** must not contain privileged admin mutations.
- **game** must not trust client battle outcomes.
- **admin** must not expose fake production metrics.
- Screenshots under `/screenshots` are private references and must never be imported into app bundles.

## Service boundaries

- **API** validates input, enforces auth (later), writes auditable records, exposes health/public config.
- **Worker** runs idempotent jobs with UTC-derived windows; no fragile midnight full-table rewrites.

## Client-safe vs server-only

| Safe in browser      | Server-only                    |
| -------------------- | ------------------------------ |
| `NEXT_PUBLIC_*`      | `SUPABASE_SERVICE_ROLE_KEY`    |
| Anon Supabase key    | Session/nonce secrets          |
| Public config flags  | Treasury signers               |
| Token display symbol | Database URLs with credentials |

Import rules:

- Browser code: `@armz-clash/config/env/client`, `@armz-clash/database/browser`
- Server code: `@armz-clash/config/env/server`, `@armz-clash/database/server`

## Future blockchain flow

1. Wallet connects via Reown AppKit (Phase 2+)
2. Server issues nonce; wallet signs message
3. Server verifies signature; issues short-lived session
4. Sensitive actions require session + optional on-chain proof

## Future battle authority flow

1. Client requests battle start
2. Server validates energy, ARMZ ownership, treasury capacity
3. Server computes outcome with auditable seed
4. Client renders animation timeline; never decides result

## Future ledger authority flow

1. Server allocates reward lots within treasury budgets
2. Claim eligibility and fees computed server-side
3. On-chain claim verified; ledger marked claimed
4. Reconciliation worker detects drift

## Deployment direction

- Frontend apps: Vercel or equivalent (separate projects or monorepo filters)
- API/worker: Node host or Supabase Edge where appropriate
- Database: Hosted Supabase (development first)
- Chain: Solana Devnet default; Mainnet owner-gated
