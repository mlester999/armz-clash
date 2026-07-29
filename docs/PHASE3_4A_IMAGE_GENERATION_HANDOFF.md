# Phase 3.4A Image-Generation Handoff

**Purpose:** exact owner handoff for externally generated premium images
**Runtime owner art currently integrated:** 0/38
**Required for Phase 3 acceptance:** 33
**Optional:** 5
**Final artwork status:** BLOCKED

## Universal delivery rules

- Generate the listed 2× source canvas.
- Deliver one PNG or WebP per stem, never both. PNG is recommended for every transparent source.
- SVG is unsupported.
- Preserve alpha; do not add text, UI, frames, opaque backdrops, or clipped glow unless the entry is
  the opaque arena background.
- Paths are repo-relative and show the recommended `.png` delivery name. `.webp` is accepted instead.
- Runtime emits WebP and PNG at 1× and 2×. Do not hand-author the runtime variants.
- Tier A and B are required. Tier C is optional and does not block owner acceptance.
- “Paired” means the listed counterpart should be generated/reviewed in the same visual session. The
  eight minimum battle layers and two table files are also atomic at runtime.

## Batch 0 — review-only master references

Create these before isolated runtime art. They are review references, not manifest slots and should
not be placed in the runtime `final/` tree:

1. Rookie Brawler canonical turnaround/material reference.
2. Practice Automaton canonical turnaround/material reference.
3. Arena/table perspective and lighting reference with the locked central grip.

Freeze palette, material, scale, handedness, distinctive marks, and rendering style before Batch 1.

## Locked layered-rig composition guides

Both fighters use a transparent **1800×1600** reference canvas. Coordinates are measured from the
top-left. Isolated layers must be generated from or composited back onto this exact guide. Keep at
least 64 pixels of visual overlap around every connected joint; do not trim a layer to the visible
seam.

### Rookie Brawler guide

| Joint             | Normalized     | Pixels         |
| ----------------- | -------------- | -------------- |
| Shoulder          | `(0.24, 0.86)` | `(432, 1376)`  |
| Elbow/pad contact | `(0.58, 0.68)` | `(1044, 1088)` |
| Wrist             | `(0.75, 0.38)` | `(1350, 608)`  |
| Hand connection   | `(0.79, 0.29)` | `(1422, 464)`  |
| Grip center       | `(0.82, 0.22)` | `(1476, 352)`  |

Reference bounds: upper arm `(150,760,930,790)`; forearm `(840,390,670,820)`; hand
`(1270,170,470,520)`; bracer overlay `(820,380,710,850)`. The neutral assembled scale must fill
these bounds without changing the joint coordinates.

### Practice Automaton guide

| Joint                      | Normalized     | Pixels         |
| -------------------------- | -------------- | -------------- |
| Shoulder mount             | `(0.76, 0.86)` | `(1368, 1376)` |
| Elbow bearing/pad contact  | `(0.42, 0.68)` | `(756, 1088)`  |
| Wrist assembly             | `(0.25, 0.38)` | `(450, 608)`   |
| Mechanical-hand connection | `(0.21, 0.29)` | `(378, 464)`   |
| Grip center                | `(0.18, 0.22)` | `(324, 352)`   |

Reference bounds: upper housing `(720,760,930,790)`; forearm casing `(290,390,670,820)`;
mechanical hand `(60,170,470,520)`; piston/hose overlay `(270,380,710,850)`. It must meet Rookie at
the same shared grip when both guides are composited.

## Batch 1 — Battle Foundation

### 1. `rookie-brawler/battle/upper-arm`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/rookie-brawler/battle/upper-arm.png`; PNG recommended.
- **Dimensions / ratio / alpha:** `800×1200`; `2:3`; transparent.
- **Orientation / camera:** Shoulder at canvas top, elbow at bottom; orthographic side presentation.
- **Crop / margins:** Entire shoulder-to-elbow mass; minimum 8% edge clearance and 64 px joint overlap.
- **Anchor / pivot:** `(0.50,0.12)` / `(0.50,0.12)`; child connection `(0.50,0.88)`.
- **Joint/contact:** `shoulder → elbow`; reference bounds `(150,760,930,790)`.
- **Identity:** Organic tan/copper Rookie anatomy with the approved canonical proportions.
- **Match:** Rookie forearm, hand, hero, and arena perspective.
- **Tier / batch / paired:** Tier A; Batch 1; atomic with all eight required fighter layers.

