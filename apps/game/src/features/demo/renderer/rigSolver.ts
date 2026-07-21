/**
 * Phase 3.3B â€” pure forward-kinematics solver for the sprite rigs.
 *
 * No PixiJS dependency so the math can be unit-tested in a node environment.
 * The SpriteRig renderer applies the transforms produced here to PixiJS Sprites.
 *
 * FK model (see scripts/game-asset-config.ts for the authored convention):
 *  - Both fighters share ONE grip point (the grip-anchor contract). The control
 *    differential moves this point left/right toward a pin pad.
 *  - Each fighter's arm axis runs from its elbow (fixed on the elbow pad) to the
 *    shared grip point. Joint world positions are placed along this axis by the
 *    authored `axisT` fractions.
 *  - Authored poses add expressive lean / elbow flare / per-bone bends and toggle
 *    detail layers, but never move the shared grip point, so the hands stay
 *    connected through every pose and the final slam.
 */

export type Vec2 = { x: number; y: number };

export type RigPartInput = {
  assetId: string;
  kind: 'shoulder' | 'upperArm' | 'elbow' | 'forearm' | 'wrist' | 'hand' | 'overlay';
  anchor: Vec2;
  axisT?: number;
  parent?: string;
  offset?: Vec2;
  overlayScale?: number;
  z: number;
};

export type BonePoseInput = { rot?: number; dx?: number; dy?: number; scale?: number };

export type PoseInput = {
  lean: number;
  shoulderSettle: number;
  elbowFlare: number;
  bones: {
    shoulder?: BonePoseInput;
    upperArm?: BonePoseInput;
    elbow?: BonePoseInput;
    forearm?: BonePoseInput;
    wrist?: BonePoseInput;
    hand?: BonePoseInput;
  };
  layers: {
    wraps?: boolean;
    bracer?: boolean;
    fingers?: boolean;
    thumb?: boolean;
    highlights?: boolean;
    shadows?: boolean;
    strain?: boolean;
  };
  material: { deformation: number; glow: number };
};

export type FkInput = {
  elbow: Vec2;
  grip: Vec2;
  pose: PoseInput;
  /** Opponent arms mirror their lateral detail. */
  mirror: boolean;
};

export type BoneTransform = {
  assetId: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  z: number;
  /** 0..1 glow used by the renderer to tint highlights / strain detail. */
  glow: number;
  strain: boolean;
};

export type RigSolution = {
  transforms: Record<string, BoneTransform>;
  axisAngle: number;
  axisLength: number;
  grip: Vec2;
};

/** Smoothstep easing used for authored-pose interpolation. */
export function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpBone(
  a: BonePoseInput | undefined,
  b: BonePoseInput | undefined,
  t: number,
): BonePoseInput {
  return {
    rot: lerp(a?.rot ?? 0, b?.rot ?? 0, t),
    dx: lerp(a?.dx ?? 0, b?.dx ?? 0, t),
    dy: lerp(a?.dy ?? 0, b?.dy ?? 0, t),
    scale: lerp(a?.scale ?? 1, b?.scale ?? 1, t),
  };
}

/** Blend two authored poses with smoothstep easing (pure). */
export function blendPoses(a: PoseInput, b: PoseInput, tRaw: number): PoseInput {
  const t = smoothstep(tRaw);
  const bool = (x: boolean | undefined, y: boolean | undefined) =>
    t < 0.5 ? Boolean(x) : Boolean(y);
  return {
    lean: lerp(a.lean, b.lean, t),
    shoulderSettle: lerp(a.shoulderSettle, b.shoulderSettle, t),
    elbowFlare: lerp(a.elbowFlare, b.elbowFlare, t),
    bones: {
      shoulder: lerpBone(a.bones.shoulder, b.bones.shoulder, t),
      upperArm: lerpBone(a.bones.upperArm, b.bones.upperArm, t),
      elbow: lerpBone(a.bones.elbow, b.bones.elbow, t),
      forearm: lerpBone(a.bones.forearm, b.bones.forearm, t),
      wrist: lerpBone(a.bones.wrist, b.bones.wrist, t),
      hand: lerpBone(a.bones.hand, b.bones.hand, t),
    },
    layers: {
      wraps: bool(a.layers.wraps, b.layers.wraps),
      bracer: bool(a.layers.bracer, b.layers.bracer),
      fingers: bool(a.layers.fingers, b.layers.fingers),
      thumb: bool(a.layers.thumb, b.layers.thumb),
      highlights: bool(a.layers.highlights, b.layers.highlights),
      shadows: bool(a.layers.shadows, b.layers.shadows),
      strain: bool(a.layers.strain, b.layers.strain),
    },
    material: {
      deformation: lerp(a.material.deformation, b.material.deformation, t),
      glow: lerp(a.material.glow, b.material.glow, t),
    },
  };
}

