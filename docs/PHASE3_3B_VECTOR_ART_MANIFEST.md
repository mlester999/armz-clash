# Phase 3.3B — Vector Art Manifest

**Status:** PENDING OWNER TEST
**Date:** 2026-07-21

---

## Source SVG Inventory

All SVGs are hand-authored by Qwen using layered `<path>` elements with gradients, shadows, texture patterns, material highlights, edge lighting, seams, rivets, and wrinkles. Primitives (`rect`, `circle`, `ellipse`) are used only as construction aids, never as final visible anatomy.

### Rookie Brawler (`apps/game/assets/source/fighters/rookie-brawler/`)

| File                 | Purpose                       |
| -------------------- | ----------------------------- |
| `portrait.svg`       | Collection card portrait      |
| `reveal.svg`         | Reveal animation surface      |
| `versus.svg`         | Versus screen art             |
| `result-victory.svg` | Victory result pose           |
| `result-defeat.svg`  | Defeat result pose            |
| `rig/shoulder.svg`   | Deltoid + shoulder cap        |
| `rig/upper-arm.svg`  | Bicep/tricep mass with shadow |
| `rig/elbow.svg`      | Elbow joint                   |
| `rig/forearm.svg`    | Flexor/extensor mass          |
| `rig/wrist.svg`      | Wrist joint                   |
| `rig/hand.svg`       | Palm + knuckles               |
| `rig/fingers.svg`    | Finger group                  |
| `rig/thumb.svg`      | Thumb                         |
| `rig/wraps.svg`      | Cloth bandage wraps overlay   |
| `rig/bracer.svg`     | Metal bracer plate overlay    |
| `rig/highlights.svg` | Specular highlight overlay    |
| `rig/shadows.svg`    | Ambient occlusion overlay     |

**Identity**: scrappy arena fighter, warm skin tones, leather wrist wrap, cloth forearm bandages, small metal bracer plate, stitch detail, wear marks, Common-tier treatment.

### Practice Automaton (`apps/game/assets/source/fighters/practice-automaton/`)

| File                       | Purpose                          |
| -------------------------- | -------------------------------- |
| `portrait.svg`             | Opponent selection portrait      |
| `versus.svg`               | Versus screen art                |
| `result-victory.svg`       | Victory result pose              |
| `result-defeat.svg`        | Defeat result pose               |
| `rig/shoulder-mount.svg`   | Industrial shoulder mount        |
| `rig/upper-housing.svg`    | Upper arm housing                |
| `rig/elbow-bearing.svg`    | Elbow bearing joint              |
| `rig/hydraulic-piston.svg` | Hydraulic piston + pressure hose |
| `rig/forearm-casing.svg`   | Forearm casing                   |
| `rig/wrist-assembly.svg`   | Wrist assembly                   |
| `rig/mechanical-hand.svg`  | Mechanical palm                  |
| `rig/fingers.svg`          | Mechanical fingers               |
| `rig/grip-pad.svg`         | Grip pad overlay                 |
| `rig/highlights.svg`       | Metal specular highlights        |
| `rig/shadows.svg`          | Ambient occlusion                |

**Identity**: arena training machine, industrial construction, blue/cyan accent, beginner-friendly silhouette. Must NOT resemble: mouse, appliance, floating head, bare piston, generic pipe, segmented rod, disconnected claw.

### Arena (`apps/game/assets/source/arena/`)

| File              | Purpose                    |
| ----------------- | -------------------------- |
| `background.svg`  | Arena wall panels (tiling) |
| `crowd.svg`       | Crowd silhouette layers    |
| `lighting.svg`    | Spotlight cones            |
| `banners.svg`     | Tournament banners         |
| `table.svg`       | Championship table surface |
| `elbow-pad.svg`   | Elbow pad                  |
| `pin-pad.svg`     | Pin pad                    |
| `table-frame.svg` | Metal table frame          |

### Effects (`apps/game/assets/source/effects/`)

| File                  | Purpose               |
| --------------------- | --------------------- |
| `grip-flash.svg`      | Grip lock flash       |
| `pressure-ring.svg`   | Pressure ring         |
| `momentum-streak.svg` | Momentum streak       |
| `recovery-glow.svg`   | Recovery glow         |
| `critical-impact.svg` | Critical impact burst |
| `slam-impact.svg`     | Slam shockwave        |
| `victory-accent.svg`  | Victory accent        |
| `defeat-accent.svg`   | Defeat accent         |

---

## Runtime Output (`apps/game/public/assets/game/phase3-3b/`)

Each source SVG produces four raster files:

- `@1x.webp` (primary, mobile)
- `@2x.webp` (primary, desktop)
- `@1x.png` (fallback)
- `@2x.png` (fallback)

WebP quality: 82. PNG compression level: 6. No timestamps in output.

---

## SVG Security Rules

- No `<script>` tags
- No external URLs (except XML namespace declarations)
- No duplicate IDs within a file
- `viewBox` attribute required on root `<svg>`
- Validated by `scripts/asset-source-validation.test.ts`

---

## Asset Size Report

See `docs/PHASE3_3B_ASSET_SIZE_REPORT.md` for per-file sizes.