### 2. `rookie-brawler/battle/forearm`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/rookie-brawler/battle/forearm.png`; PNG.
- **Dimensions / ratio / alpha:** `800×1200`; `2:3`; transparent.
- **Orientation / camera:** Elbow at top, wrist at bottom on a neutral vertical source axis; orthographic.
- **Crop / margins:** Full forearm beneath removable bracer overlay; 64 px overlap at elbow/wrist.
- **Anchor / pivot:** `(0.50,0.12)` / `(0.50,0.12)`; child `(0.50,0.88)`.
- **Joint/contact:** `elbow → wrist`; reference bounds `(840,390,670,820)`.
- **Identity:** Same skin, volume, scars/wear, and light direction as the approved Rookie master.
- **Match:** Upper arm, hand, wrap/bracer overlay.
- **Tier / batch / paired:** Tier A; Batch 1; atomic paired rig.

### 3. `rookie-brawler/battle/hand`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/rookie-brawler/battle/hand.png`; PNG.
- **Dimensions / ratio / alpha:** `720×840`; `6:7`; transparent.
- **Orientation / camera:** Wrist at top, grip/contact at bottom; side/three-quarter hand optimized for arm wrestling.
- **Crop / margins:** Include complete fingers/thumb and 64 px wrist overlap; no contact flash.
- **Anchor / pivot:** `(0.50,0.16)` / `(0.50,0.16)`; grip child `(0.50,0.84)`.
- **Joint/contact:** `wrist → grip`; grip must resolve to Rookie guide `(1476,352)`.
- **Identity:** Same wraps, knuckle scale, skin, and handedness on every Rookie surface.
- **Match:** Automaton mechanical hand at equal contact scale.
- **Tier / batch / paired:** Tier A; Batch 1; must be generated/reviewed with asset 7.

### 4. `rookie-brawler/battle/wrap-bracer-overlay`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/rookie-brawler/battle/wrap-bracer-overlay.png`; PNG.
- **Dimensions / ratio / alpha:** `900×1280`; `45:64`; transparent.
- **Orientation / camera:** Exact forearm overlay; same orthographic camera and source axis as asset 2.
- **Crop / margins:** Only wraps/bracer and their contact shadows; transparent elsewhere; 8% clearance.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Parent `rookie-brawler/battle/forearm`; bounds `(820,380,710,850)`.
- **Identity:** Canonical brown wraps and olive/graphite bracer; do not redesign between poses.
- **Match:** Rookie hero, portrait, versus, and result bracer treatment.
- **Tier / batch / paired:** Tier A; Batch 1; atomic Rookie minimum.

### 5. `practice-automaton/battle/upper-housing`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/practice-automaton/battle/upper-housing.png`; PNG.
- **Dimensions / ratio / alpha:** `900×1200`; `3:4`; transparent.
- **Orientation / camera:** Shoulder mount top, elbow bearing bottom; orthographic side presentation.
- **Crop / margins:** Complete housing with 64 px socket overlap and 8% edge clearance.
- **Anchor / pivot:** `(0.50,0.12)` / `(0.50,0.12)`; child `(0.50,0.88)`.
- **Joint/contact:** `shoulderMount → elbowBearing`; bounds `(720,760,930,790)`.
- **Identity:** Brushed steel/graphite, canonical panel seams, fasteners, wear, and cyan detail.
- **Match:** Automaton casing, hand, hero, and arena perspective.
- **Tier / batch / paired:** Tier A; Batch 1; atomic paired rig.

