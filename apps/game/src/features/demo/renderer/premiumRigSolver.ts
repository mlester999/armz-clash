import type { Phase34BattleRigContract, Phase34RigLayerContract } from '@armz-clash/game-core';
import {
  solveRig,
  type BoneTransform,
  type FkInput,
  type RigPartInput,
  type RigSolution,
  type Vec2,
} from './rigSolver';

export type PremiumRigJointSolution = {
  shoulder: Vec2;
  elbow: Vec2;
  wrist: Vec2;
  grip: Vec2;
};

export type PremiumRigFrameSolution = RigSolution & {
  joints: PremiumRigJointSolution;
  connectionErrors: {
    shoulderToElbow: number;
    elbowToWrist: number;
    wristToGrip: number;
  };
};

export type PreparedPremiumRig = {
  contract: Phase34BattleRigContract;
  baseLengths: Record<string, number>;
  textureSizes: Record<string, { width: number; height: number }>;
  parts: RigPartInput[];
};

function solverKind(layer: Phase34RigLayerContract): RigPartInput['kind'] {
  if (layer.kind === 'upper-arm') return 'upperArm';
  if (layer.kind === 'forearm') return 'forearm';
  if (layer.kind === 'hand') return 'hand';
  return 'overlay';
}

function axisT(layer: Phase34RigLayerContract): number | undefined {
  if (layer.kind === 'upper-arm') return -0.35;
  if (layer.kind === 'forearm') return 0;
  if (layer.kind === 'hand') return 0.82;
  return undefined;
}

function connectionVector(
  layer: Phase34RigLayerContract,
  size: { width: number; height: number },
): Vec2 {
  const child = layer.childConnectionPoint;
  if (!child) return { x: 0, y: Math.max(1, size.height) };
  return {
    x: (child.x - layer.localConnectionPoint.x) * size.width,
    y: (child.y - layer.localConnectionPoint.y) * size.height,
  };
}

function connectionLength(
  layer: Phase34RigLayerContract,
  size: { width: number; height: number },
): number {
  const vector = connectionVector(layer, size);
  return Math.max(1, Math.hypot(vector.x, vector.y));
}

export function preparePremiumRig(
  contract: Phase34BattleRigContract,
  textureSizes: ReadonlyMap<string, { width: number; height: number }>,
): PreparedPremiumRig {
  const parts = contract.layers.map((layer) => ({
    assetId: layer.assetId,
    kind: solverKind(layer),
    anchor: layer.anchor,
    axisT: axisT(layer),
    parent: layer.parentAssetId ?? undefined,
    offset: layer.kind === 'overlay' ? { x: 0.5, y: 0.5 } : undefined,
    overlayScale: layer.kind === 'overlay' ? 1 : undefined,
    rotationLimits: layer.rotationLimits,
    scaleLimits: layer.scaleLimits,
    z: layer.zIndex,
  }));
  const baseLengths: Record<string, number> = {};
  const preparedTextureSizes: Record<string, { width: number; height: number }> = {};
  for (const layer of contract.layers) {
    const size = textureSizes.get(layer.assetId) ?? {
      width: layer.width,
      height: layer.height,
    };
    preparedTextureSizes[layer.assetId] = size;
    baseLengths[layer.assetId] = connectionLength(layer, size);
  }
  return { contract, baseLengths, textureSizes: preparedTextureSizes, parts };
}

function transformedVector(vector: Vec2, transform: BoneTransform): Vec2 {
  const scaledX = vector.x * transform.scaleX;
  const scaledY = vector.y * transform.scaleY;
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  return {
    x: scaledX * cos - scaledY * sin,
    y: scaledX * sin + scaledY * cos,
  };
}

