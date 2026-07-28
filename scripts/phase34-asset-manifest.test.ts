import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PHASE3_4_ASSET_SLOTS,
  PHASE3_4_MANIFEST_VERSION,
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

function load<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

describe('Phase 3.4 premium asset contract', () => {
  it('defines unique slots for every flagship surface', () => {
    const ids = PHASE3_4_ASSET_SLOTS.map((entry) => entry.assetId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const required of [
      'rookie-brawler/hero',
      'rookie-brawler/portrait',
      'rookie-brawler/versus',
      'rookie-brawler/battle-side',
      'rookie-brawler/result-victory',
      'rookie-brawler/result-defeat',
      'practice-automaton/hero',
      'practice-automaton/portrait',
      'practice-automaton/versus',
      'practice-automaton/battle-side',
      'practice-automaton/result-victory',
      'practice-automaton/result-defeat',
      'arena/background',
      'arena/table',
      'arena/elbow-pad',
      'arena/pin-pad',
      'result/victory-accent',
      'result/defeat-accent',
    ]) {
      expect(ids).toContain(required);
    }
  });

  it('emits an honest final-vs-placeholder runtime manifest', () => {
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = load<PremiumAssetManifest>(manifestPath);
    expect(manifest.version).toBe(PHASE3_4_MANIFEST_VERSION);
    expect(Object.keys(manifest.assets)).toHaveLength(PHASE3_4_ASSET_SLOTS.length);
    expect(manifest.finalAssetCount + manifest.missingFinalAssetCount).toBe(
      PHASE3_4_ASSET_SLOTS.length,
    );

    for (const entry of Object.values(manifest.assets)) {
      expect(entry.sourcePath).not.toMatch(/\.svg$/i);
      expect(entry.anchor.x).toBeGreaterThanOrEqual(0);
      expect(entry.anchor.x).toBeLessThanOrEqual(1);
      expect(entry.anchor.y).toBeGreaterThanOrEqual(0);
      expect(entry.anchor.y).toBeLessThanOrEqual(1);

      if (entry.availability === 'final') {
        for (const url of Object.values(entry.final)) {
          expect(existsSync(path.join(root, 'apps/game/public', url))).toBe(true);
        }
      } else if (entry.fallbackMode === 'phase3-3b-raster') {
        expect(entry.fallback).not.toBeNull();
        for (const url of Object.values(entry.fallback!)) {
          expect(existsSync(path.join(root, 'apps/game/public', url))).toBe(true);
        }
      }
    }
  });

  it('declares sprite-rig fallback only for missing battle-side art', () => {
    const manifest = load<PremiumAssetManifest>(manifestPath);
    for (const id of ['rookie-brawler/battle-side', 'practice-automaton/battle-side']) {
      const entry = manifest.assets[id]!;
      if (entry.availability === 'missing-final') {
        expect(entry.fallbackMode).toBe('phase3-3b-sprite-rig');
        expect(entry.fallback).toBeNull();
      }
    }
  });

  it('version manifest matches integrated file hashes and owner status', () => {
    const manifest = load<PremiumAssetManifest>(manifestPath);
    const versions = load<PremiumAssetVersionManifest>(versionPath);
    expect(versions.manifestVersion).toBe(manifest.version);
    expect(versions.integratedFinalAssetCount).toBe(manifest.finalAssetCount);
    expect(versions.requiredFinalAssetCount).toBe(PHASE3_4_ASSET_SLOTS.length);
    expect(Object.keys(versions.files)).toHaveLength(manifest.finalAssetCount);
    expect(versions.ownerAssetStatus).toBe(
      manifest.missingFinalAssetCount === 0 ? 'ready' : 'awaiting-owner-assets',
    );
  });
});
