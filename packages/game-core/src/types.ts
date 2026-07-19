/** Brand-style identifier for an ARMZ collectible (future DB/on-chain id). */
export type ArmzId = string & { readonly __brand: 'ArmzId' };

export type ArmzRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type ArmzLevel = number;

export type ArmzStatName = 'power' | 'endurance' | 'grip' | 'focus' | 'luck';

export type BattleDifficulty = 'easy' | 'normal' | 'hard';

export type BattleStatus =
  'pending' | 'in_progress' | 'resolved_win' | 'resolved_loss' | 'cancelled' | 'failed';

export type EnergyStatus = 'available' | 'depleted' | 'locked' | 'reset_pending';

/** ISO-8601 UTC timestamp string. */
export type UtcTimestamp = string & { readonly __brand: 'UtcTimestamp' };

export type ConfigurationVersion = string;

export type IdempotencyKey = string & { readonly __brand: 'IdempotencyKey' };

export const ARMZ_RARITIES: readonly ArmzRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
] as const;

export const BATTLE_DIFFICULTIES: readonly BattleDifficulty[] = ['easy', 'normal', 'hard'] as const;
