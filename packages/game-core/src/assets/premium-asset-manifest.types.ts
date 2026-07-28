/**
 * Phase 3.4 premium raster-asset contract.
 *
 * Owner-supplied PNG/WebP files are normalized by scripts/build-phase34-assets.ts.
 * Missing final art is always explicit and may only resolve to a declared temporary fallback.
 */

export type PremiumAssetRole =
  | 'hero'
  | 'portrait'
  | 'versus'
  | 'battle-side'
  | 'result-victory'
  | 'result-defeat'
  | 'arena-background'
  | 'table'
  | 'elbow-pad'
  | 'pin-pad'
  | 'result-accent'
  | 'battle-effect'
  | 'ui-decoration';

export type PremiumAssetAvailability = 'final' | 'missing-final';
export type PremiumAssetViewport = 'desktop' | 'tablet' | 'mobile';

export type PremiumAssetPoint = { x: number; y: number };

export type PremiumAssetSourceSet = {
  desktop: string;
  tablet: string;
  mobile: string;
};

export type PremiumAssetSlotContract = {
  assetId: string;
  role: PremiumAssetRole;
  fighterId: 'rookie-brawler' | 'practice-automaton' | null;
  /** Path without extension below apps/game/assets/phase3-4/final. */
  sourceStem: string;
  /** Path without density/extension below the phase3-4 runtime final directory. */
  runtimeStem: string;
  width: number;
  height: number;
  density: readonly [1, 2];
  viewportUsage: readonly PremiumAssetViewport[];
  poseUsage: readonly string[];
  transparent: boolean;
  critical: boolean;
  fallbackMode: 'phase3-3b-raster' | 'phase3-3b-sprite-rig' | 'none';
  anchor: PremiumAssetPoint;
  pivot: PremiumAssetPoint;
  gripPoint: PremiumAssetPoint | null;
  elbowPoint: PremiumAssetPoint | null;
  fallback: PremiumAssetSourceSet | null;
};

export type PremiumAssetEntry = Omit<
  PremiumAssetSlotContract,
  'density' | 'viewportUsage' | 'poseUsage'
> & {
  density: [1, 2];
  viewportUsage: PremiumAssetViewport[];
  poseUsage: string[];
  availability: PremiumAssetAvailability;
  final: PremiumAssetSourceSet;
  pngFallback: PremiumAssetSourceSet;
  sourcePath: string;
  sourceFormat: 'png' | 'webp' | null;
  contentHash: string | null;
};

export type PremiumAssetManifest = {
  version: string;
  generatedBy: 'scripts/build-phase34-assets.ts';
  finalAssetCount: number;
  missingFinalAssetCount: number;
  fallbackVersion: 'phase3-3b-v1';
  ownerAssetStatus: 'ready' | 'awaiting-owner-assets';
  assets: Record<string, PremiumAssetEntry>;
};

export type PremiumAssetVersionManifest = {
  manifestVersion: string;
  fallbackVersion: 'phase3-3b-v1';
  ownerAssetStatus: 'ready' | 'awaiting-owner-assets';
  requiredFinalAssetCount: number;
  integratedFinalAssetCount: number;
  files: Record<string, { hash: string; sourceFormat: 'png' | 'webp' }>;
};
