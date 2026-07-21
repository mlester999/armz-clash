# Phase 3.3A — Result UX: In-Viewport Overlay

**Status:** PENDING OWNER TEST
**Date:** 2026-07-21
**Scope:** Victory/Defeat presentation rebuild

---

## Owner-Reported Issues Addressed

| # | Issue | Resolution |
|---|-------|------------|
| 1 | No strong visible win/loss presentation | Large centered Victory/Defeat overlay with color-coded typography |
| 2 | Player has to scroll to see outcome | Result renders as absolute overlay over the arena canvas — zero scroll required |
| 3 | Result feels like a debug screen | Premium result card with reward summary, final Control snapshot, battle metadata |
| 4 | Defeat feels dead or blank | Respectful defeat copy, clear next actions, polished styling |

---

## Architecture: In-Viewport Result Overlay

### Before (Phase 3.3)
- Result rendered below the battle canvas in the page flow
- Player had to scroll down to see Victory/Defeat
- Result was a separate section, disconnected from the arena

### After (Phase 3.3A)
- Result renders as an **absolute overlay** filling the arena viewport
- `position: absolute; inset: 0; z-index: 20`
- Player sees the result immediately without scrolling
- Arena remains visible behind a semi-transparent backdrop

### Implementation

```tsx
<div className="relative aspect-[16/10] w-full overflow-hidden rounded-..."
     data-testid="demo-battle-canvas-host">
  {/* PixiJS canvas */}
  <div ref={hostRef} className="absolute inset-0" />

  {/* Result overlay fills the arena viewport */}
  {showResult && (
    <div className="absolute inset-0 z-20 flex flex-col overflow-y-auto p-4 sm:p-6
                    bg-[rgba(7,11,18,0.92)] backdrop-blur-sm"
         data-testid="demo-battle-result"
         role="dialog"
         aria-modal="true"
         aria-label={isVictory ? 'Victory result' : 'Defeat result'}>
      {/* Centered result content */}
    </div>
  )}
</div>
```

### No-Scroll Guarantee
- Overlay uses `absolute inset-0` within the `relative` arena container
- Content is centered with `m-auto` inside a flex column
- `overflow-y-auto` handles small viewports gracefully
- The player never needs to scroll below the battle viewport

---

## Result Integrity Protection

### Client Gate
```tsx
const showResult = done && finalSynced;
```
- `done`: battle timeline has completed (or skip was pressed)
- `finalSynced`: final Control values have been applied from server payload
- Overlay cannot appear before both conditions are true

### Victory Condition
- `battle.outcome === 'victory'`
- `battle.opponentFinalStrength === 0` (server-validated)
- `battle.playerFinalStrength > 0`

### Defeat Condition
- `battle.outcome === 'defeat'`
- `battle.playerFinalStrength === 0` (server-validated)
- `battle.opponentFinalStrength > 0`

### Skip-to-Result
- Calls `renderer.pause()` to stop the timeline
- Applies `battle.playerFinalStrength` and `battle.opponentFinalStrength` directly
- Sets `finalSynced = true` and `done = true`
- Same truthful final state as natural completion

### Server Validation
- `services/api/src/demo/integrity.ts` validates final state
- Rejects `BATTLE_RESULT_STATE_MISMATCH` if Control values don't match outcome
- Client cannot override server-authoritative result

---

## Victory Presentation

### Visual
- Large "Victory" heading in cyan (`--armz-cyan`)
- Radial gradient glow (cyan, 18% opacity) behind content
- "Simulated Result" kicker label

### Content
- ARMZ name + "pinned the Practice Automaton in a simulated Easy clash"
- Final Control snapshot: player Control (cyan) vs opponent Control (orange)
- Simulated Reward card (gold accent border):
  - Reward display amount
  - "Simulated only" / "No monetary value" / "Not claimable" / "Not withdrawable"
- Battle metadata: ID, duration, "server-authoritative"

### Actions
- "Replay Easy fight" (disabled during cooldown or battle limit)
- "Demo Collection"
- "Return Home"

---

## Defeat Presentation

### Visual
- Large "Defeat" heading in danger red (`--armz-danger`)
- Radial gradient glow (red, 14% opacity) behind content
- "Simulated Result" kicker label

### Content
- "The Practice Automaton held the line. Train again after the cooldown."
- Final Control snapshot: player Control (cyan) vs opponent Control (orange)
- No reward card (defeat = no reward)
- Battle metadata: ID, duration, "server-authoritative"

### Actions
- Same as Victory: Replay, Collection, Home
- Respectful copy — no punitive language

---

## Accessibility

- `role="dialog"` and `aria-modal="true"` on result overlay
- `aria-label` distinguishes Victory vs Defeat for screen readers
- `aria-live="polite"` on event indicator during battle
- Keyboard focus remains within the overlay
- Color is not the only indicator — text labels always present

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| Desktop (1440x900) | Centered card, full reward details visible |
| Tablet (768x1024) | Centered card, slight padding reduction |
| Mobile (390x844) | Full-width overlay, `overflow-y-auto` for small screens |
| Mobile (360x800) | Compact padding, all actions reachable |

---

## Files Modified

- `apps/game/src/features/demo/components/BattleStage.tsx` — Result overlay rebuild

---

## Validation

- TypeScript: PASSED
- Unit tests (97): PASSED
- E2E desktop/tablet/mobile (72): PASSED
- Result integrity: loser reaches 0 Control before overlay appears
- Skip-to-result: preserves truthful final state
- No scroll required to see result on any viewport