/**
 * Compute the shared grip point from the control differential.
 * `diff` in [-1, 1]: +1 = player pushing toward the opponent pin (right),
 * -1 = opponent pushing toward the player pin (left).
 */
export function computeGripPoint(
  gripCenter: Vec2,
  diff: number,
  maxSway: number,
  dip: number,
): Vec2 {
  const d = Math.max(-1, Math.min(1, diff));
  return {
    x: gripCenter.x + d * maxSway,
    y: gripCenter.y + Math.abs(d) * dip,
  };
}

// Chain layout: proximal axisT and how each bone spans the axis.
const JOINT_SIZE: Record<string, number> = {
  shoulder: 0.24,
  elbow: 0.18,
  wrist: 0.15,
};

const BONE_SPAN: Record<string, { proximal: number; distal: number }> = {
  upperArm: { proximal: -0.35, distal: 0 },
  forearm: { proximal: 0, distal: 0.82 },
  hand: { proximal: 0.82, distal: 1.0 },
};

function pointOnAxis(elbow: Vec2, axis: Vec2, axisLen: number, t: number): Vec2 {
  return { x: elbow.x + axis.x * t * axisLen, y: elbow.y + axis.y * t * axisLen };
}

/**
 * Solve all bone transforms for one fighter. Pure and deterministic.
 *
 * `baseLengths` maps assetId -> authored sprite bone length in px (distance from
 * the normalized anchor to the distal end of the sprite). Used to convert a
 * desired world length into a sprite scale.
 */
