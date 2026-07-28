# Demo Mode

**Status:** Active

**Phase:** 3.4 flagship vertical slice

**Last updated:** 2026-07-28

**Owner visual acceptance:** PENDING OWNER TEST

## Purpose

Demo Mode is a free, temporary, simulated-only Armz Clash loop. It requires no wallet, creates no blockchain asset, and cannot produce monetary value. Phase 3.4 deliberately narrows the flagship experience to **Rookie Brawler versus Practice Automaton (Easy)** so art direction, battle readability, and result integrity can be approved before expanding the other five Common ARMZ.

Local URL: `http://127.0.0.1:3001/demo`

## Start locally

```bash
# Terminal 1
pnpm dev:api

# Terminal 2
pnpm dev:game

# Browser
open http://127.0.0.1:3001/demo
```

Use `127.0.0.1` consistently; do not mix it with `localhost` under strict CORS.

## Flagship flow

1. Enter the premium Arena landing.
2. Confirm the explicit Demo Mode disclosure.
3. Reveal or restore the temporary Level 1 Common Rookie Brawler.
4. Inspect the collection showcase, stats, simulated balance, and session history.
5. Enter the Rookie Brawler versus Practice Automaton matchup.
6. Start one server-authoritative battle with no second confirmation step.
7. Watch the 8–12 second presentation or use truthful **Skip to result**.
8. Receive an in-viewport Victory or Defeat presentation only after final synchronization.
9. Replay after cooldown, open Collection, or return to Arena.

The API always selects `rookie_brawler` for the active Phase 3.4 demo contender. Training rerolls change deterministic Common stats, not fighter identity.

## Safety contract

Demo Mode must remain enabled:

```text
ARMZ_DEMO_MODE_ENABLED=true
```

These systems must remain disabled:

```text
ARMZ_REAL_MINT_ENABLED=false
ARMZ_REAL_REWARDS_ENABLED=false
ARMZ_CLAIMS_ENABLED=false
ARMZ_MARKETPLACE_ENABLED=false
ARMZ_MARKETPLACE_SETTLEMENT_ENABLED=false
ARMZ_ORACLE_ENABLED=false
ARMZ_MAINNET_ENABLED=false
ARMZ_ADMIN_ECONOMY_WRITES_ENABLED=false
```

All displayed Demo $ARMZ is simulated, has no monetary value, and is not claimable, withdrawable, transferable, or blockchain-backed. There is no staking product or staking route.

## Current visual asset status

The Phase 3.4 runtime is asset-driven, but the owner-approved asset pack was not supplied with this work:

- Required owner slots: **27**
- Integrated final slots: **0**
- Missing-final slots: **27**
- Manifest status: `awaiting-owner-assets`
- Temporary fallback version: `phase3-3b-v1`

Every visible fallback carries a **Temporary art · final asset pending** label. The old Phase 3.3B textures and sprite rig are compatibility fallbacks only; they are not represented as final premium art. See [PHASE3_4_ASSET_PIPELINE.md](PHASE3_4_ASSET_PIPELINE.md).

## Battle contract

- Typical server duration: 8–12 seconds; target average near 11 seconds
- Grip lock target: near 2.2 seconds
- Active struggle target: near 3 seconds
- Readable cues: grip, push, counter, critical, recovery, fatigue, and final slam
- Responsive camera presets: desktop, tablet, mobile
- HUD: both portraits, names, Control values/bars, event cue, sound, music, reduced motion, skip
- Audio: original Web Audio synthesis; no downloaded or copyrighted tracks
- User preferences: SFX, music, and reduced motion persist in local storage
- Renderer ownership: one Pixi renderer per active battle; destroy removes canvas, listeners, timers, audio graph, and texture references

## Result integrity

The result is shown only when all conditions are true:

```text
done && finalSynced && integrityValid
```

`integrityValid` means:

- Victory: opponent final Control is `0` and player final Control is greater than `0`
- Defeat: player final Control is `0` and opponent final Control is greater than `0`

Normal playback and skip use the same server payload. A completed truthful payload is stored in `sessionStorage` so a direct refresh of `/demo/fight` restores the synchronized result. Invalid, malformed, or cross-session payloads are rejected. Result focus uses `preventScroll`, so the title and all actions remain in the current viewport.

## Responsive and accessibility expectations

The required matrix is:

- Desktop: 1280×720, 1366×768, 1440×900, 1920×1080
- Tablet: 768×1024, 820×1180, 1024×1366
- Mobile: 360×800, 375×812, 390×844, 393×852, 430×932

Acceptance requires no horizontal overflow, no hidden result actions, readable grip/HUD, safe-area spacing, reachable touch controls, keyboard activation, visible focus, reduced motion, mute controls, semantic Control meters, and one meaningful final result announcement rather than per-frame announcements.

## Validation

```bash
pnpm build:assets:phase34
pnpm assets:validate
pnpm test:unit
pnpm test:simulation
pnpm test:e2e
pnpm quality:ci
```

Owner visual acceptance remains **PENDING OWNER TEST**. Phase 4 has not started.
