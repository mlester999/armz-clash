/**
 * Phase 3.4A premium raster-asset contract.
 *
 * Owner-supplied PNG/WebP files are normalized by scripts/build-phase34-assets.ts.
 * Missing final art is always explicit and may only resolve to a declared fallback.
 */

export type PremiumAssetRole =
  | 'hero'
  | 'portrait'
  | 'versus'
  | 'battle-rig-layer'
  | 'result-victory'
  | 'result-defeat'
  | 'arena-background'
  | 'table-surface'
  | 'table-frame'
  | 'elbow-pad'
  | 'pin-pad'
  | 'result-accent'
  | 'battle-effect'
  | 'ui-decoration';

export type PremiumAssetCategory =
  'fighter-presentation' | 'fighter-rig' | 'arena' | 'result' | 'vfx' | 'ui-decoration';

export type PremiumAcceptanceTier = 'A' | 'B' | 'C';
export type PremiumAssetAvailability = 'final' | 'missing-final';
export type PremiumAssetViewport = 'desktop' | 'tablet' | 'mobile';
export type PremiumOwnerAssetStatus = 'awaiting-tier-a-assets' | 'awaiting-tier-b-assets' | 'ready';

export type PremiumAssetPoint = { x: number; y: number };
export type PremiumAssetRect = { x: number; y: number; width: number; height: number };
export type PremiumAssetRange = { min: number; max: number };

export type PremiumAssetSourceSet = {
  desktop: string;
  tablet: string;
  mobile: string;
};

export type PremiumRigJointName =
  | 'shoulder'
  | 'elbow'
  | 'wrist'
  | 'hand'
  | 'shoulderMount'
  | 'elbowBearing'
  | 'wristAssembly'
  | 'mechanicalHand'
  | 'grip';

export type PremiumRigLayerKind = 'upper-arm' | 'forearm' | 'hand' | 'overlay';

export type PremiumRigLayerMetadata = {
  rigId: 'rookie-brawler' | 'practice-automaton';
  layerId: string;
  kind: PremiumRigLayerKind;
  parentAssetId: string | null;
  parentJoint: PremiumRigJointName | null;
  childJoint: PremiumRigJointName | null;
  localConnectionPoint: PremiumAssetPoint;
  childConnectionPoint: PremiumAssetPoint | null;
  referenceBounds: PremiumAssetRect;
  rotationLimits: PremiumAssetRange;
  scaleLimits: PremiumAssetRange;
  zIndex: number;
  mirrorRule: 'never' | 'opponent';
  requiredForPremiumPair: boolean;
  fallbackBehavior: 'phase3-3b-sprite-rig' | 'omit-layer';
};

export type PremiumVfxDirectionMode = 'centered' | 'pressure' | 'counter' | 'outcome';
export type PremiumVfxIntensityTier = 'light' | 'medium' | 'heavy' | 'critical' | 'final';

export type PremiumVfxMetadata = {
  directionMode: PremiumVfxDirectionMode;
  supportedIntensityTiers: readonly PremiumVfxIntensityTier[];
  baseDisplaySize: number;
  maxDisplaySize: number;
  blendMode: 'normal' | 'add' | 'screen' | 'multiply';
  zIndex: number;
};

export type PremiumResponsiveFocalPoints = Record<PremiumAssetViewport, PremiumAssetPoint>;

export type PremiumAssetSlotContract = {
  assetId: string;
  role: PremiumAssetRole;
  category: PremiumAssetCategory;
  fighterId: 'rookie-brawler' | 'practice-automaton' | null;
  /** Path without extension below apps/game/assets/phase3-4/final. */
  sourceStem: string;
  /** Path without density/extension below the phase3-4 runtime final directory. */
  runtimeStem: string;
  expectedSourceFormats: readonly ['png', 'webp'];
  width: number;
  height: number;
  aspectRatio: string;
  density: readonly [1, 2];
  viewportUsage: readonly PremiumAssetViewport[];
  poseUsage: readonly string[];
  transparent: boolean;
  /** Tier A assets are the first meaningful visual-review gate. */
  critical: boolean;
  acceptanceTier: PremiumAcceptanceTier;
  requiredForAcceptance: boolean;
  productionCallSites: readonly string[];
  replacementPriority: number;
  visualMatchAssetIds: readonly string[];
  framing: string;
  fallbackMode: 'phase3-3b-raster' | 'phase3-3b-sprite-rig' | 'phase3-3b-table-pack' | 'none';
  anchor: PremiumAssetPoint;
  pivot: PremiumAssetPoint;
  gripPoint: PremiumAssetPoint | null;
  elbowPoint: PremiumAssetPoint | null;
  focalPoint: PremiumAssetPoint | null;
  responsiveFocalPoints: PremiumResponsiveFocalPoints | null;
  rigLayer: PremiumRigLayerMetadata | null;
  vfx: PremiumVfxMetadata | null;
  fallback: PremiumAssetSourceSet | null;
};

export type PremiumAssetEntry = Omit<
  PremiumAssetSlotContract,
  'density' | 'viewportUsage' | 'poseUsage' | 'productionCallSites' | 'visualMatchAssetIds'
> & {
  density: [1, 2];
  viewportUsage: PremiumAssetViewport[];
  poseUsage: string[];
  productionCallSites: string[];
  visualMatchAssetIds: string[];
  availability: PremiumAssetAvailability;
  final: PremiumAssetSourceSet;
  pngFallback: PremiumAssetSourceSet;
  sourcePath: string;
  sourceFormat: 'png' | 'webp' | null;
  contentHash: string | null;
};

export type PremiumAcceptanceCounts = {
  tierARequiredAssetCount: number;
  tierAIntegratedAssetCount: number;
  tierAMissingAssetCount: number;
  tierBRequiredAssetCount: number;
  tierBIntegratedAssetCount: number;
  tierBMissingAssetCount: number;
  tierCOptionalAssetCount: number;
  tierCIntegratedAssetCount: number;
  tierCMissingAssetCount: number;
};

export type PremiumAssetManifest = PremiumAcceptanceCounts & {
  version: string;
  generatedBy: 'scripts/build-phase34-assets.ts';
  finalAssetCount: number;
  missingFinalAssetCount: number;
  requiredFinalAssetCount: number;
  integratedRequiredFinalAssetCount: number;
  missingRequiredFinalAssetCount: number;
  optionalAssetCount: number;
  fallbackVersion: 'phase3-3b-v1';
  ownerAssetStatus: PremiumOwnerAssetStatus;
  deprecatedFinalAssetIds: string[];
  assets: Record<string, PremiumAssetEntry>;
};

export type PremiumAssetVersionManifest = PremiumAcceptanceCounts & {
  manifestVersion: string;
  fallbackVersion: 'phase3-3b-v1';
  ownerAssetStatus: PremiumOwnerAssetStatus;
  requiredFinalAssetCount: number;
  optionalAssetCount: number;
  integratedFinalAssetCount: number;
  integratedRequiredFinalAssetCount: number;
  files: Record<string, { hash: string; sourceFormat: 'png' | 'webp' }>;
};
