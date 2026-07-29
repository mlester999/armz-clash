import type { PremiumAssetPoint, PremiumVfxIntensityTier } from './premium-asset-manifest.types';

export const PHASE3_4_BATTLE_POSE_IDS = [
  'ready',
  'approach',
  'gripLock',
  'neutral',
  'playerLightAdvantage',
  'playerStrongAdvantage',
  'opponentLightAdvantage',
  'opponentStrongAdvantage',
  'playerCounter',
  'opponentCounter',
  'playerCritical',
  'opponentCritical',
  'playerRecovery',
  'opponentRecovery',
  'playerFatigue',
  'opponentFatigue',
  'playerFinalSlam',
  'opponentFinalSlam',
  'playerVictoryHold',
  'opponentVictoryHold',
  'playerDefeatHold',
  'opponentDefeatHold',
] as const;

export type Phase34BattlePoseId = (typeof PHASE3_4_BATTLE_POSE_IDS)[number];
export type Phase34InterpolationCurve = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type Phase34GripTargetMode = 'center' | 'control' | 'player-pin' | 'opponent-pin';

export type Phase34SidePose = {
  shoulderRotation: number;
  upperArmRotation: number;
  elbowOffset: PremiumAssetPoint;
  forearmRotation: number;
  wristRotation: number;
  handRotation: number;
  armScale: number;
};

export type Phase34BattlePose = {
  poseId: Phase34BattlePoseId;
  player: Phase34SidePose;
  opponent: Phase34SidePose;
  gripTarget: PremiumAssetPoint & { mode: Phase34GripTargetMode };
  tableReaction: number;
  cameraCue: { zoom: number; shake: number };
  vfxCue: string | null;
  vfxIntensity: PremiumVfxIntensityTier;
  audioCue: string | null;
  holdTimeMs: number;
  transitionMs: number;
  interpolationCurve: Phase34InterpolationCurve;
};

const neutralSide = (): Phase34SidePose => ({
  shoulderRotation: 0,
  upperArmRotation: 0,
  elbowOffset: { x: 0, y: 0 },
  forearmRotation: 0,
  wristRotation: 0,
  handRotation: 0,
  armScale: 1,
});

function side(patch: Partial<Phase34SidePose>): Phase34SidePose {
  return { ...neutralSide(), ...patch, elbowOffset: patch.elbowOffset ?? { x: 0, y: 0 } };
}

function pose(
  poseId: Phase34BattlePoseId,
  input: Omit<Phase34BattlePose, 'poseId'>,
): Phase34BattlePose {
  return { poseId, ...input };
}

const centered = { mode: 'center', x: 0, y: 0 } as const;
const controlled = { mode: 'control', x: 0, y: 1 } as const;
const playerPin = { mode: 'player-pin', x: -1, y: 1 } as const;
const opponentPin = { mode: 'opponent-pin', x: 1, y: 1 } as const;