### 6. `practice-automaton/battle/forearm-casing`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/practice-automaton/battle/forearm-casing.png`; PNG.
- **Dimensions / ratio / alpha:** `900×1200`; `3:4`; transparent.
- **Orientation / camera:** Elbow bearing top, wrist assembly bottom; orthographic.
- **Crop / margins:** Complete casing without hose/piston overlay; 64 px joint overlap.
- **Anchor / pivot:** `(0.50,0.12)` / `(0.50,0.12)`; child `(0.50,0.88)`.
- **Joint/contact:** `elbowBearing → wristAssembly`; bounds `(290,390,670,820)`.
- **Identity:** Identical metal grain, seam pattern, cyan conduits, and wear to the master.
- **Match:** Upper housing, mechanical hand, piston/hose overlay.
- **Tier / batch / paired:** Tier A; Batch 1; atomic paired rig.

### 7. `practice-automaton/battle/mechanical-hand`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/practice-automaton/battle/mechanical-hand.png`; PNG.
- **Dimensions / ratio / alpha:** `760×880`; `19:22`; transparent.
- **Orientation / camera:** Wrist socket top, grip pad/fingers at bottom; side/three-quarter grip view.
- **Crop / margins:** Complete fingers and palm with 64 px wrist overlap; no VFX.
- **Anchor / pivot:** `(0.50,0.16)` / `(0.50,0.16)`; grip child `(0.50,0.84)`.
- **Joint/contact:** `wristAssembly → grip`; grip resolves to Automaton guide `(324,352)`.
- **Identity:** Canonical mechanical digits, cyan pressure surface, brushed housing, consistent fasteners.
- **Match:** Rookie hand at equal contact scale and compatible finger interlock.
- **Tier / batch / paired:** Tier A; Batch 1; must be generated/reviewed with asset 3.

### 8. `practice-automaton/battle/piston-hose-overlay`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/practice-automaton/battle/piston-hose-overlay.png`; PNG.
- **Dimensions / ratio / alpha:** `900×1280`; `45:64`; transparent.
- **Orientation / camera:** Exact casing overlay using asset 6’s camera/source axis.
- **Crop / margins:** Only piston, hose, brackets, and their shadows; transparent elsewhere.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Parent forearm casing; bounds `(270,380,710,850)`; overlap both sockets.
- **Identity:** Hydraulic hardware must remain plausible when the parent forearm rotates.
- **Match:** Upper housing and forearm material/lighting.
- **Tier / batch / paired:** Tier A; Batch 1; atomic Automaton minimum.

### 9. `arena/background`

- **Path / format:** `apps/game/assets/phase3-4/final/arena/background.png`; PNG or WebP.
- **Dimensions / ratio / alpha:** `2560×1440`; `16:9`; opaque.
- **Orientation / camera:** Frontal championship arena, low spectator eye level, centered arm-wrestling stage.
- **Crop / margins:** Focal `(0.50,0.42)`; preserve meaningful architecture in central 60%; sides may crop.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`; responsive focuses desktop `.42`, tablet `.38`, mobile `.32`.
- **Joint/contact:** No fighters/table; central grip and HUD must remain unobstructed.
- **Identity:** Deep navy/graphite venue, restrained crowd, muted gold trim, cyan/warm rim lighting.
- **Match:** Table pack and result atmosphere.
- **Tier / batch / paired:** Tier A; Batch 1; review with assets 10–13.

### 10. `arena/table-surface`

- **Path / format:** `apps/game/assets/phase3-4/final/arena/table-surface.png`; PNG.
- **Dimensions / ratio / alpha:** `2200×760`; `55:19`; transparent.
- **Orientation / camera:** Frontal/low three-quarter tabletop matching the arena reference.
- **Crop / margins:** Complete surface and front lip; 4% alpha clearance; no frame or pads.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`; grip guide `(0.50,0.05)`.
- **Joint/contact:** Center line aligns shared grip; elbow/pin zones align assets 12–13.
- **Identity:** Premium dark table surface with restrained gold/cyan/warm competition markings.
- **Match:** Asset 11 exactly in width, perspective, material, and light.
- **Tier / batch / paired:** Tier A; Batch 1; runtime-atomic with asset 11.