export function solveRig(
  parts: readonly RigPartInput[],
  baseLengths: Record<string, number>,
  input: FkInput,
): RigSolution {
  const { elbow, grip, pose, mirror } = input;
  const dx = grip.x - elbow.x;
  const dy = grip.y - elbow.y;
  const axisLen = Math.max(1, Math.hypot(dx, dy));
  const axis = { x: dx / axisLen, y: dy / axisLen };
  // Base angle: sprite local +y should point along the axis. Screen +y is down,
  // so rotation = atan2(axisY, axisX) - PI/2.
  const axisAngle = Math.atan2(axis.y, axis.x) - Math.PI / 2;
  const lateral = { x: -axis.y, y: axis.x }; // perpendicular (points "left" of axis)
  const mirrorSign = mirror ? -1 : 1;

  const transforms: Record<string, BoneTransform> = {};
  const glow = pose.material.glow;
  const strain = Boolean(pose.layers.strain);

  // Elbow flare offsets the elbow joint laterally (outward from center).
  const elbowFlare = pose.elbowFlare * mirrorSign;
  const shoulderSettle = pose.shoulderSettle;

  const bonePoseFor = (kind: string): BonePoseInput => {
    switch (kind) {
      case 'shoulder':
        return pose.bones.shoulder ?? {};
      case 'upperArm':
        return pose.bones.upperArm ?? {};
      case 'elbow':
        return pose.bones.elbow ?? {};
      case 'forearm':
        return pose.bones.forearm ?? {};
      case 'wrist':
        return pose.bones.wrist ?? {};
      case 'hand':
        return pose.bones.hand ?? {};
      default:
        return {};
    }
  };

  const layerVisible = (assetId: string, kind: string): boolean => {
    const l = pose.layers;
    if (assetId.endsWith('/wraps')) return Boolean(l.wraps);
    if (assetId.endsWith('/bracer')) return Boolean(l.bracer);
    if (assetId.endsWith('/fingers')) return Boolean(l.fingers);
    if (assetId.endsWith('/thumb')) return Boolean(l.thumb);
    if (assetId.endsWith('/grip-pad')) return Boolean(l.fingers);
    if (assetId.endsWith('/highlights')) return Boolean(l.highlights);
    if (assetId.endsWith('/shadows')) return Boolean(l.shadows);
    if (assetId.endsWith('/hydraulic-piston')) return true;
    void kind;
    return true;
  };

  // First pass: articulated bones + joints.
  for (const part of parts) {
    if (part.kind === 'overlay') continue;
    const bp = bonePoseFor(part.kind);
    const baseLen = baseLengths[part.assetId] ?? 100;

    if (part.kind === 'shoulder' || part.kind === 'elbow' || part.kind === 'wrist') {
      // Joint sprite: fixed world size proportional to axis length.
      const t = part.axisT ?? 0;
      let pos = pointOnAxis(elbow, axis, axisLen, t);
      if (part.kind === 'shoulder') {
        pos = { x: pos.x + lateral.x * 0, y: pos.y + shoulderSettle };
      }
      if (part.kind === 'elbow') {
        pos = { x: pos.x + lateral.x * elbowFlare, y: pos.y };
      }
      const worldSize = (JOINT_SIZE[part.kind] ?? 0.16) * axisLen * (bp.scale ?? 1);
      const scale = worldSize / baseLen;
      transforms[part.assetId] = {
        assetId: part.assetId,
        x: pos.x + (bp.dx ?? 0) * mirrorSign,
        y: pos.y + (bp.dy ?? 0),
        rotation: axisAngle + (bp.rot ?? 0) * mirrorSign,
        scaleX: scale * mirrorSign,
        scaleY: scale,
        visible: layerVisible(part.assetId, part.kind),
        z: part.z,
        glow,
        strain,
      };
      continue;
    }

    // Articulated bone (upperArm / forearm / hand).
    const span = BONE_SPAN[part.kind];
    if (!span) continue;
    const proximal = pointOnAxis(elbow, axis, axisLen, span.proximal);
    const worldLen = (span.distal - span.proximal) * axisLen * (bp.scale ?? 1);
    const scale = worldLen / baseLen;
    // The hand always aims at the shared grip point so fingers stay connected.
    let rotation = axisAngle + (bp.rot ?? 0) * mirrorSign;
    if (part.kind === 'hand') {
      rotation = axisAngle + (bp.rot ?? 0) * 0.4 * mirrorSign;
    }
    transforms[part.assetId] = {
      assetId: part.assetId,
      x: proximal.x + (bp.dx ?? 0) * mirrorSign,
      y: proximal.y + (bp.dy ?? 0),
      rotation,
      scaleX: scale * mirrorSign,
      scaleY: scale,
      visible: layerVisible(part.assetId, part.kind),
      z: part.z,
      glow,
      strain,
    };
  }

  // Second pass: overlays attach to their parent bone transform.
  for (const part of parts) {
    if (part.kind !== 'overlay' || !part.parent) continue;
    const parent = transforms[part.parent];
    if (!parent) continue;
    const baseLen = baseLengths[part.assetId] ?? 100;
    const parentBaseLen = baseLengths[part.parent] ?? 100;
    const offset = part.offset ?? { x: 0.5, y: 0.5 };
    const overlayScale = part.overlayScale ?? 1;
    // Parent world length (approx) derived from its scale * authored length.
    const parentWorldLen = Math.abs(parent.scaleY) * parentBaseLen;
    const parentWorldWidth = parentWorldLen; // bones are roughly uniform-scaled
    const localX = (offset.x - 0.5) * parentWorldWidth;
    const localY = offset.y * parentWorldLen - parentWorldLen * 0.0; // along bone
    // Rotate local offset by parent rotation (+y is bone direction).
    const cos = Math.cos(parent.rotation);
    const sin = Math.sin(parent.rotation);
    const ox = localX * cos - localY * sin;
    const oy = localX * sin + localY * cos;
    const scale = (parentWorldLen / baseLen) * overlayScale;
    transforms[part.assetId] = {
      assetId: part.assetId,
      x: parent.x + ox,
      y: parent.y + oy,
      rotation: parent.rotation,
      scaleX: scale * (mirror ? -1 : 1),
      scaleY: scale,
      visible: parent.visible && layerVisible(part.assetId, part.kind),
      z: part.z,
      glow,
      strain,
    };
  }

  return { transforms, axisAngle, axisLength: axisLen, grip };
}
