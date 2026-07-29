# Phase 3.4A Layered Fighter Rig

**Final owner rig art:** BLOCKED
**Runtime fallback:** Phase 3.3B layered rig

## Activation invariant

The premium path activates only when all four minimum layers for Rookie Brawler and all four minimum
layers for Practice Automaton are final and successfully loaded. Optional overlays are loaded when
available but never block activation. If one required source or runtime texture is absent, both
fighters use the Phase 3.3B layered fallback for that match.

## Rookie Brawler

Required:

1. `rookie-brawler/battle/upper-arm`
2. `rookie-brawler/battle/forearm`
3. `rookie-brawler/battle/hand`
4. `rookie-brawler/battle/wrap-bracer-overlay`

Optional:

5. `rookie-brawler/battle/contact-shadow`
6. `rookie-brawler/battle/strain-highlight`

Named joints are `shoulder`, `elbow`, `wrist`, `hand`, and `grip`.

## Practice Automaton

Required:

1. `practice-automaton/battle/upper-housing`
2. `practice-automaton/battle/forearm-casing`
3. `practice-automaton/battle/mechanical-hand`
4. `practice-automaton/battle/piston-hose-overlay`

Optional:

5. `practice-automaton/battle/contact-shadow`
6. `practice-automaton/battle/pressure-highlight`

Named joints are `shoulderMount`, `elbowBearing`, `wristAssembly`, `mechanicalHand`, and `grip`.

## Typed geometry

Every layer declares source/runtime stem, output size, anchor, pivot, parent/child joints, local and
child connection points, reference-canvas bounds, rotation/scale limits, z-index, mirroring rule,
required/optional state, and fallback behavior. Geometry lives in
`phase34-battle-rig-contract.ts`; the renderer contains no unexplained owner-layer coordinates.

Both rigs use a locked `1800×1600` reference composition. The image-generation handoff contains exact
pixel coordinates and overlap rules.

## Kinematic behavior

- The elbow world positions come from responsive scene geometry and remain planted.
- Both rigs receive the same world-space grip point every frame.
- Upper arm, forearm, wrist, and hand rotations are authored independently.
- The solver constrains each transformed child anchor: upper arm ends at the planted elbow,
  forearm ends at the solved wrist, and hand ends at the shared grip.
- Per-layer rotation and scale values are clamped by contract limits.
- Runtime texture dimensions are density-aware, so `@1x` mobile sources and `@2x` tablet/desktop
  sources resolve to the same world-space joints.
- The piston/hose and wrap/bracer overlays follow their parent forearms.
- Final slam uses one deterministic shared pin arc.

In development, the renderer measures grip separation, elbow drift, and nonfinite transforms. It logs
one warning if tolerance is exceeded. These diagnostics do not create production debug UI.
