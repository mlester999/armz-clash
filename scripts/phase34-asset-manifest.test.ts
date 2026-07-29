import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PHASE3_4_ASSET_SLOTS,
  PHASE3_4_DEPRECATED_FINAL_ASSET_IDS,
  PHASE3_4_MANIFEST_VERSION,
  PHASE3_4_REQUIRED_ASSET_SLOTS,
  PHASE3_4_REQUIRED_RIG_ASSET_IDS,
  PHASE3_4_TIER_A_ASSET_IDS,
  PHASE3_4_TIER_B_ASSET_IDS,
  PHASE3_4_TIER_C_ASSET_IDS,
  type PremiumAssetManifest,
  type PremiumAssetVersionManifest,
} from '@armz-clash/game-core';

const root = process.cwd();
const manifestPath = path.join(
  root,
  'apps/game/public/assets/game/phase3-4/manifests/asset-manifest.json',
);
const versionPath = path.join(
  root,
  'apps/game/public/assets/game/phase3-4/manifests/version-manifest.json',
);
const sourceRoot = path.join(root, 'apps/game/assets/phase3-4/final');

function load<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

describe('Phase 3.4A premium asset contract', () => {
  it('defines the revised unique layered-rig and complete-table slots', () => {
    const ids = PHASE3_4_ASSET_SLOTS.map((entry) => entry.assetId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(38);
    for (const required of [
      ...PHASE3_4_REQUIRED_RIG_ASSET_IDS,
      'arena/background',
      'arena/table-surface',
      'arena/table-frame',
      'arena/elbow-pad',
      'arena/pin-pad',
      'result/victory-accent',
      'result/defeat-accent',
    ]) {
      expect(ids).toContain(required);
    }
    expect(ids).not.toContain('rookie-brawler/battle-side');
    expect(ids).not.toContain('practice-automaton/battle-side');
    expect(ids).not.toContain('arena/table');
    expect(PHASE3_4_DEPRECATED_FINAL_ASSET_IDS).toEqual(
      expect.arrayContaining([
        'rookie-brawler/battle-side',
        'practice-automaton/battle-side',
        'arena/table',
      ]),
    );
  });

  it('uses explicit acceptance tiers and excludes optional art from the gate', () => {
    expect(PHASE3_4_TIER_A_ASSET_IDS).toHaveLength(21);
    expect(PHASE3_4_TIER_B_ASSET_IDS).toHaveLength(12);
    expect(PHASE3_4_TIER_C_ASSET_IDS).toHaveLength(5);
    expect(PHASE3_4_REQUIRED_ASSET_SLOTS).toHaveLength(33);
    const corner = PHASE3_4_ASSET_SLOTS.find((entry) => entry.assetId === 'ui/championship-corner');
    expect(corner?.acceptanceTier).toBe('C');
    expect(corner?.requiredForAcceptance).toBe(false);
    expect(corner?.productionCallSites).toHaveLength(0);
  });

  it('gives every mandatory asset a real production call site', () => {
    for (const entry of PHASE3_4_REQUIRED_ASSET_SLOTS) {
      expect(entry.productionCallSites.length, entry.assetId).toBeGreaterThan(0);
    }
  });

  it('has no duplicate source stem and keeps SVG unsupported', () => {
    const stems = PHASE3_4_ASSET_SLOTS.map((entry) => entry.sourceStem);
    expect(new Set(stems).size).toBe(stems.length);
    for (const entry of PHASE3_4_ASSET_SLOTS) {
      expect(entry.sourceStem).not.toMatch(/\.svg$/i);
      expect(entry.expectedSourceFormats).toEqual(['png', 'webp']);
      const png = path.join(sourceRoot, `${entry.sourceStem}.png`);
      const webp = path.join(sourceRoot, `${entry.sourceStem}.webp`);
      expect(existsSync(png) && existsSync(webp), entry.assetId).toBe(false);
    }
  });

  it('emits an honest final-vs-fallback runtime manifest', () => {
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = load<PremiumAssetManifest>(manifestPath);
    expect(manifest.version).toBe(PHASE3_4_MANIFEST_VERSION);
    expect(Object.keys(manifest.assets)).toHaveLength(PHASE3_4_ASSET_SLOTS.length);
    expect(manifest.finalAssetCount + manifest.missingFinalAssetCount).toBe(
      PHASE3_4_ASSET_SLOTS.length,
    );
    expect(manifest.requiredFinalAssetCount).toBe(33);
    expect(manifest.optionalAssetCount).toBe(5);

    for (const entry of Object.values(manifest.assets)) {
      expect(entry.sourcePath).not.toMatch(/\.svg$/i);
      for (const point of [entry.anchor, entry.pivot]) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(1);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(1);
      }
      if (entry.availability === 'final') {
        for (const url of Object.values(entry.final)) {
          expect(existsSync(path.join(root, 'apps/game/public', url))).toBe(true);
        }
      } else if (
        entry.fallbackMode === 'phase3-3b-raster' ||
        entry.fallbackMode === 'phase3-3b-table-pack'
      ) {
        expect(entry.fallback).not.toBeNull();
        for (const url of Object.values(entry.fallback!)) {
          expect(existsSync(path.join(root, 'apps/game/public', url))).toBe(true);
        }
      }
    }
  });

  it('declares the legacy layered rig only as the complete-pair fallback', () => {
    const manifest = load<PremiumAssetManifest>(manifestPath);
    for (const assetId of PHASE3_4_REQUIRED_RIG_ASSET_IDS) {
      const entry = manifest.assets[assetId]!;
      expect(entry.rigLayer?.requiredForPremiumPair).toBe(true);
      if (entry.availability === 'missing-final') {
        expect(entry.fallbackMode).toBe('phase3-3b-sprite-rig');
        expect(entry.fallback).toBeNull();
      }
    }
  });

  it('version manifest matches integrated files and tier-aware owner status', () => {
    const manifest = load<PremiumAssetManifest>(manifestPath);
    const versions = load<PremiumAssetVersionManifest>(versionPath);
    expect(versions.manifestVersion).toBe(manifest.version);
    expect(versions.integratedFinalAssetCount).toBe(manifest.finalAssetCount);
    expect(versions.requiredFinalAssetCount).toBe(33);
    expect(versions.optionalAssetCount).toBe(5);
    expect(Object.keys(versions.files)).toHaveLength(manifest.finalAssetCount);
    expect(versions.ownerAssetStatus).toBe(manifest.ownerAssetStatus);
    expect(versions.ownerAssetStatus).toBe(
      manifest.tierAMissingAssetCount > 0
        ? 'awaiting-tier-a-assets'
        : manifest.tierBMissingAssetCount > 0
          ? 'awaiting-tier-b-assets'
          : 'ready',
    );
  });
});
