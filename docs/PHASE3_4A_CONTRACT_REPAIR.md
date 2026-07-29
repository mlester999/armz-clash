# Phase 3.4A Premium Battle-Asset Contract Repair

**Engineering status:** implementation complete; quality-gate results are recorded in the final report
**Final premium artwork:** BLOCKED — no owner-generated Phase 3.4A files are present
**Owner visual acceptance:** PENDING OWNER TEST
**Phase 4:** Not started

## Why the contract changed

The Phase 3.4 contract exposed one `battle-side` image for each fighter. Pixi scaled and rotated the
same frozen image between a typed elbow and grip point. That path could preserve contact, but it could
not independently articulate the upper arm, forearm, wrist, or hand. The same implementation also
stretched the arena background, mixed a new table surface with the Phase 3.3B frame, treated every VFX
as a small center particle, and required an unused UI corner asset for owner acceptance.

Phase 3.4A repairs those boundaries before owner image generation begins. It does not add final art.

## Revised source of truth

- Manifest version: `phase3-4a-layered-owner-drop-v1`
- Total declared owner slots: **38**
- Tier A — Flagship Functional Art: **21 required**
- Tier B — Flagship Polished Art: **12 required**
- Tier C — Optional Art: **5 optional**
- Formal Phase 3 art gate: **33 required**
- Current integrated owner art: **0/33 required, 0/38 total**
- Current owner status: `awaiting-tier-a-assets`

The optional five are four rig-polish overlays plus `ui/championship-corner`. Missing Tier C files do
not prevent `ownerAssetStatus: ready` after all Tier A and Tier B files are final.

## Deprecated final slots

- `rookie-brawler/battle-side`
- `practice-automaton/battle-side`
- `arena/table`

They are not required or emitted by the Phase 3.4A owner manifest. The current Phase 3.3B layered rigs
remain the compatibility fallback; the old flat Phase 3.4 final path is not used as the premium path.

## New contract boundaries

### Fighter battle art

Each fighter has four required final layers and two optional polish layers. Premium battle rendering
activates only if all eight required layers for both fighters are final and load successfully. One
fighter can never upgrade alone.

### Arena table

The premium table is an atomic two-file pack:

- `arena/table-surface`
- `arena/table-frame`

Both must be final and load successfully before either replaces the Phase 3.3B table pair. Elbow and
pin pads remain separate Tier B assets.

### Acceptance rules

- Every Tier A/B asset has at least one production call site.
- Tier C is explicitly nonblocking.
- PNG/WebP exclusivity remains enforced per source stem.
- SVG remains unsupported for the owner final drop.
- Missing files always remain `missing-final`; fallback art is never promoted.
- Owner acceptance remains blocked until Tier A and Tier B are complete and personally tested.

## Safety boundary

Demo Mode remains enabled. Minting, real rewards, claims, marketplace, settlement, oracle, mainnet,
and admin economy writes remain disabled. Rewards remain simulated and nontransferable. Staking and
Phase 4 were not added.
