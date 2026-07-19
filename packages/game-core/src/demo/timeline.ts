/**
 * Battle timeline types and validated cue enums.
 */

export const BATTLE_EVENT_TYPES = [
  'intro',
  'armz_entrance',
  'opponent_entrance',
  'hands_approaching',
  'hands_locked',
  'countdown',
  'struggle',
  'player_push',
  'opponent_push',
  'counter',
  'critical',
  'recovery',
  'fatigue',
  'final_struggle',
  'final_slam',
  'victory',
  'defeat',
  'reward_reveal',
  'complete',
] as const;

export type BattleEventType = (typeof BATTLE_EVENT_TYPES)[number];

export const ANIMATION_CUES = [
  'idle',
  'entrance',
  'approach',
  'grip',
  'strain_light',
  'strain_heavy',
  'push_light',
  'push_heavy',
  'counter',
  'critical',
  'recovery',
  'fatigue',
  'winning_slam',
  'defeated',
  'table_idle',
  'table_shake_light',
  'table_shake_heavy',
  'table_final_impact',
] as const;

export type AnimationCue = (typeof ANIMATION_CUES)[number];

export const SOUND_CUES = [
  'ambience_loop',
  'hands_lock',
  'cloth_move',
  'metal_move',
  'strain',
  'table_creak',
  'impact_light',
  'impact_heavy',
  'critical',
  'recovery',
  'final_slam',
  'victory',
  'defeat',
  'reward_reveal',
  'none',
] as const;

export type SoundCue = (typeof SOUND_CUES)[number];

export const VFX_CUES = [
  'none',
  'dust_light',
  'dust_heavy',
  'grip_spark',
  'critical_flash',
  'energy_trail',
  'final_impact',
  'victory_particles',
  'defeat_particles',
] as const;

export type VfxCue = (typeof VFX_CUES)[number];

export type BattleTimelineEvent = {
  index: number;
  type: BattleEventType;
  startMs: number;
  durationMs: number;
  playerStrengthBefore: number;
  playerStrengthAfter: number;
  opponentStrengthBefore: number;
  opponentStrengthAfter: number;
  intensity: number;
  animationCue: AnimationCue;
  soundCue: SoundCue;
  vfxCue: VfxCue;
  side?: 'player' | 'opponent' | 'both';
};

export type BattleOutcome = 'victory' | 'defeat';

export type SimulatedDemoReward = {
  /** Integer micro-units: 1 Demo $ARMZ = 1_000_000 */
  demoUnits: number;
  label: 'Demo $ARMZ';
  monetaryValue: false;
  claimable: false;
  withdrawable: false;
  transferable: false;
  simulated: true;
};

export type DemoBattleResult = {
  outcome: BattleOutcome;
  playerFinalStrength: number;
  opponentFinalStrength: number;
  durationMs: number;
  timeline: BattleTimelineEvent[];
  criticalEvents: number;
  recoveryEvents: number;
  configurationVersion: string;
  reward: SimulatedDemoReward | null;
};

export const DEMO_ARMZ_MICRO = 1_000_000;
export const STRENGTH_MAX = 100;
