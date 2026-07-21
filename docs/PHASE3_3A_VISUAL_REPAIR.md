# Phase 3.3A — Visual Repair: Fighter Assets & Arena

**Status:** PENDING OWNER TEST
**Date:** 2026-07-21
**Scope:** Rookie Brawler, Practice Automaton, Battle Arena

---

## Owner-Reported Issues Addressed

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Rookie Brawler looks like a placeholder shape | Rebuilt as layered organic arm: muscle mass, veins under strain, leather wraps, bracer |
| 2 | Practice Automaton too simple and cheap | Rebuilt as segmented mechanical arm: metal plates, hydraulic pistons, rivets, bearing joints |
| 3 | Fighters look like rods/segments/joints in battle | Premium arm drawing with anatomical coherence — shoulder, elbow, forearm, wrist, hand all connected |
| 4 | Collection art and battle art don't feel rich | Unified visual language across collection portraits, versus screen, and battle renderer |
| 5 | Arena composition too empty | Added denser crowd (3 rows), spotlight cones, faction banners, pillar accent lighting |
| 6 | Camera feels too far away | Moved camera closer: tableY = h * 0.72, tableW = min(w * 0.88, 720) |

---

## Asset Changes

### Rookie Brawler (Player ARMZ)
- **Organic arm rendering** with layered muscle definition
- **Veins under strain** — visible during pressure phases
- **Leather wraps** on forearm and wrist
- **Bracer** with accent-color trim
- **Connected anatomy**: shoulder → upper arm → elbow → forearm → wrist → hand
- **Palette-driven**: skinTone, primaryCloth, accent, glove from preset data

### Practice Automaton (Opponent)
- **Segmented metal plates** with industrial finish
- **Hydraulic pistons** visible at elbow and forearm
- **Rivets and bearing joints** at connection points
- **Mechanical wrist** with training grip
- **Distinct silhouette** from player ARMZ
- **Palette**: metallic grays with orange accent lighting

### Arena Atmosphere
- **3-row crowd** silhouettes with varied heights
- **Spotlight cones** from above framing the table
- **Faction banners** (cyan for player, orange for opponent)
- **Pillar accent lighting** at arena edges
- **Ambient haze** particles for depth

---

## Visual System Consistency

| Surface | Treatment |
|---------|-----------|
| Collection portrait | ArmzPortrait / AutomatonPortrait SVG components |
| Versus screen | Same portrait components at larger scale |
| Battle renderer | PixiJS procedural drawing matching portrait identity |
| Result overlay | Portrait thumbnails in HUD panels |

---

## Files Modified

- `apps/game/src/features/demo/renderer/BattleRenderer.ts` — Complete rewrite (30.6KB)
- `apps/game/src/features/demo/components/BattleStage.tsx` — Result overlay rebuild (12.3KB)

---

## Validation

- TypeScript: PASSED
- Unit tests (97): PASSED
- E2E desktop/tablet/mobile (72): PASSED
- No floating hands, no disconnected wrists, no placeholder geometry
