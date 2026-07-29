# Phase 3.4A Owner Acceptance

**Status: PENDING OWNER TEST**

Engineering review may use the current fallback build. Visual acceptance cannot pass until owner art
is generated, integrated, and personally reviewed.

## Required gate

```text
Tier A required: 21
Tier B required: 12
Required total: 33
Tier C optional: 5
Current required final: 0 / 33
Current optional final: 0 / 5
Owner status: awaiting-tier-a-assets
```

Tier C may remain missing. Every Tier A/B file must be final and visible through its production call
site. Both complete rigs and both table files must activate atomically without mixed fallback art.

## Setup

```bash
pnpm install --frozen-lockfile
pnpm build:assets
pnpm assets:validate
pnpm dev:api
pnpm dev:game
```

Follow `/demo` from landing through reveal, collection, versus, battle, result, replay, and refresh.

## Contract checks

- [ ] Runtime manifest reports 21/21 Tier A and 12/12 Tier B.
- [ ] Missing Tier C art does not block `ownerAssetStatus: ready`.
- [ ] No flat `battle-side` final ID exists.
- [ ] Both layered rigs activate together.
- [ ] Upper arm, forearm, wrist/hand, and overlays move coherently.
- [ ] Grip remains connected and both elbows remain planted.
- [ ] Advantage, counter, critical, recovery, fatigue, and final poses are distinct.
- [ ] Final slam reaches the correct pin and holds before result.
- [ ] Skip applies the same authoritative terminal pin.
- [ ] Arena background crops without distortion.
- [ ] Premium table surface/frame replace both legacy table textures.
- [ ] Directional VFX move toward the correct side and counter reverses direction.

## Required viewport matrix

- [ ] 1280×720
- [ ] 1366×768
- [ ] 1440×900
- [ ] 1920×1080
- [ ] 768×1024
- [ ] 820×1180
- [ ] 1024×1366
- [ ] 360×800
- [ ] 375×812
- [ ] 390×844
- [ ] 393×852
- [ ] 430×932

At every size verify grip contact, planted elbows, undistorted arena, readable table/pads, unclipped
fighter identity, contained result, reachable actions, safe areas, and no horizontal overflow.

## Integrity and safety

- [ ] Victory means opponent Control is exactly zero and player Control is positive.
- [ ] Defeat means player Control is exactly zero and opponent Control is positive.
- [ ] Result still requires `done && finalSynced && integrityValid`.
- [ ] Refresh and skip restore the same server-authoritative outcome.
- [ ] Demo rewards remain simulated, no-value, nonclaimable, nonwithdrawable, and nontransferable.
- [ ] Real-value flags remain false; staking is absent; Phase 4 is unstarted.

## Decision record

```text
Build/commit tested:
Manifest version:
Tier A integrated: __ / 21
Tier B integrated: __ / 12
Tier C integrated: __ / 5
Desktop verdict:
Tablet verdict:
Mobile verdict:
Rig/contact verdict:
Arena/table verdict:
VFX verdict:
Result verdict:
Requested revisions:
Owner name:
Date:
Final status: PENDING OWNER TEST
```
