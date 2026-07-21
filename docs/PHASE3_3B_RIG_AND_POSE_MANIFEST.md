# Phase 3.3B — Rig and Pose Manifest

**Status:** PENDING OWNER TEST
**Date:** 2026-07-21

---

## Rig Architecture

### SpriteRig (`apps/game/src/features/demo/renderer/SpriteRig.ts`)

Replaces visible PixiJS Graphics fighter anatomy with textured `Sprite` layers loaded from the generated asset atlas. PixiJS Graphics are retained ONLY for: particles, lighting cones, haze, impact rings, debug geometry, control bars, and loading indicators.

**Layer order per fighter** (by authored `z` value):

```
shadows → shoulder → upper-arm → elbow → forearm → bracer/wraps →
wrist → hand → fingers/thumb/grip-pad → highlights
```

### FK Solver (`apps/game/src/features/demo/renderer/rigSolver.ts`)

Pure forward-kinematics solver. Each bone sprite has its proximal joint near the top; sprite local `+y` points proximal → distal.

**Rotation formula:**

```ts
axisAngle = atan2(axis.y, axis.x) - PI / 2;
```

**Invariants enforced:**

- Stable elbow position
- Stable grip position (shared grip contract)
- Stable shoulder relationship
- Stable hand contact
- Readable pin arc

### Shared Grip Contract

Player and opponent grip anchors resolve to the same world coordinate in all connected poses. The grip point is computed by `computeGripPoint(center, diff, tableW, dip)` and passed to both rigs.

---

## Pose System

### Authored Poses (22 total)

Both fighters share the same pose ID set:

| Pose ID                   | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `ready`                   | Neutral stance before approach                 |
| `approach`                | Moving toward table                            |
| `grip`                    | Hands locking                                  |
| `neutral`                 | Connected, no advantage                        |
| `lightAdvantagePlayer`    | Player slight lead                             |
| `strongAdvantagePlayer`   | Player dominant                                |
| `lightAdvantageOpponent`  | Opponent slight lead                           |
| `strongAdvantageOpponent` | Opponent dominant                              |
| `counterPlayer`           | Player counter move                            |
| `counterOpponent`         | Opponent counter move                          |
| `criticalPlayer`          | Player critical push                           |
| `criticalOpponent`        | Opponent critical push                         |
| `recoveryPlayer`          | Player recovery                                |
| `recoveryOpponent`        | Opponent recovery                              |
| `fatiguePlayer`           | Player fatigue (Rookie) / overheat (Automaton) |
| `fatigueOpponent`         | Opponent fatigue / overheat                    |
| `finalSlamPlayer`         | Player winning slam                            |
| `finalSlamOpponent`       | Opponent winning slam                          |
| `victoryPlayer`           | Player victory pose                            |
| `victoryOpponent`         | Opponent victory pose                          |
| `defeatPlayer`            | Player defeat pose                             |
| `defeatOpponent`          | Opponent defeat pose                           |

### Pose Resolution (`battleAssets.ts`)

Server animation cues are mapped to authored poses via `resolvePose()`:

| Server Cue                      | Pose Selection Logic                                         |
| ------------------------------- | ------------------------------------------------------------ |
| `idle`                          | `ready`                                                      |
| `approach`                      | `approach`                                                   |
| `grip`                          | `grip`                                                       |
| `strain_light` / `strain_heavy` | Dynamic: light/strong advantage based on `diff`              |
| `push_light` / `push_heavy`     | Dynamic: light/strong advantage based on `diff`              |
| `critical`                      | `criticalPlayer` or `criticalOpponent` based on leading side |
| `counter`                       | `counterPlayer` or `counterOpponent` based on acting side    |
| `recovery`                      | `recoveryPlayer` or `recoveryOpponent`                       |
| `fatigue`                       | `fatiguePlayer` or `fatigueOpponent`                         |
| `winning_slam`                  | `finalSlamPlayer` or `finalSlamOpponent`                     |
| `defeated`                      | Inverse of winning slam                                      |

### Pose Blending

Runtime interpolation between authored poses uses `smoothstep` easing. No random rotations or arbitrary physics. Blending is driven by timeline `animationCue` + Control differential.

---

## Rig Manifest Shape

```json
{
  "version": "phase3-3b-v1",
  "fighters": {
    "rookie-brawler": [ { "assetId": "...", "kind": "...", "anchor": {...}, "axisT": 0, "z": 10 }, ... ],
    "practice-automaton": [ ... ]
  }
}
```

Access pattern: `rigManifest.fighters[fighterId]` (Record, not array).

---

## Texture Preloading

Before battle countdown begins, `preloadBattleAssets()` loads all required textures via PixiJS `Assets.load`. A branded loading indicator is shown if textures are not yet cached. The timeline does not begin until textures are ready.

---

## Camera System

Responsive presets:

| Viewport          | Classification | Behavior                                  |
| ----------------- | -------------- | ----------------------------------------- |
| Desktop landscape | `desktop`      | Standard framing, fighters dominate scene |
| Tablet portrait   | `tablet`       | Slightly zoomed, grip-centered            |
| Mobile portrait   | `mobile`       | Tight framing on grip/hands               |

Dynamic cues: slight zoom on critical push, shake on slam, pull-back for result.

---

## Fighter Identity Mapping

```ts
fighterIdForPreset('rookie_brawler')   → 'rookie-brawler'
fighterIdForOpponent('practice_automaton') → 'practice-automaton'
// All other presets/opponents → null (procedural fallback)
```
