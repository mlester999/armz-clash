import { describe, expect, it } from 'vitest';
import {
  PHASE3_4_BATTLE_POSES,
  getPremiumAssetSlot,
  type PremiumAssetManifest,
} from '@armz-clash/game-core';
import { canActivatePremiumTablePack } from './battleAssets';
import {
  createDirectionalVfxPlan,
  finalSlamDominatesPush,
  intensityTierFromBasisPoints,
  momentumDirection,
} from './directionalVfx';
import {
  Phase34PoseController,
  authoritativeFinalPoseId,
  phase34SidePoseToRigInput,
} from './phase34PoseRuntime';
import { connectionError, preparePremiumRig, solvePremiumRigFrame } from './premiumRigSolver';

describe('Phase 3.4A controlled pose runtime', () => {
  it('interpolates a target pose and can force the truthful final pose for skip', () => {
    const controller = new Phase34PoseController();
    expect(controller.getTargetId()).toBe('ready');
    controller.setTarget('playerStrongAdvantage', 100);
    const middle = controller.sample(240);
    expect(middle.poseId).toBe('playerStrongAdvantage');
    expect(middle.player.forearmRotation).toBeGreaterThan(0);
    controller.force('opponentFinalSlam', 300);
    expect(controller.getTargetId()).toBe('opponentFinalSlam');
    expect(controller.sample(300).gripTarget.mode).toBe('player-pin');
    expect(authoritativeFinalPoseId('victory')).toBe('playerFinalSlam');
    expect(authoritativeFinalPoseId('defeat')).toBe('opponentFinalSlam');
  });

  it('maps authored shoulder, forearm, wrist, and hand rotations independently', () => {
    const pose = PHASE3_4_BATTLE_POSES.playerCritical;
    const input = phase34SidePoseToRigInput(pose.player, pose);
    expect(input.bones.shoulder?.rot).toBe(pose.player.shoulderRotation);
    expect(input.bones.forearm?.rot).toBe(pose.player.forearmRotation);
    expect(input.bones.wrist?.rot).toBe(pose.player.wristRotation);
    expect(input.bones.hand?.rot).toBe(pose.player.handRotation);
    expect(
      new Set([
        input.bones.shoulder?.rot,
        input.bones.forearm?.rot,
        input.bones.wrist?.rot,
        input.bones.hand?.rot,
      ]).size,
    ).toBeGreaterThan(2);
  });

  it('solves real layer endpoints onto one planted elbow, wrist, and shared grip', async () => {
    const { PHASE3_4_BATTLE_RIGS } = await import('@armz-clash/game-core');
    for (const [fighterId, contract] of Object.entries(PHASE3_4_BATTLE_RIGS)) {
      const sizes = new Map(
        contract.layers.map((layer) => [
          layer.assetId,
          { width: layer.width, height: layer.height },
        ]),
      );
      const prepared = preparePremiumRig(contract, sizes);
      const isOpponent = fighterId === 'practice-automaton';
      const elbow = isOpponent ? { x: 760, y: 590 } : { x: 280, y: 590 };
      const grip = { x: 520, y: 270 };
      const authoredPose = PHASE3_4_BATTLE_POSES.playerCritical;
      const pose = phase34SidePoseToRigInput(
        isOpponent ? authoredPose.opponent : authoredPose.player,
        authoredPose,
      );
      const solved = solvePremiumRigFrame(prepared, {
        elbow,
        grip,
        pose,
        mirror: isOpponent,
      });

      expect(connectionError(solved.joints.elbow, elbow), fighterId).toBeLessThan(0.001);
      expect(connectionError(solved.joints.grip, grip), fighterId).toBeLessThan(0.001);
      expect(Math.max(...Object.values(solved.connectionErrors)), fighterId).toBeLessThan(0.001);
      expect(
        Object.values(solved.transforms)
          .flatMap((transform) => [
            transform.x,
            transform.y,
            transform.rotation,
            transform.scaleX,
            transform.scaleY,
          ])
          .every(Number.isFinite),
        fighterId,
      ).toBe(true);
    }
  });

  it('keeps endpoint lock with mobile half-resolution textures', async () => {
    const { PHASE3_4_BATTLE_RIGS } = await import('@armz-clash/game-core');
    const contract = PHASE3_4_BATTLE_RIGS['rookie-brawler'];
    const sizes = new Map(
      contract.layers.map((layer) => [
        layer.assetId,
        { width: layer.width / 2, height: layer.height / 2 },
      ]),
    );
    const prepared = preparePremiumRig(contract, sizes);
    const authoredPose = PHASE3_4_BATTLE_POSES.playerFinalSlam;
    const elbow = { x: 160, y: 540 };
    const grip = { x: 330, y: 620 };
    const solved = solvePremiumRigFrame(prepared, {
      elbow,
      grip,
      pose: phase34SidePoseToRigInput(authoredPose.player, authoredPose),
      mirror: false,
    });

    expect(connectionError(solved.joints.elbow, elbow)).toBeLessThan(0.001);
    expect(connectionError(solved.joints.grip, grip)).toBeLessThan(0.001);
    expect(Math.max(...Object.values(solved.connectionErrors))).toBeLessThan(0.001);
  });
});

