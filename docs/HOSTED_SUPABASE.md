# Hosted Supabase workflow — Armz Clash

## Project policy

- Use a **development** Supabase project only (for example `armz-clash-dev`).
- Never target production from Phase 1.x scripts.
- Hosted writes require explicit approval.

## Required environment variables

Put secrets only in local `.env` (gitignored). Never put secrets in `.env.example`.

| Variable                          | Purpose                                          |
| --------------------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`        | Project URL                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Browser/anon key                                 |
| `SUPABASE_SERVICE_ROLE_KEY`       | Server-only validation scripts                   |
| `SUPABASE_DATABASE_URL`           | Direct SQL inspection (optional but recommended) |
| `SUPABASE_PROJECT_REF`            | Project reference                                |
| `SUPABASE_REMOTE_WRITES_APPROVED` | Must be `true` to push migrations                |
| `RUN_HOSTED_SUPABASE_TESTS`       | Must be `true` to run hosted probes              |

## Safety gates

```bash
# Static migration checks (always safe)
pnpm db:validate

# Link development project (one-time)
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <DEV_PROJECT_REF>

# Review pending migrations
pnpm dlx supabase migration list --linked

# Apply migrations only with explicit approval
SUPABASE_REMOTE_WRITES_APPROVED=true pnpm dlx supabase db push --linked

# Hosted validation suite
RUN_HOSTED_SUPABASE_TESTS=true pnpm test:db:hosted
RUN_HOSTED_SUPABASE_TESTS=true pnpm test:rls:hosted
RUN_HOSTED_SUPABASE_TESTS=true pnpm db:lint:hosted
```

## What Phase 1 migrations create

- `app_config_versions`
- `system_feature_flags`
- `admin_roles`
- `admin_permissions`
- `admin_role_permissions`
- `admin_role_assignments`
- `admin_audit_logs`
- `reconciliation_runs`

They do **not** create player, wallet, mint, reward, claim, marketplace settlement, or staking tables.

## Feature-flag expectations

| Key                              | Expected |
| -------------------------------- | -------- |
| `demo_mode_enabled`              | `true`   |
| `real_mint_enabled`              | `false`  |
| `real_rewards_enabled`           | `false`  |
| `claims_enabled`                 | `false`  |
| `marketplace_enabled`            | `false`  |
| `marketplace_settlement_enabled` | `false`  |
| `oracle_enabled`                 | `false`  |
| `mainnet_enabled`                | `false`  |
| `admin_economy_writes_enabled`   | `false`  |

## Admin bootstrap

Phase 1.x does **not** create a Super Admin assignment. Admin bootstrap is a later controlled phase.

## CI policy

GitHub Actions never pushes hosted migrations and never uses service-role secrets.