### 11. `arena/table-frame`

- **Path / format:** `apps/game/assets/phase3-4/final/arena/table-frame.png`; PNG.
- **Dimensions / ratio / alpha:** `2200×900`; `22:9`; transparent.
- **Orientation / camera:** Same camera and horizontal scale as table surface; lower support/frame only.
- **Crop / margins:** Complete frame with 4% clearance and overlap beneath surface; no tabletop duplication.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Top edge must composite beneath asset 10 without a visible seam.
- **Identity:** Same metal/wood/composite materials, wear, trim, and lighting as surface.
- **Match:** Asset 10 exactly.
- **Tier / batch / paired:** Tier A; Batch 1; runtime-atomic with asset 10.

### 12. `arena/elbow-pad`

- **Path / format:** `apps/game/assets/phase3-4/final/arena/elbow-pad.png`; PNG.
- **Dimensions / ratio / alpha:** `640×360`; `16:9`; transparent.
- **Orientation / camera:** Top/low-three-quarter pad matching the tabletop perspective; mirror-neutral.
- **Crop / margins:** Complete pad with 8% clearance; contact center unobstructed.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`; elbow contact `(0.50,0.50)`.
- **Joint/contact:** Same source is duplicated under both planted elbows.
- **Identity:** Table-matched padding, stitching, edge wear, and restrained markings.
- **Match:** Table surface/frame and pin pad.
- **Tier / batch / paired:** Tier B; Batch 1; single mirror-neutral source.

### 13. `arena/pin-pad`

- **Path / format:** `apps/game/assets/phase3-4/final/arena/pin-pad.png`; PNG.
- **Dimensions / ratio / alpha:** `480×720`; `2:3`; transparent.
- **Orientation / camera:** Upright pin target matching table perspective; mirror-neutral.
- **Crop / margins:** Complete target and baseline with 8% clearance.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`; bottom aligns table line.
- **Joint/contact:** Final shared grip terminates near target center; same source duplicated both sides.
- **Identity:** Same padding/material language as elbow pad with stronger impact readability.
- **Match:** Assets 10–12 and final-slam VFX.
- **Tier / batch / paired:** Tier B; Batch 1; single mirror-neutral source.

### 14. `effects/final-slam`

- **Path / format:** `apps/game/assets/phase3-4/final/effects/final-slam.png`; PNG.
- **Dimensions / ratio / alpha:** `1024×1024`; `1:1`; transparent.
- **Orientation / camera:** Canonical rightward impact; orthographic VFX.
- **Crop / margins:** Centered at `(512,512)` with at least 12% transparent falloff.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Origin is shared grip; destination is authoritative losing pin pad.
- **Identity:** Largest gold/cyan shockwave with table-impact energy; no opaque disc.
- **Match:** Pin pad, critical effect, arena lighting.
- **Tier / batch / paired:** Tier B; Batch 1; review with table/pin composition.

## Batch 2 — Presentation

### 15. `rookie-brawler/hero`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/rookie-brawler/hero.png`; PNG.
- **Dimensions / ratio / alpha:** `1600×2000`; `4:5`; transparent.
- **Orientation / camera:** Confident neutral three-quarter pose, subtly inward/right, eye-level presentation.
- **Crop / margins:** Full silhouette, bottom-grounded, 8% top/side clearance; phone split-safe.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`; rendered center-bottom.
- **Joint/contact:** Anatomy and bracer proportions must agree with the assembled battle guide.
- **Identity:** Canonical tan/copper Rookie, brown headband/wraps, olive/graphite bracer.
- **Match:** Every Rookie asset; reused landing/reveal/session-ready/collection.
- **Tier / batch / paired:** Tier A; Batch 2; visually pair with asset 20.

### 16. `rookie-brawler/portrait`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/rookie-brawler/portrait.png`; PNG.
- **Dimensions / ratio / alpha:** `1200×1200`; `1:1`; transparent.
- **Orientation / camera:** Front/slight three-quarter identity close-up.
- **Crop / margins:** Important marks in central 65%; 10% clearance for circular/rectangular cover crops.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** No battle contact; retain canonical hand/headband/bracer relationship.
- **Identity:** Same materials, proportions, scuffs, and cyan player rim as master.
- **Match:** Rookie hero and battle rig.
- **Tier / batch / paired:** Tier A; Batch 2; visually pair with asset 21.

