# Phase 3.3 Visual Reset

**Status:** IMPLEMENTED — PENDING OWNER TEST

## Objective

Complete visual reset replacing the rejected Phase 3.1/3.2 SaaS-dashboard aesthetic with a premium, cinematic game shell. The owner rejected the previous build as generic, empty, and lacking spectacle.

## Changes Delivered

### Game Shell & Navigation

- Dark atmospheric base (`--armz-bg-base: #070b12`) with gold accent (`--armz-accent: #d4af6a`)
- Premium nav tabs with active-state glow, disabled future tabs with `cursor: not-allowed`
- Consistent container widths, balanced spacing, no excessive empty regions

### Landing Page (`/`)

- Cinematic hero: title + CTA left, ARMZ-vs-Automaton showcase right
- Atmospheric radial gradients for depth
- Clear Play Demo CTA with premium button styling

### Demo Landing (`/demo`)

- Premium hero with fighter preview cards
- Four-step flow visualization
- Session-ready state with safety messaging

### Demo Collection (`/demo/collection`)

- Character showcase with atmospheric backdrop
- Large portrait, grouped stats, reward/opponent tiles
- Fight CTA prominent, battle history accessible

### Versus Screen (`/demo/fight`)

- Cinematic composition: player/opponent showcases with faction-tinted frames
- Central VS emblem
- Matchup detail tiles (reward, battles, status)
- Confirm Battle → Start Simulated Battle flow

### ARMZ Reveal

- Arena light sweep entrance
- Scale/fade portrait animation
- Staggered badge/name/stat reveals via `armz-fade-up` keyframe
- Skip support, reduced-motion instant reveal
- Duration: 2.5–4s normal, 0.5–1s reduced motion

### Battle Stage HUD

- Fighter panels: portrait + name + rarity badge + ControlBar + numeric value
- Event indicator pill with live battle status
- Scene-transition result screen (not a generic panel)
- Victory/defeat atmospheric gradients
- Final Control snapshot displayed

## Asset Disciplines Applied

All visual work follows five production disciplines (not callable tools):

1. **game-asset-core** — Clean transparency, stable anchors, consistent proportions, no background boxes
2. **game-animation-frames** — Stable frame-to-frame identity, no sprite bleeding
3. **game-character-consistency** — Same character across collection, battle, reveal, result
4. **game-tilesets** — Arena/table/pad elements tile correctly, no clipping
5. **game-ui-icons** — Icons and badges consistent with design tokens

## Design Tokens Reference

| Token            | Value     | Usage             |
| ---------------- | --------- | ----------------- |
| `--armz-bg-base` | `#070b12` | Page background   |
| `--armz-accent`  | `#d4af6a` | Gold accent, CTAs |
| `--armz-cyan`    | `#5ec8ff` | Player faction    |
| `--armz-enemy`   | `#e07a4a` | Opponent faction  |
| `--armz-danger`  | `#f07178` | Alerts, defeat    |
| `--armz-success` | `#3ecf8e` | Victory, positive |

## Viewports Validated

- Desktop: 1440×900, 1920×1080
- Tablet: 768×1024
- Mobile: 390×844, 360×800

## Owner Acceptance

See `PHASE3_3_OWNER_ACCEPTANCE.md` for the full checklist.
Status remains **PENDING OWNER TEST** until the owner personally confirms.
