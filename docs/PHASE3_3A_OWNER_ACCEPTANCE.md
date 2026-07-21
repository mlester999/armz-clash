# Phase 3.3A — Owner Acceptance Checklist

**Status:** PENDING OWNER TEST
**Date:** 2026-07-21
**Phase:** 3.3A — Battle Presentation & Result UX Rebuild

---

## How to Test

1. Start the API: `pnpm dev:api`
2. Start the game: `pnpm dev:game`
3. Open: http://127.0.0.1:3001/demo
4. Play a full demo battle through to the result screen
5. Test on desktop, tablet, and mobile viewports

---

## Fighter Art Quality

- [ ] Rookie Brawler looks like a real collectible ARMZ, not a placeholder rod
- [ ] Rookie Brawler has visible muscle, leather wraps, bracer, connected anatomy
- [ ] Practice Automaton looks like a mechanical training opponent
- [ ] Practice Automaton has segmented plates, hydraulic pistons, rivets, bearing joints
- [ ] Both fighters are visually distinct from each other
- [ ] Arms read as arms (shoulder → elbow → forearm → wrist → hand)
- [ ] No floating hands, no disconnected wrists, no circle joints as primary identity

## Collection Art Quality

- [ ] Collection portraits feel collectible and premium
- [ ] Rookie Brawler portrait matches battle identity
- [ ] Practice Automaton portrait matches battle identity
- [ ] Common rarity styling is clear
- [ ] Temporary/demo status is clearly labeled

## Versus Screen Quality

- [ ] Versus screen feels like a real game step
- [ ] Fighter portraits are large and readable
- [ ] Opponent identity is clear (Easy difficulty, Practice Automaton)
- [ ] Fight CTA is prominent and interactive

## Battle Spectacle

- [ ] Camera is close enough — fighters dominate the frame
- [ ] Arena has atmosphere (crowd, spotlights, banners)
- [ ] Impact flashes are visible on pushes and counters
- [ ] Particle effects reinforce pressure and momentum
- [ ] Final slam feels decisive (flash + burst)
- [ ] Recovery event has a visible green glow cue
- [ ] Effects are premium and readable, not noisy or cheap

## Pacing

- [ ] Battle starts quickly (no long intro)
- [ ] Active struggle begins within ~3 seconds
- [ ] Average battle duration is ~8–12 seconds (measured: ~11.0s)
- [ ] Battle does not drag or feel like the old ~21.5s experience
- [ ] Skip-to-result works and preserves truthful outcome

## Result Visibility

- [ ] Victory/Defeat appears immediately in the active viewport
- [ ] No scrolling required to see the result
- [ ] Result overlay fills the arena viewport
- [ ] Large centered Victory/Defeat heading
- [ ] Final Control values are displayed
- [ ] Battle metadata (ID, duration, server-authoritative) is shown

## Victory Path

- [ ] Victory heading is large and cyan
- [ ] Simulated reward card is displayed with gold accent
- [ ] Reward shows "Simulated only / No monetary value / Not claimable / Not withdrawable"
- [ ] Replay, Collection, and Home actions are visible and functional
- [ ] Victory feels satisfying and premium

## Defeat Path

- [ ] Defeat heading is large and red
- [ ] Respectful copy ("The Practice Automaton held the line")
- [ ] No reward card on defeat
- [ ] Replay, Collection, and Home actions are visible and functional
- [ ] Defeat feels polished, not dead or blank

## Result Integrity

- [ ] Losing fighter visibly reaches 0 Control before result appears
- [ ] Victory only shows when opponent Control = 0
- [ ] Defeat only shows when player Control = 0
- [ ] Skip-to-result preserves the same truthful final state
- [ ] HUD Control bars match the result overlay values
- [ ] No contradictory result (e.g., defeat while player still has Control)

## Mobile / Tablet / Desktop Feel

- [ ] Desktop (1440x900): battle and result look premium, no empty space
- [ ] Tablet (768x1024): fighters remain large, HUD readable
- [ ] Mobile (390x844): result overlay fits, actions reachable, no horizontal overflow
- [ ] Mobile (360x800): compact but usable
- [ ] Buttons have hover/pressed/focus states
- [ ] Cursor is pointer on interactive elements

## Final Sign-Off

- [ ] **Owner approves Phase 3.3A visual quality**
- [ ] **Owner approves battle spectacle**
- [ ] **Owner approves result UX**
- [ ] **Owner approves overall premium feel**

---

## Automated Validation Summary

| Gate | Result |
|------|--------|
| TypeScript (`tsc --noEmit`) | PASSED |
| Unit tests (97 tests, 20 files) | PASSED |
| 1M battle simulation balance gate | PASSED |
| E2E desktop (24 tests) | PASSED |
| E2E tablet (24 tests) | PASSED |
| E2E mobile (24 tests) | PASSED |
| Total E2E | 72 passed |

## Balance Confirmation (1M Simulation)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Overall win rate | 71.99% | 69–75% | PASS |
| Min preset rate | 59.35% | 58–62% | PASS |
| Max preset rate | 84.70% | 82–86% | PASS |
| Recovery per battle | 3.21% | 2–5% | PASS |
| Avg duration | ~11.0s | 8–12s | PASS |

## Safety Confirmation

- ARMZ_DEMO_MODE_ENABLED=true
- All real-value flags: false
- No staking, no Phase 4 tables/UI
- Demo-to-real separation maintained
- Phase 4 NOT started

---

**Owner acceptance: PENDING OWNER TEST**
