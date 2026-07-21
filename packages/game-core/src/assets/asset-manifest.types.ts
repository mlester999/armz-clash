/**
 * Phase 3.3B â€” typed runtime asset manifest.
 *
 * These types describe the JSON emitted by `scripts/build-game-assets.ts`
 * under `apps/game/public/assets/game/phase3-3b/manifests/asset-manifest.json`.
 * They are the runtime contract consumed by the sprite rig renderer.
 */

export type Vec2 = { x: number; y: number };

export type BoundingBox = { x: number; y: number; w: number; h: number };

export type MaterialCategory =
  'skin' | 'cloth' | 'leather' | 'metal' | 'metal-cyan' | 'energy' | 'composite';

export type TextureVariant = { desktop: string; tablet: string; mobile: string };

export type AssetEntry = {
  assetId: string;
  fighterId: string | null;
  /** Repo-relative path to the authored SVG source. */
  sourceSvgPath: string;
  /** Runtime texture path relative to the phase3-3b asset root (WebP, 2x). */
  runtimeTexturePath: string;
  /** 1x raster width in px. */
  width: number;
  /** 1x raster height in px. */
  height: number;
  pixelDensity: number;
  /** Normalized sprite anchor (0..1). */
  anchor: Vec2;
  /** Normalized rotation pivot (0..1). */
  pivot: Vec2;
  /** Semantic anchors (null when not applicable to this part). */
  gripAnchor: Vec2 | null;
  elbowAnchor: Vec2 | null;
  shoulderAnchor: Vec2 | null;
  handAnchor: Vec2 | null;
  boundingBox: BoundingBox;
  /** Pose ids this asset is compatible with (rig parts list all poses). */
  poseCompatibility: string[];
  desktopTexture: string;
  tabletTexture: string;
  mobileTexture: string;
  pngFallback: TextureVariant;
  atlasKey: string;
  materialCategory: MaterialCategory;
  assetVersion: string;
};

export type AssetManifest = {
  version: string;
  generatedBy: string;
  assetCount: number;
  assets: Record<string, AssetEntry>;
};