### 17. `rookie-brawler/versus`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/rookie-brawler/versus.png`; PNG.
- **Dimensions / ratio / alpha:** `1400×1900`; `14:19`; transparent.
- **Orientation / camera:** Competitive three-quarter/full pose facing right/inward; slightly lower heroic lens.
- **Crop / margins:** Full silhouette; 8% side/top clearance and lower 15% nameplate-safe zone.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`; center-bottom.
- **Joint/contact:** Grip hand and bracer must match the assembled battle-rig handedness.
- **Identity:** Canonical Rookie with stronger pre-fight energy, not a result pose.
- **Match:** Automaton versus at identical baseline, scale, lens, and light.
- **Tier / batch / paired:** Tier A; Batch 2; generate as a pair with asset 22.

### 18. `rookie-brawler/result-victory`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/rookie-brawler/result-victory.png`; PNG.
- **Dimensions / ratio / alpha:** `1400×1900`; `14:19`; transparent.
- **Orientation / camera:** Controlled celebratory full pose; same lens as versus/result opponent.
- **Crop / margins:** Bottom-grounded, 8% edge clearance, lower 12% label-safe.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Show post-match state without table, opponent, or VFX.
- **Identity:** Same Rookie model/materials; clear victory without comic exaggeration.
- **Match:** Automaton defeat and victory result accent.
- **Tier / batch / paired:** Tier A; Batch 2; paired with asset 24.

### 19. `rookie-brawler/result-defeat`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/rookie-brawler/result-defeat.png`; PNG.
- **Dimensions / ratio / alpha:** `1400×1900`; `14:19`; transparent.
- **Orientation / camera:** Respectful exhausted/pinned recovery pose; same result lens.
- **Crop / margins:** Bottom-grounded, 8% clearance, lower label-safe zone.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** No baked red dim, table, opponent, or title.
- **Identity:** Retain all canonical marks and readable silhouette while defeated.
- **Match:** Automaton victory and defeat result accent.
- **Tier / batch / paired:** Tier A; Batch 2; paired with asset 23.

### 20. `practice-automaton/hero`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/practice-automaton/hero.png`; PNG.
- **Dimensions / ratio / alpha:** `1600×2000`; `4:5`; transparent.
- **Orientation / camera:** Stable neutral three-quarter pose inward/left; eye-level.
- **Crop / margins:** Full silhouette, bottom-grounded, 8% clearance; phone split-safe.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Arm/housing proportions must agree with assembled rig guide.
- **Identity:** Brushed steel/graphite shell, cyan eyes/core, antenna, hex mark, canonical wear.
- **Match:** Every Automaton asset and Rookie hero composition.
- **Tier / batch / paired:** Tier A; Batch 2; visually paired with asset 15.

### 21. `practice-automaton/portrait`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/practice-automaton/portrait.png`; PNG.
- **Dimensions / ratio / alpha:** `1200×1200`; `1:1`; transparent.
- **Orientation / camera:** Front/slight three-quarter mechanical identity close-up.
- **Crop / margins:** Eyes, antenna, face housing, and hex/cyan mark in central 65%; 10% clearance.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** No battle contact; preserve canonical face/body geometry.
- **Identity:** Same metal grain, panel seams, fasteners, wear, cyan luminance.
- **Match:** Automaton hero and battle rig.
- **Tier / batch / paired:** Tier A; Batch 2; visually paired with asset 16.

