/**
 * Phase 3.4 owner-asset ingestion pipeline.
 *
 * Accepts owner-supplied PNG/WebP files from apps/game/assets/phase3-4/final,
 * emits responsive WebP + PNG runtime variants, and writes an honest manifest.
 * Missing files are never promoted to final; their declared temporary fallback
 * remains visible in the manifest for owner review.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { format as formatWithPrettier } from 'prettier';
import sharp from 'sharp';
import {
  PHASE3_4_ASSET_SLOTS,
  PHASE3_4_MANIFEST_VERSION,
  type PremiumAssetEntry,
  type PremiumAssetManifest,
  type PremiumAssetSourceSet,
  type PremiumAssetVersionManifest,
} from '@armz-clash/game-core';

const ROOT = process.cwd();
const SOURCE_ROOT = path.resolve(ROOT, 'apps/game/assets/phase3-4/final');
const OUTPUT_ROOT = path.resolve(ROOT, 'apps/game/public/assets/game/phase3-4');
const FINAL_OUTPUT_ROOT = path.join(OUTPUT_ROOT, 'final');
const MANIFEST_ROOT = path.join(OUTPUT_ROOT, 'manifests');

function assertGeneratedPath(target: string): void {
  const resolved = path.resolve(target);
  const allowed = `${OUTPUT_ROOT}${path.sep}`;
  if (resolved !== OUTPUT_ROOT && !resolved.startsWith(allowed)) {
    throw new Error(`Refusing to write outside Phase 3.4 runtime output: ${resolved}`);
  }
}

function hashFile(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function findSource(sourceStem: string): { path: string; format: 'png' | 'webp' } | null {
  const png = path.join(SOURCE_ROOT, `${sourceStem}.png`);
  const webp = path.join(SOURCE_ROOT, `${sourceStem}.webp`);
  const matches = [
    existsSync(png) ? ({ path: png, format: 'png' } as const) : null,
    existsSync(webp) ? ({ path: webp, format: 'webp' } as const) : null,
  ].filter((value): value is { path: string; format: 'png' | 'webp' } => value !== null);
  if (matches.length > 1) {
    throw new Error(`Provide only one source format for ${sourceStem} (.png or .webp).`);
  }
  return matches[0] ?? null;
}

function runtimeSet(runtimeStem: string, extension: 'webp' | 'png'): PremiumAssetSourceSet {
  const prefix = `/assets/game/phase3-4/final/${runtimeStem}`;
  return {
    desktop: `${prefix}@2x.${extension}`,
    tablet: `${prefix}@2x.${extension}`,
    mobile: `${prefix}@1x.${extension}`,
  };
}

async function emitVariants(
  sourcePath: string,
  runtimeStem: string,
  width: number,
  height: number,
  transparent: boolean,
): Promise<void> {
  const destinationStem = path.join(FINAL_OUTPUT_ROOT, runtimeStem);
  assertGeneratedPath(destinationStem);
  mkdirSync(path.dirname(destinationStem), { recursive: true });

  for (const density of [1, 2] as const) {
    const targetWidth = density === 2 ? width : Math.max(1, Math.round(width / 2));
    const targetHeight = density === 2 ? height : Math.max(1, Math.round(height / 2));
    const base = sharp(sourcePath).resize(targetWidth, targetHeight, {
      fit: transparent ? 'contain' : 'cover',
      position: 'centre',
      background: transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 4, g: 8, b: 16, alpha: 1 },
      withoutEnlargement: false,
    });
    await base
      .clone()
      .webp({ quality: 88, alphaQuality: 95, smartSubsample: true })
      .toFile(`${destinationStem}@${density}x.webp`);
    await base
      .clone()
      .png({ compressionLevel: 8, adaptiveFiltering: true })
      .toFile(`${destinationStem}@${density}x.png`);
  }
}

async function main(): Promise<void> {
  assertGeneratedPath(FINAL_OUTPUT_ROOT);
  if (existsSync(FINAL_OUTPUT_ROOT)) {
    rmSync(FINAL_OUTPUT_ROOT, { recursive: true, force: true });
  }
  mkdirSync(FINAL_OUTPUT_ROOT, { recursive: true });
  mkdirSync(MANIFEST_ROOT, { recursive: true });

  const assets: Record<string, PremiumAssetEntry> = {};
  const files: PremiumAssetVersionManifest['files'] = {};
  let finalAssetCount = 0;

  for (const contract of [...PHASE3_4_ASSET_SLOTS].sort((a, b) =>
    a.assetId.localeCompare(b.assetId),
  )) {
    const source = findSource(contract.sourceStem);
    const final = runtimeSet(contract.runtimeStem, 'webp');
    const pngFallback = runtimeSet(contract.runtimeStem, 'png');
    if (source) {
      await emitVariants(
        source.path,
        contract.runtimeStem,
        contract.width,
        contract.height,
        contract.transparent,
      );
      const hash = hashFile(source.path);
      files[contract.assetId] = { hash, sourceFormat: source.format };
      finalAssetCount += 1;
      assets[contract.assetId] = {
        ...contract,
        density: [1, 2],
        viewportUsage: [...contract.viewportUsage],
        poseUsage: [...contract.poseUsage],
        availability: 'final',
        final,
        pngFallback,
        sourcePath: path.relative(ROOT, source.path).replaceAll('\\', '/'),
        sourceFormat: source.format,
        contentHash: hash,
      };
    } else {
      assets[contract.assetId] = {
        ...contract,
        density: [1, 2],
        viewportUsage: [...contract.viewportUsage],
        poseUsage: [...contract.poseUsage],
        availability: 'missing-final',
        final,
        pngFallback,
        sourcePath: `apps/game/assets/phase3-4/final/${contract.sourceStem}.{png|webp}`,
        sourceFormat: null,
        contentHash: null,
      };
    }
  }

  const missingFinalAssetCount = PHASE3_4_ASSET_SLOTS.length - finalAssetCount;
  const ownerAssetStatus = missingFinalAssetCount === 0 ? 'ready' : 'awaiting-owner-assets';
  const manifest: PremiumAssetManifest = {
    version: PHASE3_4_MANIFEST_VERSION,
    generatedBy: 'scripts/build-phase34-assets.ts',
    finalAssetCount,
    missingFinalAssetCount,
    fallbackVersion: 'phase3-3b-v1',
    ownerAssetStatus,
    assets,
  };
  const versionManifest: PremiumAssetVersionManifest = {
    manifestVersion: PHASE3_4_MANIFEST_VERSION,
    fallbackVersion: 'phase3-3b-v1',
    ownerAssetStatus,
    requiredFinalAssetCount: PHASE3_4_ASSET_SLOTS.length,
    integratedFinalAssetCount: finalAssetCount,
    files,
  };

  const [assetManifestJson, versionManifestJson] = await Promise.all([
    formatWithPrettier(JSON.stringify(manifest), { parser: 'json' }),
    formatWithPrettier(JSON.stringify(versionManifest), { parser: 'json' }),
  ]);
  writeFileSync(path.join(MANIFEST_ROOT, 'asset-manifest.json'), assetManifestJson);
  writeFileSync(path.join(MANIFEST_ROOT, 'version-manifest.json'), versionManifestJson);

  process.stdout.write(
    `Phase 3.4 assets: ${finalAssetCount}/${PHASE3_4_ASSET_SLOTS.length} final; ${missingFinalAssetCount} awaiting owner files.\n`,
  );
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