function setSegmentTransform(input: {
  layer: Phase34RigLayerContract;
  transform: BoneTransform;
  parent: Vec2;
  child: Vec2;
  mirror: boolean;
  baseLength: number;
  textureSize: { width: number; height: number };
}): BoneTransform {
  const { layer, transform, parent, child, mirror, baseLength, textureSize } = input;
  const local = connectionVector(layer, textureSize);
  const mirrorSign = mirror ? -1 : 1;
  const mirroredLocal = { x: local.x * mirrorSign, y: local.y };
  const world = { x: child.x - parent.x, y: child.y - parent.y };
  const worldLength = Math.max(1, Math.hypot(world.x, world.y));
  const localAngle = Math.atan2(mirroredLocal.y, mirroredLocal.x);
  const worldAngle = Math.atan2(world.y, world.x);
  const scale = worldLength / Math.max(1, baseLength);
  return {
    ...transform,
    x: parent.x,
    y: parent.y,
    rotation: worldAngle - localAngle,
    scaleX: scale * mirrorSign,
    scaleY: scale,
  };
}

function actualChildPoint(
  layer: Phase34RigLayerContract,
  transform: BoneTransform,
  textureSize: { width: number; height: number },
): Vec2 {
  const vector = connectionVector(layer, textureSize);
  const world = transformedVector(vector, transform);
  return { x: transform.x + world.x, y: transform.y + world.y };
}

