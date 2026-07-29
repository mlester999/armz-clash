# Phase 3.4A Asset Pipeline

**Manifest version:** `phase3-4a-layered-owner-drop-v1`
**Tier A required:** 21
**Tier B required:** 12
**Tier C optional:** 5
**Formal required total:** 33
**Declared slots:** 38
**Integrated final:** 0
**Owner status:** `awaiting-tier-a-assets`
**Final artwork:** BLOCKED

Phase 3.4A supersedes the flawed 27-slot flat battle contract. The engineering path is ready for
layered owner-generated PNG/WebP art, but no owner art is present. Current gameplay uses declared
Phase 3.3B fallbacks and labels the battle rig temporary.

## Source and output

Provide exactly one source format per stem:

```text
apps/game/assets/phase3-4/final/<source-stem>.png
# or
apps/game/assets/phase3-4/final/<source-stem>.webp
```

Supplying both formats is an error. SVG is unsupported. The builder emits:

```text
apps/game/public/assets/game/phase3-4/final/<runtime-stem>@1x.webp
apps/game/public/assets/game/phase3-4/final/<runtime-stem>@2x.webp
apps/game/public/assets/game/phase3-4/final/<runtime-stem>@1x.png
apps/game/public/assets/game/phase3-4/final/<runtime-stem>@2x.png
```

It also emits asset, version, battle-rig, and battle-pose manifests under
`apps/game/public/assets/game/phase3-4/manifests/`.

## Revised slot inventory

| Tier | Asset IDs                                                      | Count |
| ---- | -------------------------------------------------------------- | ----: |
| A    | Ten fighter presentation assets                                |    10 |
| A    | Four required Rookie layers + four required Automaton layers   |     8 |
| A    | `arena/background`, `arena/table-surface`, `arena/table-frame` |     3 |
| B    | `arena/elbow-pad`, `arena/pin-pad`                             |     2 |
| B    | Eight production battle VFX                                    |     8 |
| B    | `result/victory-accent`, `result/defeat-accent`                |     2 |
| C    | Four optional fighter rig polish overlays                      |     4 |
| C    | `ui/championship-corner`                                       |     1 |

Tier A = 21, Tier B = 12, Tier C = 5, total = 38. Formal acceptance requires A+B = 33.

Exact paths, sizes, ratios, alpha, crops, anchors, joint coordinates, matching rules, batches, and
pairing requirements are in [PHASE3_4A_IMAGE_GENERATION_HANDOFF.md](PHASE3_4A_IMAGE_GENERATION_HANDOFF.md).

## Deprecated owner-final IDs

- `rookie-brawler/battle-side`
- `practice-automaton/battle-side`
- `arena/table`

The flat fighter slots are not accepted as final premium battle art. The single table slot is replaced
by an atomic surface/frame pair.

## Atomic activation

Premium fighter rendering requires all eight minimum final rig layers and successful texture loads.
Otherwise both fighters use Phase 3.3B layered fallback art. Optional rig overlays are loaded only when
present. Premium table rendering requires both `table-surface` and `table-frame`; otherwise both
legacy table textures remain.

## Acceptance tiers

- Tier A is the first meaningful functional-art review gate.
- Tier B is required for final Phase 3 visual acceptance.
- Tier C is optional and cannot block `ownerAssetStatus: ready`.
- Every A/B asset has a production call site.
- Missing final files remain `missing-final`; fallbacks never become final silently.

## Commands

```bash
pnpm build:assets:phase34
pnpm assets:validate
```

Current expected output:

```text
Phase 3.4A assets: 0/33 required final; 0/21 Tier A; 0/38 total slots integrated.
```

Owner acceptance remains **PENDING OWNER TEST**. Phase 4 remains blocked.
