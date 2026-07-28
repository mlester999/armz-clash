# Phase 3.4 Owner Acceptance

**Status: PENDING OWNER TEST**

This status cannot become passed from automated checks or implementation review alone. The owner must personally test and approve the running flagship slice after the final owner-generated asset pack is integrated.

## Blocking prerequisite

Current generated manifest:

```text
Required final assets: 27
Integrated final assets: 0
Missing final assets: 27
Owner asset status: awaiting-owner-assets
```

Engineering review may proceed on the temporary fallback build, but premium visual acceptance is **BLOCKED** until the files in [PHASE3_4_ASSET_PIPELINE.md](PHASE3_4_ASSET_PIPELINE.md) are supplied and `pnpm build:assets:phase34` reports `27/27 final`.

## Owner test setup

```bash
pnpm install --frozen-lockfile
pnpm build:assets:phase34
pnpm assets:validate
pnpm dev:api
pnpm dev:game
```

Open `http://127.0.0.1:3001/` and follow the complete path through `/demo`.

Before testing, confirm:

- The runtime version manifest reports 27 integrated files.
- No expected surface shows **Temporary art · final asset pending**.
- Demo Mode is true and every real-value feature flag is false.
- No `.env` or secret file is staged.

## Acceptance journey

### 1. Landing and shell

- [ ] The landing immediately reads as a premium arm-wrestling game, not SaaS/Web3 dashboard UI.
- [ ] Rookie Brawler and Practice Automaton dominate the hero and match the approved art direction.
- [ ] Play Demo is the clear primary CTA; Connect Wallet is secondary.
- [ ] Desktop nav is centered and compact with no collision.
- [ ] Tablet/mobile use intentional bottom navigation with no horizontal overflow.
- [ ] Future Marketplace/Claims look intentionally unavailable.
- [ ] Safety copy is concise and never implies real value.

### 2. Reveal

- [ ] Rookie Brawler identity is unmistakable and matches every later surface.
- [ ] Reveal pacing feels polished; reduced motion is immediate and readable.
- [ ] Common, Level 1, stats, temporary state, and continue action are clear.

### 3. Collection

- [ ] Fighter art is large and clean with no crop, halo, or badge collision.
- [ ] Stats scan quickly without a dashboard feeling.
- [ ] Simulated balance and no-value status are unambiguous.
- [ ] Practice Automaton preview and Fight CTA are obvious.
- [ ] Phone CTA stays above bottom navigation and all content remains reachable.

### 4. Versus

- [ ] Both identities match landing/collection/battle/result art.
- [ ] Matchup reads as cinematic and the hands/arms have a coherent battle direction.
- [ ] One Start Battle click begins the fight; there is no redundant confirmation.

### 5. Battle

- [ ] Grip is near center and instantly reads as arm wrestling.
- [ ] Both fighters dominate without clipping at required breakpoints.
- [ ] Elbows, pads, table, and pin area are readable.
- [ ] HUD shows both identities and Control without hiding hand contact.
- [ ] Push, counter, critical, recovery, and final slam cues are distinct but controlled.
- [ ] Total pacing feels near 11 seconds and never feels like the old 20+ second flow.
- [ ] Sound, music, reduced motion, and skip work without duplicate audio or canvas.

### 6. Result

- [ ] Final slam completes before the result appears.
- [ ] VICTORY/DEFEAT is immediately obvious without scrolling.
- [ ] Both final fighter states match the approved character identity.
- [ ] Final Control values match the HUD and one side is exactly zero.
- [ ] Victory reward is explicitly simulated/no-value/not claimable/not withdrawable/not transferable.
- [ ] Defeat shows no fake reward and useful training feedback.
- [ ] Replay, Collection, and Return to Arena remain visible and reachable.
- [ ] Skip and direct refresh restore the same truthful server result.

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

At each size verify no horizontal overflow, no clipped fighter identity, no hidden result action, safe-area spacing, readable Control, and reachable touch targets.

## Owner decision record

Complete only after personal testing:

```text
Build/commit tested:
Asset manifest version:
Integrated final assets: __ / 27
Desktop verdict:
Tablet verdict:
Mobile verdict:
Battle presentation verdict:
Result presentation verdict:
Requested revisions:
Owner name:
Date:
Final status: PENDING OWNER TEST
```

Allowed final classifications are defined in [PHASE3_4_FINAL_REPORT_TEMPLATE.md](PHASE3_4_FINAL_REPORT_TEMPLATE.md). Until the owner changes the decision after testing, the status remains exactly **PENDING OWNER TEST**.

Phase 4 has not started and must remain blocked until this acceptance is recorded.
