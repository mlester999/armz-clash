/**
 * Phase 3.3B — runtime manifest loader.
 *
 * Fetches the generated JSON manifests from the static asset root and returns
 * typed bundles. Pure and injectable (custom fetch + base) for testability.
 */

import type { AssetEntry, AssetManifest } from './asset-manifest.types';
import type { PoseManifest, RigManifest } from './pose-manifest.types';

export const PHASE3_3B_ASSET_BASE = '/assets/game/phase3-3b';

export const MANIFEST_PATHS = {
  asset: `${PHASE3_3B_ASSET_BASE}/manifests/asset-manifest.json`,
  rig: `${PHASE3_3B_ASSET_BASE}/manifests/rig-manifest.json`,
  pose: `${PHASE3_3B_ASSET_BASE}/manifests/pose-manifest.json`,
  hashes: `${PHASE3_3B_ASSET_BASE}/manifests/hashes.json`,
} as const;

export type ManifestBundle = {
  assets: AssetManifest;
  rig: RigManifest;
  poses: PoseManifest;
};

export type ViewportClass = 'desktop' | 'tablet' | 'mobile';
export type TextureFormat = 'webp' | 'png';

/**
 * Resolve the absolute runtime URL for an asset entry given a viewport class
 * and texture format. WebP is primary; PNG is the fallback.
 */
export function resolveTextureUrl(
  entry: AssetEntry,
  viewport: ViewportClass,
  format: TextureFormat = 'webp',
  base: string = PHASE3_3B_ASSET_BASE,
): string {
  const rel =
    format === 'png'
      ? entry.pngFallback[viewport]
      : viewport === 'mobile'
        ? entry.mobileTexture
        : viewport === 'tablet'
          ? entry.tabletTexture
          : entry.desktopTexture;
  return `${base}/${rel}`;
}

/**
 * Load all three manifests in parallel. Throws on network/parse failure so the
 * caller can fall back to the procedural renderer.
 */
export async function loadGameManifests(
  base: string = PHASE3_3B_ASSET_BASE,
  fetchImpl: typeof fetch = fetch,
): Promise<ManifestBundle> {
  const [assets, rig, poses] = await Promise.all([
    fetchImpl(`${base}/manifests/asset-manifest.json`).then((r) =>
      r.json(),
    ) as Promise<AssetManifest>,
    fetchImpl(`${base}/manifests/rig-manifest.json`).then((r) => r.json()) as Promise<RigManifest>,
    fetchImpl(`${base}/manifests/pose-manifest.json`).then((r) =>
      r.json(),
    ) as Promise<PoseManifest>,
  ]);
  return { assets, rig, poses };
}

/** Look up a single asset entry by id (undefined when missing). */
export function getAssetEntry(manifest: AssetManifest, assetId: string): AssetEntry | undefined {
  return manifest.assets[assetId];
}
