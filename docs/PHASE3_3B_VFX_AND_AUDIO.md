# Phase 3.3B — VFX and Audio

**Status:** PENDING OWNER TEST
**Date:** 2026-07-21

---

## VFX System

### Authored Effect Sprites

All VFX use authored SVG-based effect sprites rasterized by the asset pipeline. No raw PixiJS Graphics circles for effect particles.

| Effect          | Source SVG                    | Trigger                    |
| --------------- | ----------------------------- | -------------------------- |
| Grip flash      | `effects/grip-flash.svg`      | `grip_spark` VFX cue       |
| Pressure ring   | `effects/pressure-ring.svg`   | `dust_light`, `dust_heavy` |
| Momentum streak | `effects/momentum-streak.svg` | `energy_trail`             |
| Recovery glow   | `effects/recovery-glow.svg`   | Recovery animation cue     |
| Critical impact | `effects/critical-impact.svg` | `critical_flash`           |
| Slam shockwave  | `effects/slam-impact.svg`     | `final_impact`             |
| Victory accent  | `effects/victory-accent.svg`  | `victory_particles`        |
| Defeat accent   | `effects/defeat-accent.svg`   | `defeat_particles`         |

### Particle System

- Sprite textures instead of raw Graphics circles
- Capped at 80 particles (no growing arrays)
- Gravity + life decay
- Event-driven bursts via `spawnBurst()`
- VFX triggered by pose manifest `vfxTriggers` and timeline `vfxCue`

### Reduced Motion

When `prefers-reduced-motion` is active:

- Static indicators replace animated particles
- No camera shake
- No momentum streaks
- Impact flashes shown as single-frame static overlays

---

## Audio System

### Implementation

All audio is **synthesized live via Web Audio API**. No downloaded, streamed, or copyrighted audio files. No external audio assets.

### BattleAudio (`apps/game/src/features/demo/renderer/BattleAudio.ts`)

Single `AudioContext` lifecycle. Destroy-safe. No duplicate contexts. No leaked oscillators.

### Audio Cues

| Cue ID          | Description           | Trigger                  |
| --------------- | --------------------- | ------------------------ |
| `ambience_loop` | Arena ambience bed    | Battle start             |
| `hands_lock`    | Grip lock impact      | `hands_locked` event     |
| `cloth_move`    | Cloth/fabric movement | Player strain            |
| `metal_move`    | Mechanical movement   | Automaton strain         |
| `strain`        | Effort/pressure sound | Active struggle          |
| `table_creak`   | Table stress          | Heavy push events        |
| `impact_light`  | Light impact          | `push_light`             |
| `impact_heavy`  | Heavy impact          | `push_heavy`             |
| `critical`      | Critical push accent  | `critical` cue           |
| `recovery`      | Recovery chime        | `recovery` cue           |
| `final_slam`    | Final slam impact     | `winning_slam`           |
| `victory`       | Victory fanfare       | Result reveal (win)      |
| `defeat`        | Defeat tone           | Result reveal (loss)     |
| `reward_reveal` | Reward card reveal    | Simulated reward display |

### Autoplay Compliance

- No sound before user interaction
- AudioContext created/resumed only after first user gesture
- Respects browser autoplay restrictions

### Toggles and Persistence

- SFX toggle and music toggle work independently
- Volume settings persist in `localStorage`
- Muted mode has visual equivalents (VFX still fire, no audio)

### Lifecycle Safety

- No duplicate AudioContext
- No leaked oscillators (all stopped and disconnected on destroy)
- Synchronized to timeline events
- `destroy()` is idempotent and safe to call multiple times
- `playCue()` after `destroy()` is a no-op (does not throw)

---

## Cinematic Result Sequences

### Victory Sequence

1. Server-final state syncs → loser Control reaches 0
2. Final slam animation (grip connected, hand reaches pin pad)
3. Impact VFX + audio
4. 300–600ms hold
5. Arena lighting transition
6. VICTORY title (large, animated)
7. Winner victory pose art + loser defeated pose art
8. Simulated reward card ("No monetary value", "Not claimable")
9. Action buttons: Replay, Collection, Return to Arena

### Defeat Sequence

Same structure with DEFEAT title, respectful training feedback, no fake reward.

### Integrity Preservation

- Result display gated on `done && finalSynced`
- Victory requires `opponentFinalControl === 0 && playerFinalControl > 0`
- Defeat requires `playerFinalControl === 0 && opponentFinalControl > 0`
- Visual animation never changes/invents outcome; server result authoritative
- Protected scenarios: normal playback, skip-to-result, refresh completed battle, slow asset loading, reduced motion, duplicate final event, all viewports
- Result stays inside active viewport, no scrolling, primary action immediately visible
