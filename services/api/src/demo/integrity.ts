/**
 * Phase 3.3 Result Integrity Validation (Task 18).
 * Every finalized battle must satisfy:
 * - Victory: playerEndControl > 0, opponentEndControl === 0
 * - Defeat: playerEndControl === 0, opponentEndControl > 0
 * - Final timeline event must be final_slam matching the outcome
 */
import type { DemoBattleResult } from '@armz-clash/game-core';

export type IntegrityCheckResult = {
  valid: boolean;
  code?: string;
  detail?: string;
};

export function validateBattleResultIntegrity(result: DemoBattleResult): IntegrityCheckResult {
  const { outcome, playerFinalStrength, opponentFinalStrength, timeline } = result;

  if (outcome === 'victory') {
    if (opponentFinalStrength !== 0) {
      return {
        valid: false,
        code: 'BATTLE_RESULT_STATE_MISMATCH',
        detail: `victory requires opponentEndControl=0, got ${opponentFinalStrength}`,
      };
    }
    if (playerFinalStrength <= 0) {
      return {
        valid: false,
        code: 'BATTLE_RESULT_STATE_MISMATCH',
        detail: `victory requires playerEndControl>0, got ${playerFinalStrength}`,
      };
    }
  } else if (outcome === 'defeat') {
    if (playerFinalStrength !== 0) {
      return {
        valid: false,
        code: 'BATTLE_RESULT_STATE_MISMATCH',
        detail: `defeat requires playerEndControl=0, got ${playerFinalStrength}`,
      };
    }
    if (opponentFinalStrength <= 0) {
      return {
        valid: false,
        code: 'BATTLE_RESULT_STATE_MISMATCH',
        detail: `defeat requires opponentEndControl>0, got ${opponentFinalStrength}`,
      };
    }
  } else {
    return {
      valid: false,
      code: 'BATTLE_RESULT_STATE_MISMATCH',
      detail: `unknown outcome: ${outcome}`,
    };
  }

  // Final timeline event must include final_slam
  const finalSlam = timeline.find((e) => e.type === 'final_slam');
  if (!finalSlam) {
    return {
      valid: false,
      code: 'BATTLE_RESULT_STATE_MISMATCH',
      detail: 'timeline missing final_slam event',
    };
  }

  // Final slam must zero out the loser
  if (outcome === 'victory' && finalSlam.opponentStrengthAfter !== 0) {
    return {
      valid: false,
      code: 'BATTLE_RESULT_STATE_MISMATCH',
      detail: `final_slam opponentStrengthAfter should be 0 for victory, got ${finalSlam.opponentStrengthAfter}`,
    };
  }
  if (outcome === 'defeat' && finalSlam.playerStrengthAfter !== 0) {
    return {
      valid: false,
      code: 'BATTLE_RESULT_STATE_MISMATCH',
      detail: `final_slam playerStrengthAfter should be 0 for defeat, got ${finalSlam.playerStrengthAfter}`,
    };
  }

  return { valid: true };
}