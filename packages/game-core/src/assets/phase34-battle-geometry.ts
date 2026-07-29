import type { PremiumAssetPoint, PremiumAssetViewport } from './premium-asset-manifest.types';

export type Phase34CoverLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
};

export const PHASE3_4_ARENA_VIEWPORT_FOCUS: Record<PremiumAssetViewport, PremiumAssetPoint> = {
  desktop: { x: 0.5, y: 0.42 },
  tablet: { x: 0.5, y: 0.38 },
  mobile: { x: 0.5, y: 0.32 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Aspect-preserving cover layout with a source focal point aligned to a target
 * viewport focus. The result may crop, but never distorts the source texture.
 */
export function layoutFocalCover(
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  sourceFocalPoint: PremiumAssetPoint,
  viewportFocusPoint: PremiumAssetPoint,
): Phase34CoverLayout {
  const safeSourceWidth = Math.max(1, sourceWidth);
  const safeSourceHeight = Math.max(1, sourceHeight);
  const safeViewportWidth = Math.max(1, viewportWidth);
  const safeViewportHeight = Math.max(1, viewportHeight);
  const scale = Math.max(
    safeViewportWidth / safeSourceWidth,
    safeViewportHeight / safeSourceHeight,
  );
  const width = safeSourceWidth * scale;
  const height = safeSourceHeight * scale;
  const desiredX = safeViewportWidth * viewportFocusPoint.x - width * sourceFocalPoint.x;
  const desiredY = safeViewportHeight * viewportFocusPoint.y - height * sourceFocalPoint.y;
  return {
    x: clamp(desiredX, safeViewportWidth - width, 0),
    y: clamp(desiredY, safeViewportHeight - height, 0),
    width,
    height,
    scale,
  };
}

export function quadraticPinArc(
  start: PremiumAssetPoint,
  destination: PremiumAssetPoint,
  progress: number,
  lift: number,
): PremiumAssetPoint {
  const t = clamp(progress, 0, 1);
  const oneMinusT = 1 - t;
  const control = {
    x: (start.x + destination.x) / 2,
    y: Math.min(start.y, destination.y) - Math.max(0, lift),
  };
  return {
    x: oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * destination.x,
    y: oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * destination.y,
  };
}

export function gripDistance(a: PremiumAssetPoint, b: PremiumAssetPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export type Phase34RigDiagnostics = {
  gripDistanceError: number;
  playerElbowDrift: number;
  opponentElbowDrift: number;
  invalidTransformCount: number;
  valid: boolean;
};

export function validatePhase34RigFrame(input: {
  sharedGrip: PremiumAssetPoint;
  playerGrip: PremiumAssetPoint;
  opponentGrip: PremiumAssetPoint;
  playerElbow: PremiumAssetPoint;
  playerExpectedElbow: PremiumAssetPoint;
  opponentElbow: PremiumAssetPoint;
  opponentExpectedElbow: PremiumAssetPoint;
  transformValues: readonly number[];
  gripTolerance?: number;
  elbowTolerance?: number;
}): Phase34RigDiagnostics {
  const playerGripError = gripDistance(input.playerGrip, input.sharedGrip);
  const opponentGripError = gripDistance(input.opponentGrip, input.sharedGrip);
  const gripDistanceError = Math.max(
    gripDistance(input.playerGrip, input.opponentGrip),
    playerGripError,
    opponentGripError,
  );
  const playerElbowDrift = gripDistance(input.playerElbow, input.playerExpectedElbow);
  const opponentElbowDrift = gripDistance(input.opponentElbow, input.opponentExpectedElbow);
  const invalidTransformCount = input.transformValues.filter(
    (value) => !Number.isFinite(value),
  ).length;
  const gripTolerance = input.gripTolerance ?? 1;
  const elbowTolerance = input.elbowTolerance ?? 3;
  return {
    gripDistanceError,
    playerElbowDrift,
    opponentElbowDrift,
    invalidTransformCount,
    valid:
      gripDistanceError <= gripTolerance &&
      playerElbowDrift <= elbowTolerance &&
      opponentElbowDrift <= elbowTolerance &&
      invalidTransformCount === 0,
  };
}