export const PHASE3_4_BATTLE_POSES: Record<Phase34BattlePoseId, Phase34BattlePose> = {
  ready: pose('ready', {
    player: side({ handRotation: -0.05 }),
    opponent: side({ handRotation: 0.05 }),
    gripTarget: centered,
    tableReaction: 0,
    cameraCue: { zoom: 1, shake: 0 },
    vfxCue: null,
    vfxIntensity: 'light',
    audioCue: null,
    holdTimeMs: 0,
    transitionMs: 260,
    interpolationCurve: 'ease-out',
  }),
  approach: pose('approach', {
    player: side({ shoulderRotation: 0.04, forearmRotation: 0.08, handRotation: -0.12 }),
    opponent: side({ shoulderRotation: -0.04, forearmRotation: -0.08, handRotation: 0.12 }),
    gripTarget: centered,
    tableReaction: 0.05,
    cameraCue: { zoom: 1, shake: 0 },
    vfxCue: null,
    vfxIntensity: 'light',
    audioCue: 'cloth_move',
    holdTimeMs: 0,
    transitionMs: 360,
    interpolationCurve: 'ease-in-out',
  }),
  gripLock: pose('gripLock', {
    player: side({ forearmRotation: 0.03, wristRotation: 0.08, handRotation: 0.1, armScale: 1.02 }),
    opponent: side({
      forearmRotation: -0.03,
      wristRotation: -0.08,
      handRotation: -0.1,
      armScale: 1.02,
    }),
    gripTarget: centered,
    tableReaction: 0.12,
    cameraCue: { zoom: 1.04, shake: 0.08 },
    vfxCue: 'effects/grip-lock',
    vfxIntensity: 'medium',
    audioCue: 'hands_lock',
    holdTimeMs: 180,
    transitionMs: 180,
    interpolationCurve: 'ease-out',
  }),
  neutral: pose('neutral', {
    player: side({ forearmRotation: 0.02 }),
    opponent: side({ forearmRotation: -0.02 }),
    gripTarget: controlled,
    tableReaction: 0.08,
    cameraCue: { zoom: 1, shake: 0 },
    vfxCue: null,
    vfxIntensity: 'light',
    audioCue: null,
    holdTimeMs: 0,
    transitionMs: 240,
    interpolationCurve: 'ease-in-out',
  }),
  playerLightAdvantage: pose('playerLightAdvantage', {
    player: side({
      upperArmRotation: 0.04,
      forearmRotation: 0.08,
      wristRotation: 0.09,
      handRotation: 0.06,
    }),
    opponent: side({
      shoulderRotation: -0.03,
      forearmRotation: -0.07,
      wristRotation: -0.1,
      handRotation: -0.08,
    }),
    gripTarget: controlled,
    tableReaction: 0.14,
    cameraCue: { zoom: 1.01, shake: 0.08 },
    vfxCue: 'effects/push-streak',
    vfxIntensity: 'light',
    audioCue: 'impact_light',
    holdTimeMs: 0,
    transitionMs: 260,
    interpolationCurve: 'ease-in-out',
  }),
  playerStrongAdvantage: pose('playerStrongAdvantage', {
    player: side({
      shoulderRotation: 0.08,
      upperArmRotation: 0.1,
      forearmRotation: 0.15,
      wristRotation: 0.16,
      handRotation: 0.12,
      armScale: 1.04,
    }),
    opponent: side({
      shoulderRotation: -0.08,
      upperArmRotation: -0.07,
      forearmRotation: -0.14,
      wristRotation: -0.18,
      handRotation: -0.14,
      armScale: 0.99,
    }),
    gripTarget: controlled,
    tableReaction: 0.28,
    cameraCue: { zoom: 1.04, shake: 0.25 },
    vfxCue: 'effects/push-streak',
    vfxIntensity: 'heavy',
    audioCue: 'impact_heavy',
    holdTimeMs: 0,
    transitionMs: 280,
    interpolationCurve: 'ease-in-out',
  }),
  opponentLightAdvantage: pose('opponentLightAdvantage', {
    player: side({
      shoulderRotation: 0.03,
      forearmRotation: 0.07,
      wristRotation: 0.1,
      handRotation: 0.08,
    }),
    opponent: side({
      upperArmRotation: -0.04,
      forearmRotation: -0.08,
      wristRotation: -0.09,
      handRotation: -0.06,
    }),
    gripTarget: controlled,
    tableReaction: 0.14,
    cameraCue: { zoom: 1.01, shake: 0.08 },
    vfxCue: 'effects/push-streak',
    vfxIntensity: 'light',
    audioCue: 'impact_light',
    holdTimeMs: 0,
    transitionMs: 260,
    interpolationCurve: 'ease-in-out',
  }),
  opponentStrongAdvantage: pose('opponentStrongAdvantage', {
    player: side({
      shoulderRotation: 0.08,
      upperArmRotation: 0.07,
      forearmRotation: 0.14,
      wristRotation: 0.18,
      handRotation: 0.14,
      armScale: 0.99,
    }),
    opponent: side({
      shoulderRotation: -0.08,
      upperArmRotation: -0.1,
      forearmRotation: -0.15,
      wristRotation: -0.16,
      handRotation: -0.12,
      armScale: 1.04,
    }),
    gripTarget: controlled,
    tableReaction: 0.28,
    cameraCue: { zoom: 1.04, shake: 0.25 },
    vfxCue: 'effects/push-streak',
    vfxIntensity: 'heavy',
    audioCue: 'impact_heavy',
    holdTimeMs: 0,
    transitionMs: 280,
    interpolationCurve: 'ease-in-out',
  }),
  playerCounter: pose('playerCounter', {
    player: side({
      shoulderRotation: 0.1,
      upperArmRotation: 0.12,
      forearmRotation: 0.18,
      wristRotation: 0.2,
      handRotation: 0.14,
    }),
    opponent: side({
      shoulderRotation: -0.06,
      forearmRotation: -0.14,
      wristRotation: -0.18,
      handRotation: -0.12,
    }),
    gripTarget: controlled,
    tableReaction: 0.32,
    cameraCue: { zoom: 1.05, shake: 0.35 },
    vfxCue: 'effects/counter-burst',
    vfxIntensity: 'heavy',
    audioCue: 'counter',
    holdTimeMs: 110,
    transitionMs: 180,
    interpolationCurve: 'ease-out',
  }),
  opponentCounter: pose('opponentCounter', {
    player: side({
      shoulderRotation: 0.06,
      forearmRotation: 0.14,
      wristRotation: 0.18,
      handRotation: 0.12,
    }),
    opponent: side({
      shoulderRotation: -0.1,
      upperArmRotation: -0.12,
      forearmRotation: -0.18,
      wristRotation: -0.2,
      handRotation: -0.14,
    }),
    gripTarget: controlled,
    tableReaction: 0.32,
    cameraCue: { zoom: 1.05, shake: 0.35 },
    vfxCue: 'effects/counter-burst',
    vfxIntensity: 'heavy',
    audioCue: 'counter',
    holdTimeMs: 110,
    transitionMs: 180,
    interpolationCurve: 'ease-out',
  }),
  playerCritical: pose('playerCritical', {
    player: side({
      shoulderRotation: 0.14,
      upperArmRotation: 0.15,
      forearmRotation: 0.22,
      wristRotation: 0.25,
      handRotation: 0.18,
      armScale: 1.06,
    }),
    opponent: side({
      shoulderRotation: -0.1,
      upperArmRotation: -0.09,
      forearmRotation: -0.2,
      wristRotation: -0.26,
      handRotation: -0.2,
      armScale: 0.98,
    }),
    gripTarget: controlled,
    tableReaction: 0.48,
    cameraCue: { zoom: 1.09, shake: 0.7 },
    vfxCue: 'effects/critical-impact',
    vfxIntensity: 'critical',
    audioCue: 'critical',
    holdTimeMs: 130,
    transitionMs: 160,
    interpolationCurve: 'ease-out',
  }),
  opponentCritical: pose('opponentCritical', {
    player: side({
      shoulderRotation: 0.1,
      upperArmRotation: 0.09,
      forearmRotation: 0.2,
      wristRotation: 0.26,
      handRotation: 0.2,
      armScale: 0.98,
    }),
    opponent: side({
      shoulderRotation: -0.14,
      upperArmRotation: -0.15,
      forearmRotation: -0.22,
      wristRotation: -0.25,
      handRotation: -0.18,
      armScale: 1.06,
    }),
    gripTarget: controlled,
    tableReaction: 0.48,
    cameraCue: { zoom: 1.09, shake: 0.7 },
    vfxCue: 'effects/critical-impact',
    vfxIntensity: 'critical',
    audioCue: 'critical',
    holdTimeMs: 130,
    transitionMs: 160,
    interpolationCurve: 'ease-out',
  }),
  playerRecovery: pose('playerRecovery', {
    player: side({
      shoulderRotation: 0.02,
      upperArmRotation: 0.02,
      forearmRotation: 0.04,
      wristRotation: 0.03,
      handRotation: 0.02,
    }),
    opponent: side({ forearmRotation: -0.03, wristRotation: -0.03 }),
    gripTarget: controlled,
    tableReaction: 0.06,
    cameraCue: { zoom: 1.01, shake: 0 },
    vfxCue: 'effects/recovery-cue',
    vfxIntensity: 'medium',
    audioCue: 'recovery',
    holdTimeMs: 120,
    transitionMs: 320,
    interpolationCurve: 'ease-out',
  }),
  opponentRecovery: pose('opponentRecovery', {
    player: side({ forearmRotation: 0.03, wristRotation: 0.03 }),
    opponent: side({
      shoulderRotation: -0.02,
      upperArmRotation: -0.02,
      forearmRotation: -0.04,
      wristRotation: -0.03,
      handRotation: -0.02,
    }),
    gripTarget: controlled,
    tableReaction: 0.06,
    cameraCue: { zoom: 1.01, shake: 0 },
    vfxCue: 'effects/recovery-cue',
    vfxIntensity: 'medium',
    audioCue: 'recovery',
    holdTimeMs: 120,
    transitionMs: 320,
    interpolationCurve: 'ease-out',
  }),
  playerFatigue: pose('playerFatigue', {
    player: side({
      shoulderRotation: -0.08,
      upperArmRotation: -0.06,
      elbowOffset: { x: 0, y: 2 },
      forearmRotation: -0.08,
      wristRotation: -0.08,
      handRotation: -0.1,
      armScale: 0.98,
    }),
    opponent: side({ forearmRotation: -0.02 }),
    gripTarget: controlled,
    tableReaction: 0.04,
    cameraCue: { zoom: 1, shake: 0 },
    vfxCue: null,
    vfxIntensity: 'light',
    audioCue: 'strain',
    holdTimeMs: 0,
    transitionMs: 360,
    interpolationCurve: 'ease-in-out',
  }),
  opponentFatigue: pose('opponentFatigue', {
    player: side({ forearmRotation: 0.02 }),
    opponent: side({
      shoulderRotation: 0.08,
      upperArmRotation: 0.06,
      elbowOffset: { x: 0, y: 2 },
      forearmRotation: 0.08,
      wristRotation: 0.08,
      handRotation: 0.1,
      armScale: 0.98,
    }),
    gripTarget: controlled,
    tableReaction: 0.04,
    cameraCue: { zoom: 1, shake: 0 },
    vfxCue: null,
    vfxIntensity: 'light',
    audioCue: 'strain',
    holdTimeMs: 0,
    transitionMs: 360,
    interpolationCurve: 'ease-in-out',
  }),
  playerFinalSlam: pose('playerFinalSlam', {
    player: side({
      shoulderRotation: 0.2,
      upperArmRotation: 0.22,
      forearmRotation: 0.3,
      wristRotation: 0.34,
      handRotation: 0.24,
      armScale: 1.08,
    }),
    opponent: side({
      shoulderRotation: -0.16,
      upperArmRotation: -0.14,
      forearmRotation: -0.3,
      wristRotation: -0.38,
      handRotation: -0.28,
      armScale: 0.96,
    }),
    gripTarget: opponentPin,
    tableReaction: 1,
    cameraCue: { zoom: 1.1, shake: 1 },
    vfxCue: 'effects/final-slam',
    vfxIntensity: 'final',
    audioCue: 'final_slam',
    holdTimeMs: 450,
    transitionMs: 520,
    interpolationCurve: 'ease-in',
  }),
  opponentFinalSlam: pose('opponentFinalSlam', {
    player: side({
      shoulderRotation: 0.16,
      upperArmRotation: 0.14,
      forearmRotation: 0.3,
      wristRotation: 0.38,
      handRotation: 0.28,
      armScale: 0.96,
    }),
    opponent: side({
      shoulderRotation: -0.2,
      upperArmRotation: -0.22,
      forearmRotation: -0.3,
      wristRotation: -0.34,
      handRotation: -0.24,
      armScale: 1.08,
    }),
    gripTarget: playerPin,
    tableReaction: 1,
    cameraCue: { zoom: 1.1, shake: 1 },
    vfxCue: 'effects/final-slam',
    vfxIntensity: 'final',
    audioCue: 'final_slam',
    holdTimeMs: 450,
    transitionMs: 520,
    interpolationCurve: 'ease-in',
  }),
  playerVictoryHold: pose('playerVictoryHold', {
    player: side({
      shoulderRotation: 0.16,
      upperArmRotation: 0.18,
      forearmRotation: 0.26,
      wristRotation: 0.28,
      handRotation: 0.22,
      armScale: 1.06,
    }),
    opponent: side({
      shoulderRotation: -0.16,
      upperArmRotation: -0.14,
      forearmRotation: -0.3,
      wristRotation: -0.36,
      handRotation: -0.28,
      armScale: 0.96,
    }),
    gripTarget: opponentPin,
    tableReaction: 0.45,
    cameraCue: { zoom: 1.05, shake: 0 },
    vfxCue: 'effects/victory-sweep',
    vfxIntensity: 'heavy',
    audioCue: 'victory',
    holdTimeMs: 450,
    transitionMs: 220,
    interpolationCurve: 'ease-out',
  }),
  opponentVictoryHold: pose('opponentVictoryHold', {
    player: side({
      shoulderRotation: 0.16,
      upperArmRotation: 0.14,
      forearmRotation: 0.3,
      wristRotation: 0.36,
      handRotation: 0.28,
      armScale: 0.96,
    }),
    opponent: side({
      shoulderRotation: -0.16,
      upperArmRotation: -0.18,
      forearmRotation: -0.26,
      wristRotation: -0.28,
      handRotation: -0.22,
      armScale: 1.06,
    }),
    gripTarget: playerPin,
    tableReaction: 0.45,
    cameraCue: { zoom: 1.05, shake: 0 },
    vfxCue: 'effects/defeat-dim',
    vfxIntensity: 'heavy',
    audioCue: 'defeat',
    holdTimeMs: 450,
    transitionMs: 220,
    interpolationCurve: 'ease-out',
  }),
  playerDefeatHold: pose('playerDefeatHold', {
    player: side({
      shoulderRotation: 0.18,
      upperArmRotation: 0.16,
      forearmRotation: 0.32,
      wristRotation: 0.4,
      handRotation: 0.3,
      armScale: 0.95,
    }),
    opponent: side({
      shoulderRotation: -0.14,
      upperArmRotation: -0.17,
      forearmRotation: -0.25,
      wristRotation: -0.27,
      handRotation: -0.2,
      armScale: 1.05,
    }),
    gripTarget: playerPin,
    tableReaction: 0.2,
    cameraCue: { zoom: 1.02, shake: 0 },
    vfxCue: 'effects/defeat-dim',
    vfxIntensity: 'medium',
    audioCue: null,
    holdTimeMs: 450,
    transitionMs: 240,
    interpolationCurve: 'ease-out',
  }),
  opponentDefeatHold: pose('opponentDefeatHold', {
    player: side({
      shoulderRotation: 0.14,
      upperArmRotation: 0.17,
      forearmRotation: 0.25,
      wristRotation: 0.27,
      handRotation: 0.2,
      armScale: 1.05,
    }),
    opponent: side({
      shoulderRotation: -0.18,
      upperArmRotation: -0.16,
      forearmRotation: -0.32,
      wristRotation: -0.4,
      handRotation: -0.3,
      armScale: 0.95,
    }),
    gripTarget: opponentPin,
    tableReaction: 0.2,
    cameraCue: { zoom: 1.02, shake: 0 },
    vfxCue: 'effects/victory-sweep',
    vfxIntensity: 'medium',
    audioCue: null,
    holdTimeMs: 450,
    transitionMs: 240,
    interpolationCurve: 'ease-out',
  }),
};

