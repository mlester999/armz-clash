# Phase 3.3 Result Integrity

**Status:** IMPLEMENTED

## Problem Statement

The previous implementation could show the result screen before the visual battle reached its final state. Defeat could appear while the player still had 90/100 control. Strength bars could contradict the server result. Skip-to-result could desync from the finalized outcome.

## Solution: Three-Layer Integrity

### Layer 1 — Server Validation (`services/api/src/demo/integrity.ts`)

Every finalized battle must satisfy `validateBattleResultIntegrity`:

- **Victory:** `playerFinalStrength > 0` AND `opponentFinalStrength === 0`
- **Defeat:** `playerFinalStrength === 0` AND `opponentFinalStrength > 0`
- **Timeline:** Must contain a `final_slam` event
- **Final slam:** Must zero out the loser (`opponentStrengthAfter === 0` for victory, `playerStrengthAfter === 0` for defeat)

Failure code: `BATTLE_RESULT_STATE_MISMATCH`

### Layer 2 — Client Final Sync Gate (`BattleStage.tsx`)

The result panel renders only when BOTH conditions are true:

```tsx
{done && finalSynced && ( /* result screen */ )}
```

- `done`: set by `onComplete` callback (renderer finished) or `skipToResult`
- `finalSynced`: set simultaneously with `done`, after syncing final control values from the server payload (`battle.playerFinalStrength`, `battle.opponentFinalStrength`)

This prevents the result from appearing while the animation is still mid-struggle.

### Layer 3 — Skip-to-Result Safety

```typescript
const skipToResult = () => {
  rendererRef.current?.pause();
  setPlayerStr(battle.playerFinalStrength);
  setOpponentStr(battle.opponentFinalStrength);
  setFinalSynced(true);
  setDone(true);
};
```

Skip pauses the renderer, then forces the HUD to the server-authoritative final values. The displayed result always matches the server outcome regardless of where the animation was paused.

## Guarantees

1. Result screen never appears before final control values are synced
2. Displayed control values always match the server payload
3. Winner always matches the final control state (loser = 0)
4. Skip-to-result cannot alter the outcome
5. Refresh recovers the finalized result from the persisted battle record
6. Reduced-motion timeline preserves all integrity guarantees

## Regression Tests

- `validateBattleResultIntegrity` rejects mismatched states
- `validateBattleResultIntegrity` accepts valid victory/defeat
- Missing `final_slam` event fails validation
- Client gate requires both `done` and `finalSynced`
