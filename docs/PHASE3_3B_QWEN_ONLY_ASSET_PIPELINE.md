# Phase 3.3B — Qwen-Only Premium Vector Asset Pipeline

**Status:** PENDING OWNER TEST
**Date:** 2026-07-21
**Scope:** Rookie Brawler, Practice Automaton — full SVG-to-texture sprite pipeline

---

## Overview

Phase 3.3B replaces all visible PixiJS Graphics fighter anatomy for Rookie Brawler and Practice Automaton with a production SVG-to-texture sprite pipeline. All artwork is hand-authored as layered SVG by Qwen (no external image generation, no stock art, no downloaded assets). The build script rasterizes SVGs deterministically into WebP (primary) + PNG (fallback) at 1× and 2× densities.

The remaining five Common ARMZ (Dockhand, Street Challenger, Iron Apprentice, Desert Grappler, Arena Recruit) retain their existing procedural rendering system.

---

## Pipeline Architecture

```
apps/game/assets/source/          ← hand-authored SVG sources (not shipped to client)
  fighters/rookie-brawler/        ← portrait, reveal, versus, result, rig/ (12 parts)
  fighters/practice-automaton/    ← portrait, versus, result, rig/ (11 parts)
  arena/                          ← background, crowd, lighting, banners, table, pads, frame
  effects/                        ← 8 authored effect sprites
  ui/                             ← icons, result frames, badges

scripts/build-game-assets.ts      ← deterministic build (sharp, offline, no network)
scripts/game-asset-config.ts      ← rig anchors + authored pose definitions

apps/game/public/assets/game/phase3-3b/   ← generated runtime output
  fighters/  arena/  effects/  ui/
  atlases/phase3-3b.png + .json           ← PixiJS spritesheet atlas
  manifests/asset-manifest.json           ← typed asset entries
  manifests/rig-manifest.json             ← per-fighter rig part list
  manifests/pose-manifest.json            ← 22 authored poses + cue mapping
  manifests/hashes.json                   ← SHA-256 content hashes (determinism proof)
```

---

## Build Script: `scripts/build-game-assets.ts`

- **Deterministic**: sorted file iteration, fixed WebP quality 82, PNG compression 6, no timestamps
- **Validation**: viewBox present, no `<script>` tags, no external URLs (except XML namespaces), no duplicate IDs
- **Output**: WebP primary + PNG fallback at 1× and 2×; PixiJS-compatible atlas JSON; typed manifests; content hashes
- **Offline**: no network access required
- **npm script**: `pnpm build:assets`

---

## Typed Manifests (`packages/game-core/src/assets/`)

| File                      | Purpose                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `asset-manifest.types.ts` | `AssetEntry` with anchors, pivots, bounding boxes, density variants                    |
| `pose-manifest.types.ts`  | `PoseDefinition` with per-bone transforms, layer visibility, VFX triggers, camera cues |
| `manifest-loader.ts`      | Runtime fetch of generated JSON from `/assets/game/phase3-3b/manifests/`               |
| `index.ts`                | Barrel export                                                                          |

---

## Fighter Coverage

| Fighter            | Rig Parts        | Poses                     | Surfaces                                  |
| ------------------ | ---------------- | ------------------------- | ----------------------------------------- |
| Rookie Brawler     | 12 sprite layers | 15 authored battle states | portrait, reveal, versus, victory, defeat |
| Practice Automaton | 11 sprite layers | 15 authored battle states | portrait, versus, victory, defeat         |

---

## Constraints Honored

- No external image generation used
- No stock art or downloaded assets
- Server result remains authoritative; visuals never invent outcome
- Battle pacing preserved: ~8–12s average, grip lock ~2.2s
- Phase 4 not started
- Owner visual acceptance: **PENDING OWNER TEST**

---

## Quality Gates

| Gate                             | Status             |
| -------------------------------- | ------------------ |
| `pnpm build:assets`              | PASSED LOCALLY     |
| SVG source validation (10 tests) | PASSED LOCALLY     |
| Manifest validation (12 tests)   | PASSED LOCALLY     |
| Regression tests (18 tests)      | PASSED LOCALLY     |
| `pnpm typecheck`                 | PASSED LOCALLY     |
| `pnpm lint`                      | PASSED LOCALLY     |
| `pnpm format:check`              | PASSED LOCALLY     |
| `pnpm test:unit` (137 tests)     | PASSED LOCALLY     |
| Owner visual acceptance          | PENDING OWNER TEST |