### 22. `practice-automaton/versus`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/practice-automaton/versus.png`; PNG.
- **Dimensions / ratio / alpha:** `1400×1900`; `14:19`; transparent.
- **Orientation / camera:** Competitive full/three-quarter pose facing left/inward.
- **Crop / margins:** Full silhouette, 8% edge clearance, lower 15% nameplate-safe.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`; center-bottom.
- **Joint/contact:** Mechanical grip side and proportions match the battle hand.
- **Identity:** Canonical Automaton with warm opponent rim but unchanged cyan machine identity.
- **Match:** Rookie versus at identical baseline, scale, lens, and light.
- **Tier / batch / paired:** Tier A; Batch 2; generate as a pair with asset 17.

### 23. `practice-automaton/result-victory`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/practice-automaton/result-victory.png`; PNG.
- **Dimensions / ratio / alpha:** `1400×1900`; `14:19`; transparent.
- **Orientation / camera:** Controlled training-machine victory stance; same result lens.
- **Crop / margins:** Bottom-grounded, 8% clearance, lower label-safe zone.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** No table, opponent, baked accent, or UI.
- **Identity:** Same shell/core/panel geometry and wear as canonical master.
- **Match:** Rookie defeat and defeat result accent.
- **Tier / batch / paired:** Tier A; Batch 2; paired with asset 19.

