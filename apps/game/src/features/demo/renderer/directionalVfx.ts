import type {
  PremiumAssetPoint,
  PremiumVfxIntensityTier,
  PremiumVfxMetadata,
} from '@armz-clash/game-core';

export type BattleDirection = -1 | 0 | 1;

export type DirectionalVfxPlan = {
  assetId: string;
  direction: BattleDirection;
  rotation: number;
  flipX: boolean;
  displaySize: number;
  scale: number;
  intensity: PremiumVfxIntensityTier;
  opacity: number;
  lifetimeSeconds: number;
  velocity: PremiumAssetPoint;
  blendMode: PremiumVfxMetadata['blendMode'];
  zIndex: number;
  origin: PremiumAssetPoint;
  destination: PremiumAssetPoint | null;
  count: number;
};

const TIER_CONFIG: Record<
  PremiumVfxIntensityTier,
  { scale: number; opacity: number; lifetimeSeconds: number; speed: number; count: number }
> = {
  light: { scale: 0.75, opacity: 0.62, lifetimeSeconds: 0.42, speed: 70, count: 1 },
  medium: { scale: 1, opacity: 0.74, lifetimeSeconds: 0.55, speed: 95, count: 1 },
  heavy: { scale: 1.35, opacity: 0.84, lifetimeSeconds: 0.68, speed: 125, count: 2 },
  critical: { scale: 1.75, opacity: 0.94, lifetimeSeconds: 0.82, speed: 145, count: 2 },
  final: { scale: 2.6, opacity: 1, lifetimeSeconds: 1.05, speed: 165, count: 2 },
};

export function intensityTierFromBasisPoints(intensity: number): PremiumVfxIntensityTier {
  if (intensity >= 9500) return 'final';
  if (intensity >= 8000) return 'critical';
  if (intensity >= 6000) return 'heavy';
  if (intensity >= 3500) return 'medium';
  return 'light';
}

export function pressureDirectionForSide(side: string | undefined): BattleDirection {
  if (side === 'player') return 1;
  if (side === 'opponent') return -1;
  return 0;
}

export function momentumDirection(
  previousControlDiff: number,
  nextControlDiff: number,
): BattleDirection {
  const delta = nextControlDiff - previousControlDiff;
  if (Math.abs(delta) < 0.0001) return 0;
  return delta > 0 ? 1 : -1;
}

export function createDirectionalVfxPlan(input: {
  assetId: string;
  metadata: PremiumVfxMetadata;
  intensityBasisPoints: number;
  side?: string;
  previousDirection?: BattleDirection;
  origin: PremiumAssetPoint;
  destination?: PremiumAssetPoint | null;
}): DirectionalVfxPlan {
  const intensity = intensityTierFromBasisPoints(input.intensityBasisPoints);
  const tier = TIER_CONFIG[intensity];
  let direction = pressureDirectionForSide(input.side);
  if (input.metadata.directionMode === 'centered' || input.metadata.directionMode === 'outcome') {
    direction = 0;
  } else if (input.metadata.directionMode === 'counter' && input.previousDirection) {
    direction = input.previousDirection === 1 ? -1 : 1;
  }
  const displaySize = Math.min(
    input.metadata.maxDisplaySize,
    input.metadata.baseDisplaySize * tier.scale,
  );
  const velocity =
    direction === 0
      ? { x: 0, y: -tier.speed * 0.3 }
      : { x: direction * tier.speed, y: -tier.speed * 0.12 };
  return {
    assetId: input.assetId,
    direction,
    rotation: direction < 0 ? Math.PI : 0,
    flipX: direction < 0,
    displaySize,
    scale: tier.scale,
    intensity,
    opacity: tier.opacity,
    lifetimeSeconds: tier.lifetimeSeconds,
    velocity,
    blendMode: input.metadata.blendMode,
    zIndex: input.metadata.zIndex,
    origin: input.origin,
    destination: input.destination ?? null,
    count: tier.count,
  };
}

export function finalSlamDominatesPush(
  finalMetadata: PremiumVfxMetadata,
  pushMetadata: PremiumVfxMetadata,
): boolean {
  const finalPlan = createDirectionalVfxPlan({
    assetId: 'effects/final-slam',
    metadata: finalMetadata,
    intensityBasisPoints: 10_000,
    side: 'player',
    origin: { x: 0, y: 0 },
  });
  const pushPlan = createDirectionalVfxPlan({
    assetId: 'effects/push-streak',
    metadata: pushMetadata,
    intensityBasisPoints: 5_000,
    side: 'player',
    origin: { x: 0, y: 0 },
  });
  return (
    finalPlan.displaySize > pushPlan.displaySize &&
    finalPlan.opacity >= pushPlan.opacity &&
    finalPlan.lifetimeSeconds > pushPlan.lifetimeSeconds
  );
}
