import {
  PHASE3_4_BATTLE_POSES,
  interpolatePhase34BattlePose,
  type Phase34BattlePose,
  type Phase34BattlePoseId,
  type Phase34SidePose,
} from '@armz-clash/game-core';
import type { PoseInput } from './rigSolver';

function glowForPose(pose: Phase34BattlePose): number {
  if (pose.vfxIntensity === 'final') return 0.8;
  if (pose.vfxIntensity === 'critical') return 0.65;
  if (pose.vfxIntensity === 'heavy') return 0.42;
  if (pose.vfxIntensity === 'medium') return 0.24;
  return 0.08;
}

export function phase34SidePoseToRigInput(
  sidePose: Phase34SidePose,
  authoredPose: Phase34BattlePose,
): PoseInput {
  return {
    lean: sidePose.shoulderRotation,
    shoulderSettle: sidePose.elbowOffset.y,
    elbowFlare: sidePose.elbowOffset.x,
    bones: {
      shoulder: { rot: sidePose.shoulderRotation, scale: sidePose.armScale },
      upperArm: { rot: sidePose.upperArmRotation, scale: sidePose.armScale },
      elbow: { dx: sidePose.elbowOffset.x, dy: sidePose.elbowOffset.y },
      forearm: { rot: sidePose.forearmRotation, scale: sidePose.armScale },
      wrist: { rot: sidePose.wristRotation, scale: sidePose.armScale },
      hand: { rot: sidePose.handRotation, scale: sidePose.armScale },
    },
    layers: {
      wraps: true,
      bracer: true,
      fingers: true,
      thumb: true,
      highlights: authoredPose.vfxIntensity !== 'light',
      shadows: true,
      strain:
        authoredPose.vfxIntensity === 'heavy' ||
        authoredPose.vfxIntensity === 'critical' ||
        authoredPose.vfxIntensity === 'final',
    },
    material: {
      deformation: authoredPose.tableReaction,
      glow: glowForPose(authoredPose),
    },
  };
}

export function authoritativeFinalPoseId(
  outcome: 'victory' | 'defeat',
): 'playerFinalSlam' | 'opponentFinalSlam' {
  return outcome === 'victory' ? 'playerFinalSlam' : 'opponentFinalSlam';
}

export class Phase34PoseController {
  private from: Phase34BattlePose = PHASE3_4_BATTLE_POSES.ready;
  private target: Phase34BattlePose = PHASE3_4_BATTLE_POSES.ready;
  private targetId: Phase34BattlePoseId = 'ready';
  private transitionStartedAt = 0;

  setTarget(poseId: Phase34BattlePoseId, nowMs: number): boolean {
    if (poseId === this.targetId) return false;
    this.from = this.sample(nowMs);
    this.target = PHASE3_4_BATTLE_POSES[poseId];
    this.targetId = poseId;
    this.transitionStartedAt = nowMs;
    return true;
  }

  force(poseId: Phase34BattlePoseId, nowMs: number): void {
    this.from = PHASE3_4_BATTLE_POSES[poseId];
    this.target = PHASE3_4_BATTLE_POSES[poseId];
    this.targetId = poseId;
    this.transitionStartedAt = nowMs;
  }

  sample(nowMs: number): Phase34BattlePose {
    const duration = Math.max(1, this.target.transitionMs);
    const progress = Math.max(0, Math.min(1, (nowMs - this.transitionStartedAt) / duration));
    return interpolatePhase34BattlePose(this.from, this.target, progress);
  }

  getTargetId(): Phase34BattlePoseId {
    return this.targetId;
  }
}
