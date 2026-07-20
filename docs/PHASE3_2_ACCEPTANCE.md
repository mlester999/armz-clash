# Phase 3.2 — Final Demo Acceptance

## Scope

Final technical acceptance for the playable Demo Mode slice:

- Easy battle rebalance (`demo-combat-v2`)
- Recovery events (~3% of battles, at most once)
- Explicit demo persistence modes (fail closed)
- Hosted RLS / persistence probes
- Multi-viewport Playwright coverage
- Owner visual acceptance remains **pending until the owner confirms**

Phase 4 is **not** started.

## Balance (1M sims)

| Metric            | Previous (v1)  | Phase 3.2 (v2)     | Target          |
| ----------------- | -------------- | ------------------ | --------------- |
| Overall win rate  | ~70.7%         | **71.99%**         | 69–75%          |
| Min Common        | ~52.1%         | **59.35%**         | 58–62%          |
| Avg Common        | ~70–72%        | **72.57%**         | 69–75%          |
| Max Common        | ~86.6%         | **84.70%**         | 82–86%          |
| Recovery / battle | ~0.003         | **0.032** (~3.2%)  | 2–5% of battles |
| Config version    | demo-combat-v1 | **demo-combat-v2** | —               |

## Persistence modes

```bash
ARMZ_DEMO_PERSISTENCE_MODE=database          # default / hosted / production
ARMZ_DEMO_PERSISTENCE_MODE=memory-test       # CI / foundation E2E only
ARMZ_DEMO_PERSISTENCE_MODE=memory-development # local explicit only
```

Rules:

- No silent database → memory fallback
- Production forbids memory modes
- Database mode fails closed when tables/config unavailable
- Public status exposes only safe labels (`Database`, `Test memory`, …)

## Hosted probes

```bash
# API must be running with database mode against armz-clash-dev
SUPABASE_REMOTE_WRITES_APPROVED=true \
RUN_HOSTED_SUPABASE_TESTS=true \
ARMZ_DEMO_PERSISTENCE_MODE=database \
pnpm test:demo:persistence:hosted

SUPABASE_REMOTE_WRITES_APPROVED=true \
RUN_HOSTED_SUPABASE_TESTS=true \
pnpm test:rls:demo:hosted
```

## Owner visual checklist

See `docs/PHASE3_OWNER_ACCEPTANCE.md`. Status remains **PENDING OWNER TEST**.

## Safety

All real-value flags remain disabled. Demo rewards remain simulated only.