export type Phase34PoseSelectionInput = {
  animationCue: string;
  eventType?: string;
  side?: string;
  intensity?: number;
  controlDiff: number;
  latchedOutcome?: 'victory' | 'defeat' | null;
};

export function selectPhase34BattlePoseId(input: Phase34PoseSelectionInput): Phase34BattlePoseId {
  const { animationCue, eventType, side: actingSide, intensity = 0, controlDiff } = input;
  if (eventType === 'victory') return 'playerVictoryHold';
  if (eventType === 'defeat') return 'opponentVictoryHold';
  if (input.latchedOutcome && (eventType === 'reward_reveal' || eventType === 'complete')) {
    return input.latchedOutcome === 'victory' ? 'opponentDefeatHold' : 'playerDefeatHold';
  }
  if (animationCue === 'entrance' || animationCue === 'approach') return 'approach';
  if (animationCue === 'grip') return 'gripLock';
  if (animationCue === 'winning_slam') return 'playerFinalSlam';
  if (animationCue === 'defeated') return 'opponentFinalSlam';
  if (animationCue === 'counter') {
    return actingSide === 'opponent' ? 'opponentCounter' : 'playerCounter';
  }
  if (animationCue === 'critical') {
    return actingSide === 'opponent' ? 'opponentCritical' : 'playerCritical';
  }
  if (animationCue === 'recovery') {
    return actingSide === 'opponent' ? 'opponentRecovery' : 'playerRecovery';
  }
  if (animationCue === 'fatigue') {
    return controlDiff >= 0 ? 'opponentFatigue' : 'playerFatigue';
  }
  if (
    animationCue === 'push_light' ||
    animationCue === 'push_heavy' ||
    animationCue === 'strain_light' ||
    animationCue === 'strain_heavy'
  ) {
    const playerPressure = actingSide === 'player' || (actingSide === 'both' && controlDiff >= 0);
    const strong =
      intensity >= 6500 || Math.abs(controlDiff) >= 0.34 || animationCue.endsWith('heavy');
    if (playerPressure) return strong ? 'playerStrongAdvantage' : 'playerLightAdvantage';
    return strong ? 'opponentStrongAdvantage' : 'opponentLightAdvantage';
  }
  if (animationCue === 'idle' && input.latchedOutcome) {
    return input.latchedOutcome === 'victory' ? 'playerVictoryHold' : 'opponentVictoryHold';
  }
  if (animationCue === 'idle') return 'ready';
  return 'neutral';
}

