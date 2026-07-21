# Phase 3.3 Battle Rig & Pacing

**Status:** IMPLEMENTED — PENDING OWNER TEST

## Objective

Reengineer the arm-wrestling battle so it reads as real arm wrestling: fighters close immediately, grip locks fast, struggle is continuous, and the final slam is decisive. The previous build had arms starting far apart, disconnected hands, and 10-20s of dead time before action.

## Pacing Targets (demo-combat-v3)

| Phase | Target | Implementation |
|-------|--------|----------------|
| Fighters visible | Immediate | Rendered on mount, no long intro |
| Hands approaching | ~0.7s | `TIMING.approach: 700` |
| Grip lock | ~2.2s | `TIMING.gripLock: 600` after approach |
| Active struggle | ~2.8s | First push/counter events |
| Struggle tick | ~0.26s | `TIMING.struggle: 260` |
| Final struggle | ~0.65s | `TIMING.finalStruggle: 650` |
| Final slam | ~0.95s | `TIMING.finalSlam: 950` |
| Total duration | 8-12s (max 14s) | Server timeline length |

## Rig Architecture

### Vertical Arm-Wrestling Layout
- Elbows planted on visible pads (stable anchors)
- Forearms rise to a central grip point
- Grip rotates around a pivot above table center
- `gripAngle`: 0 = neutral, negative = player winning, positive = opponent winning

### Anatomical Connection
- Shoulder → elbow → forearm → wrist → hand chain drawn as connected segments
- Hand position derived from grip angle (no teleporting fists)
- Interlocked hands drawn at grip center
- Strain visualization scales with control differential

### Layer Order
1. Table/arena base
2. Pin pads (where hands get slammed)
3. Player arm (faction-tinted)
4. Opponent arm
5. Grip (interlocked hands, topmost)
6. VFX overlay

## Renderer Callbacks (Preserved API)

```typescript
onComplete: () => void        // battle finished, sync final state
onEvent: (ev) => void         // timeline event for HUD labels
onStrength: (p, o) => void    // live control values for bars
pause(): void                 // stop playback (skip-to-result)
setMuted(m: boolean): void    // audio control
destroy(): void               // cleanup on unmount
```

## PixiJS v8 APIs Used

- `app.init()` (async init, not constructor options)
- `g.rect().fill()` (chained graphics)
- `g.moveTo().lineTo().stroke()` (path drawing)

## Balance Reference (demo-combat-v3, 1M sims)

```json
{
  "configurationVersion": "demo-combat-v3",
  "winRate": 0.719948,
  "minRate": 0.59346,
  "maxRate": 0.84704,
  "avgDurationMs": 10989,
  "recoveryPerBattle": 0.032135
}
```

- Min Common: 59.35% (target 58-62%)
- Max Common: 84.70% (target 82-86%)
- Overall: 71.99% (target 69-75%)
- Recovery: ~3.2% of battles (target 2-5%)

## Reduced Motion

- Timeline compressed by 0.5x scale
- All events still emitted (clarity preserved)
- Result still gated on final sync

## Determinism

- Server-authoritative timeline from seed
- Integer arithmetic for combat power
- Fixed seed → identical timeline
- Winner matches final control values (integrity validated)