### 24. `practice-automaton/result-defeat`

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/practice-automaton/result-defeat.png`; PNG.
- **Dimensions / ratio / alpha:** `1400×1900`; `14:19`; transparent.
- **Orientation / camera:** Powered-down/pinned but recognizable pose; same result lens.
- **Crop / margins:** Bottom-grounded, 8% clearance, lower label-safe zone.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** No baked dim, title, or arena.
- **Identity:** Preserve shell, antenna, eye/core shapes, seams, and damage marks.
- **Match:** Rookie victory and victory result accent.
- **Tier / batch / paired:** Tier A; Batch 2; paired with asset 18.

## Batch 3 — Final Polish and Optional Layers

### 25. `result/victory-accent`

- **Path / format:** `apps/game/assets/phase3-4/final/result/victory-accent.png`; PNG.
- **Dimensions / ratio / alpha:** `1600×900`; `16:9`; transparent.
- **Orientation / camera:** Screen-space atmosphere, no scene perspective requirement.
- **Crop / margins:** Strongest cyan/gold energy in central 60%; mobile cover-safe; soft outer alpha.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** No fighters, text, reward card, or opaque background.
- **Identity:** Restrained championship sweep readable at 32% opacity.
- **Match:** Rookie victory, Automaton defeat, victory transition VFX.
- **Tier / batch / paired:** Tier B; Batch 3; paired with asset 26.

### 26. `result/defeat-accent`

- **Path / format:** `apps/game/assets/phase3-4/final/result/defeat-accent.png`; PNG.
- **Dimensions / ratio / alpha:** `1600×900`; `16:9`; transparent.
- **Orientation / camera:** Screen-space muted atmosphere.
- **Crop / margins:** Central 60% safe; broad crop-tolerant edge dim; transparent outer falloff.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** No fighter, text, training card, or opaque background.
- **Identity:** Respectful red/orange downward energy, readable at controlled opacity.
- **Match:** Rookie defeat, Automaton victory, defeat transition VFX.
- **Tier / batch / paired:** Tier B; Batch 3; paired with asset 25.

### 27. `effects/grip-lock`

- **Path / format:** `apps/game/assets/phase3-4/final/effects/grip-lock.png`; PNG.
- **Dimensions / ratio / alpha:** `1024×1024`; `1:1`; transparent.
- **Orientation / camera:** Centered radial contact cue; orthographic.
- **Crop / margins:** Motif center `(512,512)`; minimum 12% clean falloff.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Spawns exactly at shared grip.
- **Identity:** Gold/cyan friction flash; bold at 72–128 display pixels.
- **Match:** Both hands and broader VFX line weight.
- **Tier / batch / paired:** Tier B; Batch 3; no paired generation requirement.

### 28. `effects/push-streak`

- **Path / format:** `apps/game/assets/phase3-4/final/effects/push-streak.png`; PNG.
- **Dimensions / ratio / alpha:** `1024×1024`; `1:1`; transparent.
- **Orientation / camera:** Canonical rightward pressure streak; runtime flips/rotates left.
- **Crop / margins:** Centered origin with 12% trail clearance and no hard square edge.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Origin grip; velocity follows current Control momentum.
- **Identity:** Controlled directional energy, not an arrow icon or opaque beam.
- **Match:** Counter and critical VFX.
- **Tier / batch / paired:** Tier B; Batch 3; no paired generation requirement.

### 29. `effects/counter-burst`

- **Path / format:** `apps/game/assets/phase3-4/final/effects/counter-burst.png`; PNG.
- **Dimensions / ratio / alpha:** `1024×1024`; `1:1`; transparent.
- **Orientation / camera:** Canonical rightward reversal arc/ring; runtime reverses previous direction.
- **Crop / margins:** Centered with 12% alpha clearance.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Shared-grip origin; must read differently from ordinary push.
- **Identity:** Opposing arcs or snap-back ring with restrained particles.
- **Match:** Push-streak and critical-impact visual grammar.
- **Tier / batch / paired:** Tier B; Batch 3; no paired requirement.

### 30. `effects/critical-impact`

- **Path / format:** `apps/game/assets/phase3-4/final/effects/critical-impact.png`; PNG.
- **Dimensions / ratio / alpha:** `1024×1024`; `1:1`; transparent.
- **Orientation / camera:** Direction-aware centered shock burst; orthographic.
- **Crop / margins:** 12% falloff; no opaque center disc.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Shared-grip origin; rotates with pressure side.
- **Identity:** Stronger than push/counter, weaker/smaller than final slam.
- **Match:** Final-slam hierarchy and cyan/gold arena energy.
- **Tier / batch / paired:** Tier B; Batch 3; no paired requirement.

### 31. `effects/recovery-cue`

- **Path / format:** `apps/game/assets/phase3-4/final/effects/recovery-cue.png`; PNG.
- **Dimensions / ratio / alpha:** `1024×1024`; `1:1`; transparent.
- **Orientation / camera:** Centered stabilizing ring/converging lines.
- **Crop / margins:** 12% falloff and strong center-safe read.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Shared-grip origin; no destination.
- **Identity:** Controlled form reset, not healing magic—no heart, cross, or potion symbols.
- **Match:** Lower-energy cyan arena lighting.
- **Tier / batch / paired:** Tier B; Batch 3; no paired requirement.

### 32. `effects/victory-sweep`

- **Path / format:** `apps/game/assets/phase3-4/final/effects/victory-sweep.png`; PNG.
- **Dimensions / ratio / alpha:** `1024×1024`; `1:1`; transparent.
- **Orientation / camera:** Centered outcome transition, screen-space.
- **Crop / margins:** Compact rays/shards with 12% falloff; not a full-screen background.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Spawns just above pinned grip before result handoff.
- **Identity:** Cyan/gold celebration readable at 110–220 display pixels.
- **Match:** Victory result accent without duplicating it.
- **Tier / batch / paired:** Tier B; Batch 3; visually paired with asset 33.

### 33. `effects/defeat-dim`

- **Path / format:** `apps/game/assets/phase3-4/final/effects/defeat-dim.png`; PNG.
- **Dimensions / ratio / alpha:** `1024×1024`; `1:1`; transparent.
- **Orientation / camera:** Centered outcome transition, screen-space.
- **Crop / margins:** Compact wisps/downward shards with 12% falloff; not a full-screen overlay.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Spawns above pinned grip before result handoff.
- **Identity:** Muted red/orange energy with respectful restraint.
- **Match:** Defeat result accent and victory transition scale.
- **Tier / batch / paired:** Tier B; Batch 3; visually paired with asset 32.

### 34. `rookie-brawler/battle/contact-shadow` — optional

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/rookie-brawler/battle/contact-shadow.png`; PNG.
- **Dimensions / ratio / alpha:** `1024×512`; `2:1`; transparent.
- **Orientation / camera:** Elbow/table contact shadow matching the Rookie reference.
- **Crop / margins:** Soft alpha only; no table texture; 15% falloff.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Parent upper arm near elbow; bounds `(740,990,720,330)`.
- **Identity:** Neutral dark contact shading, no baked cyan/gold VFX.
- **Match:** Rookie elbow and table lighting.
- **Tier / batch / paired:** Tier C; Batch 3; optional, not runtime-atomic.

