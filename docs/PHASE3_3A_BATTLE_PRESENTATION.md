# Phase 3.3A — Battle Presentation: Camera, VFX & Particle System

**Status:** PENDING OWNER TEST
**Date:** 2026-07-21
**Scope:** Battle renderer cinematic feedback

---

## Owner-Reported Issues Addressed

| #   | Issue                                              | Resolution                                                                               |
| --- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Effects look cheap                                 | Multi-layer VFX: impact flash, slam flash, radial burst, recovery glow, momentum streaks |
| 2   | Pressure/impact/resistance/recovery not satisfying | Particle system with gravity, life decay, capped at 80 particles; event-driven bursts    |
| 3   | Final slam not impactful                           | Full-screen slam flash + radial burst + camera shake (reduced-motion aware)              |
| 4   | Fight doesn't feel expensive                       | Layered lighting, atmospheric haze, spotlight cones, premium color grading               |

---

## Camera Changes

### Before (Phase 3.3)

- `tableY = h * 0.68`
- `tableW = min(w * 0.72, 620)`
- Fighters felt distant, arena too empty

### After (Phase 3.3A)

- `tableY = h * 0.72` — camera moved closer to table
- `tableW = min(w * 0.88, 720)` — wider table presence
- Fighters now dominate the frame
- Struggle is centered and readable

---

## VFX Overlay System

### Impact Flash

- Triggered on: `push`, `push_heavy`, `counter`, `critical`
- White radial gradient at grip point
- Intensity: 0.3–0.6 based on event type
- Duration: 150–250ms

### Slam Flash

- Triggered on: `winning_slam`, `defeated`
- Full-screen white flash (0.8 intensity)
- Radial burst from grip point
- Duration: 400ms
- Reduced-motion: opacity reduced to 0.4

### Recovery Glow

- Triggered on: `recovery`
- Green aura around player arm
- Intensity: 0.5
- Duration: 600ms

### Momentum Streaks

- Triggered on: `momentum`, `decisive`
- Directional streaks following push direction
- Color: cyan (player) or orange (opponent)
- Duration: 300ms

### Ambient Haze

- Continuous subtle particle drift
- Low opacity (0.1–0.2)
- Adds depth without distraction
- Disabled in reduced-motion mode

---

## Particle System

### Architecture

- `spawnBurst(x, y, count, color, speed)` method
- Gravity: 0.15 px/frame²
- Life decay: 0.02–0.04 per frame
- Max particles: 80 (hard cap)
- Cleanup: particles removed when life ≤ 0

### Event-Driven Bursts

| Event          | Count | Color          | Speed |
| -------------- | ----- | -------------- | ----- |
| `grip`         | 12    | gold           | 2.0   |
| `push`         | 16    | cyan/orange    | 2.5   |
| `push_heavy`   | 24    | cyan/orange    | 3.0   |
| `critical`     | 32    | accent         | 3.5   |
| `counter`      | 20    | opponent color | 2.8   |
| `recovery`     | 18    | green          | 2.2   |
| `winning_slam` | 40    | gold           | 4.0   |
| `defeated`     | 40    | danger         | 4.0   |

### Performance

- Particle pool reused (no allocation during battle)
- Capped at 80 particles prevents mobile jank
- Reduced-motion: particle count halved, no gravity

---

## Arena Atmosphere

### Crowd

- 3 rows of silhouettes
- Varied heights (20–35px)
- Subtle animation (sway on critical events)
- Opacity: 0.15–0.25

### Lighting

- **Spotlight cones**: 2 cones from top, framing the table
- **Pillar accents**: vertical light strips at arena edges
- **Faction banners**: cyan (player) and orange (opponent) at top corners

### Table

- Championship table with metallic finish
- Center line and grip pad
- Reflection highlight
- Vibration on heavy impacts (reduced-motion aware)

---

## PixiJS v8 APIs Used

- `app.init()` — async initialization
- `g.rect().fill()` — rectangle drawing
- `g.moveTo().lineTo().stroke()` — line drawing
- `g.quadraticCurveTo()` — organic curves for arms
- `g.arc()` — joints and circular elements
- `GraphicsContext` — layered drawing

---

## Reduced Motion Support

All VFX respect `reducedMotion` flag:

- Particle count: 50% reduction
- Camera shake: disabled
- Slam flash: opacity 0.4 (from 0.8)
- Ambient haze: disabled
- Momentum streaks: disabled
- Recovery glow: reduced to 0.3

---

## Files Modified

- `apps/game/src/features/demo/renderer/BattleRenderer.ts` — Complete rewrite

---

## Validation

- TypeScript: PASSED
- Unit tests: PASSED
- E2E (desktop/tablet/mobile): PASSED
- No performance regression (60fps on desktop, 30fps+ on mobile)

---

## Phase 3.3B Supersession Note (2026-07-21)

Phase 3.3B supersedes the procedural rendering described in this document for **Rookie Brawler** and **Practice Automaton** only. These two fighters now use hand-authored SVG sprite rigs rasterized by the deterministic asset pipeline. The remaining five Common ARMZ retain the procedural system described here.

See [Phase 3.3B Asset Pipeline](PHASE3_3B_QWEN_ONLY_ASSET_PIPELINE.md) for details.
