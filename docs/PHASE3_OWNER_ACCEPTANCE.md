# Phase 3 Owner Acceptance Checklist

Play Demo Mode on `http://127.0.0.1:3001/demo` (API on `:4000`).

## Prerequisites (Phase 3.2)

```bash
pnpm doctor
# Terminal 1
pnpm dev:api
# Terminal 2
pnpm dev:game
```

Recommended env for local owner demo with hosted tables:

```bash
ARMZ_DEMO_PERSISTENCE_MODE=database
```

- [ ] Doctor reports Reown Project ID configured (when set in root `.env`)
- [ ] Doctor reports API reachable and game origin allowed
- [ ] Browser uses `http://127.0.0.1:3001` (not `localhost`)
- [ ] Reown warning is **absent** when Project ID is configured
- [ ] Connect Wallet opens Reown modal (web or game chrome)
- [ ] Demo Mode does **not** show bare `Failed to fetch`
- [ ] Top nav looks like real game tabs (active gold pill, future tabs muted)
- [ ] Buttons feel premium with pointer cursor and hover/press states
- [ ] Six Common ARMZ portraits look distinct (not placeholder boxes)
- [ ] Practice Automaton looks like a real Easy opponent
- [ ] Collection feels collectible (portrait + stat meters, not a form)
- [ ] Battle push/counter/slam and optional recovery feel readable
- [ ] Victory/defeat presentation is satisfying and clearly simulated
- [ ] Desktop / tablet / mobile spacing looks balanced

## Flow

- [ ] Open game without connecting a wallet
- [ ] Select **Play Demo**
- [ ] Read disclosure (no wallet, no chain tx, temporary, simulated, not claimable)
- [ ] Confirm Demo Mode
- [ ] See temporary Common ARMZ reveal
- [ ] Inspect stats in Demo Collection
- [ ] Confirm Easy fight vs Practice Automaton
- [ ] Watch animated battle with strength bars updating multiple times
- [ ] Receive victory or defeat result from server
- [ ] On victory: see Demo $ARMZ labeled simulated / no monetary value / not claimable
- [ ] See battle history for the session
- [ ] Observe replay cooldown
- [ ] Optional: connect wallet — demo rewards do **not** become real balances

## Safety

- [ ] No staking surface
- [ ] No real mint / claim / withdraw language
- [ ] Real-value feature flags remain disabled
- [ ] Mainnet remains disabled
- [ ] Phase 4 systems (real inventory, energy, minting) remain unstarted

## Owner-only

Manual Devnet wallet play and hosted Supabase visual review remain owner-gated.