### 35. `rookie-brawler/battle/strain-highlight` — optional

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/rookie-brawler/battle/strain-highlight.png`; PNG.
- **Dimensions / ratio / alpha:** `800×1200`; `2:3`; transparent.
- **Orientation / camera:** Exact forearm overlay using asset 2’s source axis.
- **Crop / margins:** Sparse highlights only; 8% clearance; no opaque forearm fill.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Parent Rookie forearm; bounds `(850,400,650,800)`.
- **Identity:** Skin/bracer-compatible strain sheen at low opacity.
- **Match:** Rookie forearm and critical/recovery lighting.
- **Tier / batch / paired:** Tier C; Batch 3; optional.

### 36. `practice-automaton/battle/contact-shadow` — optional

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/practice-automaton/battle/contact-shadow.png`; PNG.
- **Dimensions / ratio / alpha:** `1024×512`; `2:1`; transparent.
- **Orientation / camera:** Elbow-bearing/table contact shadow matching Automaton guide.
- **Crop / margins:** Soft alpha only; no table texture; 15% falloff.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Parent upper housing near elbow; bounds `(340,990,720,330)`.
- **Identity:** Neutral mechanical contact shadow, no VFX.
- **Match:** Automaton elbow bearing and table lighting.
- **Tier / batch / paired:** Tier C; Batch 3; optional.

### 37. `practice-automaton/battle/pressure-highlight` — optional

- **Path / format:** `apps/game/assets/phase3-4/final/fighters/practice-automaton/battle/pressure-highlight.png`; PNG.
- **Dimensions / ratio / alpha:** `900×1200`; `3:4`; transparent.
- **Orientation / camera:** Exact forearm-casing overlay using asset 6’s source axis.
- **Crop / margins:** Sparse cyan/material highlights only; no opaque casing fill.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** Parent casing; bounds `(300,400,650,800)`.
- **Identity:** Canonical cyan pressure light following existing seam layout.
- **Match:** Automaton forearm and critical/recovery lighting.
- **Tier / batch / paired:** Tier C; Batch 3; optional.

### 38. `ui/championship-corner` — optional

- **Path / format:** `apps/game/assets/phase3-4/final/ui/championship-corner.png`; PNG.
- **Dimensions / ratio / alpha:** `1024×1024`; `1:1`; transparent.
- **Orientation / camera:** Mirror-safe screen-space corner flourish.
- **Crop / margins:** 10% edge clearance, mostly transparent center, no text/logo lockup.
- **Anchor / pivot:** `(0.50,0.50)` / `(0.50,0.50)`.
- **Joint/contact:** None; currently no production call site.
- **Identity:** Muted gold geometry with restrained premium cyan detail.
- **Match:** Existing game panels and championship trim.
- **Tier / batch / paired:** Tier C; Batch 3 only if wanted; not required and not paired.

## Delivery checklist

1. Approve Batch 0 references.
2. Composite each Battle Foundation layer back onto its 1800×1600 guide and verify all joint pixels.
3. Overlay both assembled fighters and confirm their grip centers coincide.
4. Confirm table surface/frame composite without any Phase 3.3B dependency.
5. Deliver one source format per exact path.
6. Run `pnpm build:assets:phase34` and `pnpm assets:validate`.
7. Do not classify art as final until owner review approves identity, crop, motion, and all required viewports.
