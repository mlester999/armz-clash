import { describe, expect, it } from 'vitest';
import {
  PHASE3_4_BATTLE_POSES,
  PHASE3_4_BATTLE_POSE_IDS,
  PHASE3_4_BATTLE_RIGS,
  PHASE3_4_REQUIRED_RIG_ASSET_IDS,
  interpolatePhase34BattlePose,
  isCompletePremiumRigPair,
  layoutFocalCover,
  quadraticPinArc,
  selectPhase34BattlePoseId,
  validatePhase34RigFrame,
} from './index';

describe('Phase 3.4A layered battle-rig contract', () => {
  it('defines the minimum four-layer contract for both fighters', () => {
    expect(PHASE3_4_REQUIRED_RIG_ASSET_IDS).toHaveLength(8);
    expect(PHASE3_4_REQUIRED_RIG_ASSET_IDS).toEqual(
      expect.arrayContaining([
        'rookie-brawler/battle/upper-arm',
        'rookie-brawler/battle/forearm',
        'rookie-brawler/battle/hand',
        'rookie-brawler/battle/wrap-bracer-overlay',
        'practice-automaton/battle/upper-housing',
        'practice-automaton/battle/forearm-casing',
        'practice-automaton/battle/mechanical-hand',
        'practice-automaton/battle/piston-hose-overlay',
      ]),
    );
  });

  it('connects shoulder to elbow, elbow to wrist, and wrist to grip', () => {
    for (const rig of Object.values(PHASE3_4_BATTLE_RIGS)) {
      const required = rig.layers.filter((layer) => layer.requiredForPremiumPair);
      const upper = required.find((layer) => layer.kind === 'upper-arm')!;
      const forearm = required.find((layer) => layer.kind === 'forearm')!;
      const hand = required.find((layer) => layer.kind === 'hand')!;
      expect(upper.parentJoint).toBeTruthy();
      expect(upper.childJoint).toMatch(/elbow/i);
      expect(forearm.parentJoint).toMatch(/elbow/i);
      expect(forearm.childJoint).toMatch(/wrist/i);
      expect(hand.parentJoint).toMatch(/wrist/i);
      expect(hand.childJoint).toBe('grip');
      expect(Object.values(rig.joints).find((joint) => /elbow/i.test(joint.name))?.planted).toBe(
        true,
      );
    }
  });

  it('keeps all layer geometry finite and constrained', () => {
    for (const rig of Object.values(PHASE3_4_BATTLE_RIGS)) {
      for (const layer of rig.layers) {
        const values = [
          layer.width,
          layer.height,
          layer.anchor.x,
          layer.anchor.y,
          layer.pivot.x,
          layer.pivot.y,
          layer.rotationLimits.min,
          layer.rotationLimits.max,
          layer.scaleLimits.min,
          layer.scaleLimits.max,
        ];
        expect(values.every(Number.isFinite), layer.assetId).toBe(true);
        expect(layer.rotationLimits.min).toBeLessThan(layer.rotationLimits.max);
        expect(layer.scaleLimits.min).toBeGreaterThan(0);
        expect(layer.scaleLimits.min).toBeLessThanOrEqual(layer.scaleLimits.max);
      }
    }
  });

  it('activates only when the complete paired minimum is final', () => {
    const complete: Record<string, 'final' | 'missing-final' | undefined> = Object.fromEntries(
      PHASE3_4_REQUIRED_RIG_ASSET_IDS.map((id) => [id, 'final']),
    );
    expect(isCompletePremiumRigPair(complete)).toBe(true);
    const incomplete: Record<string, 'final' | 'missing-final' | undefined> = {
      ...complete,
      [PHASE3_4_REQUIRED_RIG_ASSET_IDS[0]!]: 'missing-final',
    };
    expect(isCompletePremiumRigPair(incomplete)).toBe(false);
  });
});