describe('Phase 3.4A directional VFX runtime', () => {
  const push = getPremiumAssetSlot('effects/push-streak')!.vfx!;
  const counter = getPremiumAssetSlot('effects/counter-burst')!.vfx!;
  const finalSlam = getPremiumAssetSlot('effects/final-slam')!.vfx!;

  it('moves player pressure right and opponent pressure left', () => {
    const player = createDirectionalVfxPlan({
      assetId: 'effects/push-streak',
      metadata: push,
      intensityBasisPoints: 5000,
      side: 'player',
      origin: { x: 100, y: 100 },
    });
    const opponent = createDirectionalVfxPlan({
      assetId: 'effects/push-streak',
      metadata: push,
      intensityBasisPoints: 5000,
      side: 'opponent',
      origin: { x: 100, y: 100 },
    });
    expect(player.direction).toBe(1);
    expect(player.velocity.x).toBeGreaterThan(0);
    expect(opponent.direction).toBe(-1);
    expect(opponent.velocity.x).toBeLessThan(0);
    expect(opponent.flipX).toBe(true);
    expect(opponent.rotation).toBe(Math.PI);
  });

  it('counter reverses the previous momentum direction', () => {
    const plan = createDirectionalVfxPlan({
      assetId: 'effects/counter-burst',
      metadata: counter,
      intensityBasisPoints: 7000,
      side: 'player',
      previousDirection: -1,
      origin: { x: 100, y: 100 },
    });
    expect(plan.direction).toBe(1);
    expect(momentumDirection(-0.2, 0.1)).toBe(1);
    expect(momentumDirection(0.2, -0.1)).toBe(-1);
  });

  it('uses ordered intensity tiers and makes final slam dominant', () => {
    expect(intensityTierFromBasisPoints(1000)).toBe('light');
    expect(intensityTierFromBasisPoints(4000)).toBe('medium');
    expect(intensityTierFromBasisPoints(6500)).toBe('heavy');
    expect(intensityTierFromBasisPoints(8500)).toBe('critical');
    expect(intensityTierFromBasisPoints(10000)).toBe('final');
    expect(finalSlamDominatesPush(finalSlam, push)).toBe(true);
  });

  it('keeps effect population bounded by an authored per-spawn count', () => {
    for (const intensity of [1000, 4000, 6500, 8500, 10000]) {
      const plan = createDirectionalVfxPlan({
        assetId: 'effects/final-slam',
        metadata: finalSlam,
        intensityBasisPoints: intensity,
        side: 'player',
        origin: { x: 0, y: 0 },
      });
      expect(plan.count).toBeLessThanOrEqual(2);
      expect(plan.lifetimeSeconds).toBeGreaterThan(0);
    }
  });
});

describe('Phase 3.4A atomic table fallback', () => {
  const manifest = {
    assets: {
      'arena/table-surface': { availability: 'final' },
      'arena/table-frame': { availability: 'final' },
    },
  } as unknown as PremiumAssetManifest;

  it('activates only after both final table textures load', () => {
    expect(
      canActivatePremiumTablePack(manifest, new Set(['arena/table-surface', 'arena/table-frame'])),
    ).toBe(true);
    expect(canActivatePremiumTablePack(manifest, new Set(['arena/table-surface']))).toBe(false);
  });

  it('keeps the whole legacy table pack when either manifest entry is missing', () => {
    const incomplete = {
      assets: {
        'arena/table-surface': { availability: 'final' },
        'arena/table-frame': { availability: 'missing-final' },
      },
    } as unknown as PremiumAssetManifest;
    expect(
      canActivatePremiumTablePack(
        incomplete,
        new Set(['arena/table-surface', 'arena/table-frame']),
      ),
    ).toBe(false);
  });
});