function curveValue(curve: Phase34InterpolationCurve, raw: number): number {
  const t = Math.max(0, Math.min(1, raw));
  if (curve === 'linear') return t;
  if (curve === 'ease-in') return t * t;
  if (curve === 'ease-out') return 1 - (1 - t) * (1 - t);
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateSide(a: Phase34SidePose, b: Phase34SidePose, t: number): Phase34SidePose {
  return {
    shoulderRotation: lerp(a.shoulderRotation, b.shoulderRotation, t),
    upperArmRotation: lerp(a.upperArmRotation, b.upperArmRotation, t),
    elbowOffset: {
      x: lerp(a.elbowOffset.x, b.elbowOffset.x, t),
      y: lerp(a.elbowOffset.y, b.elbowOffset.y, t),
    },
    forearmRotation: lerp(a.forearmRotation, b.forearmRotation, t),
    wristRotation: lerp(a.wristRotation, b.wristRotation, t),
    handRotation: lerp(a.handRotation, b.handRotation, t),
    armScale: lerp(a.armScale, b.armScale, t),
  };
}

export function interpolatePhase34BattlePose(
  from: Phase34BattlePose,
  to: Phase34BattlePose,
  progress: number,
): Phase34BattlePose {
  const t = curveValue(to.interpolationCurve, progress);
  return {
    ...to,
    player: interpolateSide(from.player, to.player, t),
    opponent: interpolateSide(from.opponent, to.opponent, t),
    gripTarget: {
      mode: to.gripTarget.mode,
      x: lerp(from.gripTarget.x, to.gripTarget.x, t),
      y: lerp(from.gripTarget.y, to.gripTarget.y, t),
    },
    tableReaction: lerp(from.tableReaction, to.tableReaction, t),
    cameraCue: {
      zoom: lerp(from.cameraCue.zoom, to.cameraCue.zoom, t),
      shake: lerp(from.cameraCue.shake, to.cameraCue.shake, t),
    },
  };
}