describe('Phase 3.4A authored pose manifest', () => {
  it('contains every required authored pose with finite transforms', () => {
    expect(PHASE3_4_BATTLE_POSE_IDS).toHaveLength(22);
    expect(Object.keys(PHASE3_4_BATTLE_POSES)).toHaveLength(22);
    for (const poseId of PHASE3_4_BATTLE_POSE_IDS) {
      const pose = PHASE3_4_BATTLE_POSES[poseId];
      const values = [
        ...Object.values(pose.player).flatMap((value) =>
          typeof value === 'number' ? [value] : [value.x, value.y],
        ),
        ...Object.values(pose.opponent).flatMap((value) =>
          typeof value === 'number' ? [value] : [value.x, value.y],
        ),
        pose.gripTarget.x,
        pose.gripTarget.y,
        pose.tableReaction,
        pose.cameraCue.zoom,
        pose.cameraCue.shake,
        pose.holdTimeMs,
        pose.transitionMs,
      ];
      expect(values.every(Number.isFinite), poseId).toBe(true);
    }
  });

  it('maps directional cues to distinct advantage, counter, and critical poses', () => {
    expect(
      selectPhase34BattlePoseId({
        animationCue: 'push_heavy',
        side: 'player',
        intensity: 7000,
        controlDiff: 0.4,
      }),
    ).toBe('playerStrongAdvantage');
    expect(
      selectPhase34BattlePoseId({
        animationCue: 'push_heavy',
        side: 'opponent',
        intensity: 7000,
        controlDiff: -0.4,
      }),
    ).toBe('opponentStrongAdvantage');
    expect(
      selectPhase34BattlePoseId({
        animationCue: 'counter',
        side: 'player',
        controlDiff: -0.2,
      }),
    ).toBe('playerCounter');
    expect(
      selectPhase34BattlePoseId({
        animationCue: 'critical',
        side: 'opponent',
        controlDiff: -0.3,
      }),
    ).toBe('opponentCritical');
  });

  it('uses truthful pin targets and 300-600 ms final holds', () => {
    expect(PHASE3_4_BATTLE_POSES.playerFinalSlam.gripTarget.mode).toBe('opponent-pin');
    expect(PHASE3_4_BATTLE_POSES.opponentFinalSlam.gripTarget.mode).toBe('player-pin');
    for (const pose of [
      PHASE3_4_BATTLE_POSES.playerFinalSlam,
      PHASE3_4_BATTLE_POSES.opponentFinalSlam,
      PHASE3_4_BATTLE_POSES.playerVictoryHold,
      PHASE3_4_BATTLE_POSES.opponentVictoryHold,
      PHASE3_4_BATTLE_POSES.playerDefeatHold,
      PHASE3_4_BATTLE_POSES.opponentDefeatHold,
    ]) {
      expect(pose.holdTimeMs).toBeGreaterThanOrEqual(300);
      expect(pose.holdTimeMs).toBeLessThanOrEqual(600);
    }
  });

  it('interpolates controlled transforms without changing the target cue', () => {
    const blended = interpolatePhase34BattlePose(
      PHASE3_4_BATTLE_POSES.neutral,
      PHASE3_4_BATTLE_POSES.playerCritical,
      0.5,
    );
    expect(blended.poseId).toBe('playerCritical');
    expect(blended.player.forearmRotation).toBeGreaterThan(0);
    expect(blended.player.forearmRotation).toBeLessThan(
      PHASE3_4_BATTLE_POSES.playerCritical.player.forearmRotation,
    );
  });
});

describe('Phase 3.4A responsive geometry and diagnostics', () => {
  const viewports = [
    [1280, 720],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
    [768, 1024],
    [820, 1180],
    [1024, 1366],
    [360, 800],
    [375, 812],
    [390, 844],
    [393, 852],
    [430, 932],
  ] as const;

  it('uses cover scale without distorting the arena at every required viewport', () => {
    for (const [width, height] of viewports) {
      const layout = layoutFocalCover(
        2560,
        1440,
        width,
        height,
        { x: 0.5, y: 0.42 },
        { x: 0.5, y: height > width ? 0.32 : 0.42 },
      );
      expect(layout.width / layout.height).toBeCloseTo(2560 / 1440, 8);
      expect(layout.width).toBeGreaterThanOrEqual(width);
      expect(layout.height).toBeGreaterThanOrEqual(height);
      expect(layout.x).toBeLessThanOrEqual(0);
      expect(layout.y).toBeLessThanOrEqual(0);
    }
  });

  it('creates a deterministic connected pin arc', () => {
    const start = { x: 500, y: 300 };
    const target = { x: 800, y: 500 };
    expect(quadraticPinArc(start, target, 0, 50)).toEqual(start);
    expect(quadraticPinArc(start, target, 1, 50)).toEqual(target);
    expect(quadraticPinArc(start, target, 0.5, 50).y).toBeLessThan(target.y);
  });

  it('reports shared-grip and planted-elbow errors within tolerance', () => {
    const diagnostics = validatePhase34RigFrame({
      sharedGrip: { x: 500, y: 300 },
      playerGrip: { x: 500.2, y: 300.1 },
      opponentGrip: { x: 499.9, y: 300.1 },
      playerElbow: { x: 300, y: 500 },
      playerExpectedElbow: { x: 300, y: 500 },
      opponentElbow: { x: 700, y: 500 },
      opponentExpectedElbow: { x: 700, y: 500 },
      transformValues: [1, 2, 3, 4],
    });
    expect(diagnostics.valid).toBe(true);
    expect(diagnostics.gripDistanceError).toBeLessThanOrEqual(1);
  });
});