function midpoint(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Solve the premium four-layer arm and then constrain its real connection
 * anchors. The hand is placed from the shared grip backwards, the forearm spans
 * the planted elbow to that wrist, and the upper arm terminates at the elbow.
 * This keeps authored wrist bend while guaranteeing zero endpoint drift.
 */
export function solvePremiumRigFrame(
  prepared: PreparedPremiumRig,
  input: FkInput,
): PremiumRigFrameSolution {
  const initial = solveRig(prepared.parts, prepared.baseLengths, input);
  const transforms = { ...initial.transforms };
  const upperLayer = prepared.contract.layers.find((layer) => layer.kind === 'upper-arm');
  const forearmLayer = prepared.contract.layers.find((layer) => layer.kind === 'forearm');
  const handLayer = prepared.contract.layers.find((layer) => layer.kind === 'hand');
  if (!upperLayer || !forearmLayer || !handLayer) {
    throw new Error(`Incomplete premium rig contract: ${prepared.contract.fighterId}`);
  }

  const upperInitial = transforms[upperLayer.assetId];
  const forearmInitial = transforms[forearmLayer.assetId];
  const handInitial = transforms[handLayer.assetId];
  if (!upperInitial || !forearmInitial || !handInitial) {
    throw new Error(`Premium rig solver omitted a required layer: ${prepared.contract.fighterId}`);
  }

  const mirrorSign = input.mirror ? -1 : 1;
  const axisDirection = initial.axisAngle + Math.PI / 2;
  const forearmRotation = input.pose.bones.forearm?.rot ?? 0;
  const wristRotation = input.pose.bones.wrist?.rot ?? 0;
  const handRotation = input.pose.bones.hand?.rot ?? 0;
  const wristBend =
    clamp(forearmRotation * 0.25 + wristRotation * 0.45 + handRotation * 0.3, -0.55, 0.55) *
    mirrorSign;
  const handLength = Math.abs(handInitial.scaleY) * (prepared.baseLengths[handLayer.assetId] ?? 1);
  const handDirection = axisDirection + wristBend;
  const wrist = {
    x: input.grip.x - Math.cos(handDirection) * handLength,
    y: input.grip.y - Math.sin(handDirection) * handLength,
  };

  const handTransform = setSegmentTransform({
    layer: handLayer,
    transform: handInitial,
    parent: wrist,
    child: input.grip,
    mirror: input.mirror,
    baseLength: prepared.baseLengths[handLayer.assetId] ?? 1,
    textureSize: prepared.textureSizes[handLayer.assetId] ?? {
      width: handLayer.width,
      height: handLayer.height,
    },
  });
  transforms[handLayer.assetId] = handTransform;

  const forearmTransform = setSegmentTransform({
    layer: forearmLayer,
    transform: forearmInitial,
    parent: input.elbow,
    child: wrist,
    mirror: input.mirror,
    baseLength: prepared.baseLengths[forearmLayer.assetId] ?? 1,
    textureSize: prepared.textureSizes[forearmLayer.assetId] ?? {
      width: forearmLayer.width,
      height: forearmLayer.height,
    },
  });
  transforms[forearmLayer.assetId] = forearmTransform;

  const shoulderRotation = input.pose.bones.shoulder?.rot ?? input.pose.lean;
  const upperRotation = input.pose.bones.upperArm?.rot ?? 0;
  const upperBend = clamp(upperRotation * 0.75 + shoulderRotation * 0.25, -0.45, 0.45) * mirrorSign;
  const upperLength =
    Math.abs(upperInitial.scaleY) * (prepared.baseLengths[upperLayer.assetId] ?? 1);
  const upperDirection = axisDirection + upperBend;
  const shoulder = {
    x: input.elbow.x - Math.cos(upperDirection) * upperLength,
    y: input.elbow.y - Math.sin(upperDirection) * upperLength,
  };
  const upperTransform = setSegmentTransform({
    layer: upperLayer,
    transform: upperInitial,
    parent: shoulder,
    child: input.elbow,
    mirror: input.mirror,
    baseLength: prepared.baseLengths[upperLayer.assetId] ?? 1,
    textureSize: prepared.textureSizes[upperLayer.assetId] ?? {
      width: upperLayer.width,
      height: upperLayer.height,
    },
  });
  transforms[upperLayer.assetId] = upperTransform;

  for (const layer of prepared.contract.layers) {
    if (layer.kind !== 'overlay' || !layer.parentAssetId) continue;
    const transform = transforms[layer.assetId];
    const parentLayer = prepared.contract.layers.find(
      (candidate) => candidate.assetId === layer.parentAssetId,
    );
    const parentTransform = transforms[layer.parentAssetId];
    if (!transform || !parentLayer || !parentTransform) continue;
    const parentStart = { x: parentTransform.x, y: parentTransform.y };
    const parentEnd = actualChildPoint(
      parentLayer,
      parentTransform,
      prepared.textureSizes[parentLayer.assetId] ?? {
        width: parentLayer.width,
        height: parentLayer.height,
      },
    );
    const atContact = layer.assetId.endsWith('/contact-shadow');
    const position = atContact ? parentEnd : midpoint(parentStart, parentEnd);
    const parentWorldLength = Math.hypot(parentEnd.x - parentStart.x, parentEnd.y - parentStart.y);
    const overlayScale = parentWorldLength / (prepared.baseLengths[layer.assetId] ?? 1);
    transforms[layer.assetId] = {
      ...transform,
      x: position.x,
      y: position.y,
      rotation: atContact ? 0 : parentTransform.rotation,
      scaleX: overlayScale * mirrorSign,
      scaleY: overlayScale,
    };
  }

  const solvedGrip = actualChildPoint(
    handLayer,
    transforms[handLayer.assetId]!,
    prepared.textureSizes[handLayer.assetId] ?? {
      width: handLayer.width,
      height: handLayer.height,
    },
  );
  const solvedWrist = { x: transforms[handLayer.assetId]!.x, y: transforms[handLayer.assetId]!.y };
  const solvedElbow = {
    x: transforms[forearmLayer.assetId]!.x,
    y: transforms[forearmLayer.assetId]!.y,
  };
  const solvedShoulder = {
    x: transforms[upperLayer.assetId]!.x,
    y: transforms[upperLayer.assetId]!.y,
  };
  const solvedUpperChild = actualChildPoint(
    upperLayer,
    transforms[upperLayer.assetId]!,
    prepared.textureSizes[upperLayer.assetId] ?? {
      width: upperLayer.width,
      height: upperLayer.height,
    },
  );
  const solvedForearmChild = actualChildPoint(
    forearmLayer,
    transforms[forearmLayer.assetId]!,
    prepared.textureSizes[forearmLayer.assetId] ?? {
      width: forearmLayer.width,
      height: forearmLayer.height,
    },
  );

  return {
    ...initial,
    transforms,
    grip: solvedGrip,
    joints: {
      shoulder: solvedShoulder,
      elbow: solvedElbow,
      wrist: solvedWrist,
      grip: solvedGrip,
    },
    connectionErrors: {
      shoulderToElbow: connectionError(solvedUpperChild, solvedElbow),
      elbowToWrist: connectionError(solvedForearmChild, solvedWrist),
      wristToGrip: connectionError(solvedGrip, input.grip),
    },
  };
}

export function connectionError(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
