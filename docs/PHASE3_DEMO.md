# Phase 3 — Demo Mode Architecture

## Overview

Phase 3 delivers a **playable Demo Mode** with:

- Anonymous HttpOnly demo sessions
- One temporary Level 1 **Common** ARMZ per session
- Easy **Practice Automaton** opponent
- Server-authoritative simulated battles + timelines
- PixiJS battle renderer
- Simulated Demo $ARMZ (no monetary value, not claimable)

Phase 4 is **not** started (no real ARMZ inventory/energy).

## Feature flag

```bash
ARMZ_DEMO_MODE_ENABLED=true
NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED=true
```

When `false`, demo endpoints return `503 demo_mode_disabled` and the UI shows an unavailable state.

All real-value flags remain `false`.

## Local connectivity (Phase 3.0A)

- Browser and API must share hostname **`127.0.0.1`** (not `localhost`).
- Game calls `NEXT_PUBLIC_ARMZ_API_URL` (default `http://127.0.0.1:4000`) with `credentials: 'include'`.
- Strict CORS allows only player origins (`ARMZ_WEB_ORIGIN`, `ARMZ_GAME_ORIGIN`).
- If the API is down, the UI shows a clear message naming the API URL (not a bare `Failed to fetch`).
- Start: `pnpm dev:api` + `pnpm dev:game`, then open `http://127.0.0.1:3001/demo`.
- Validate: `pnpm doctor`.

## Demo session security

| Property   | Value                                              |
| ---------- | -------------------------------------------------- |
| Cookie     | `armz_clash_demo_session`                          |
| Token      | ≥32 secure random bytes (base64url)                |
| Storage    | HMAC hash only in `demo_sessions.token_hash`       |
| Flags      | HttpOnly, SameSite=Lax, Secure outside development |
| Lifetime   | `ARMZ_DEMO_SESSION_TTL_SECONDS` (default 86400)    |
| Separation | Distinct from wallet `armz_clash_session`          |

Demo sessions never convert into wallet sessions. Optional `player_id` link is informational only.

## Configuration

| Env                                     | Default                 |
| --------------------------------------- | ----------------------- |
| `ARMZ_DEMO_SESSION_TTL_SECONDS`         | 86400                   |
| `ARMZ_DEMO_REPLAY_COOLDOWN_SECONDS`     | 60                      |
| `ARMZ_DEMO_ARMZ_RESET_COOLDOWN_SECONDS` | 3600                    |
| `ARMZ_DEMO_MAX_BATTLES_PER_SESSION`     | 20                      |
| `ARMZ_DEMO_SESSION_COOKIE_NAME`         | armz_clash_demo_session |
| `ARMZ_DEMO_CONFIGURATION_VERSION`       | demo-combat-v1          |

## API

- `POST /api/v1/demo/session` — create/restore
- `GET /api/v1/demo/session`
- `POST /api/v1/demo/armz` / `GET /api/v1/demo/armz`
- `POST /api/v1/demo/armz/reset`
- `POST /api/v1/demo/battle` (idempotency key)
- `GET /api/v1/demo/history`
- `GET /api/v1/demo/config`

## Battle engine

Package: `@armz-clash/game-core`

- Integer stats; critical chance in basis points
- Outcome pre-rolled with calibrated Easy win chance (~70% average Common)
- Timeline events for Pixi playback
- Seed stored as hash only (`battle_seed_hash`)
- Rewards: 1.00–2.00 Demo $ARMZ micro-units on victory only

## Balance (100k sims)

See unit test output for exact rates. Targets:

- Average Common: 68–76%
- Min stats: ≥52%
- Max stats: ≤86%

## PixiJS renderer

`apps/game/src/features/demo/renderer/BattleRenderer.ts`

Layers: background → atmosphere → table → fighters → particles → HUD.

Procedural multi-segment arms (shoulder/elbow/wrist/fist) — not single-pivot clock arms.

## Assets & skills

Game assets use disciplines from:

1. **game-asset-core** — engine anchors, clean silhouettes, no screenshot reuse
2. **game-animation-frames** — cue-driven state machine
3. **game-character-consistency** — stable per-preset palette
4. **game-tilesets** — arena band tiling
5. **game-ui-icons** — strength bar / badge chrome

Primary Phase 3 visuals are **procedural Pixi graphics** plus CSS reveal art for deterministic web performance. Manifest: `docs/PHASE3_ASSET_MANIFEST.md`.

## Worker

Job `cleanup.expired_demo_sessions` deletes expired `demo_sessions` (cascade).

## Persistence

Supabase tables when configured; in-memory store when service role is absent (local/CI foundation).
