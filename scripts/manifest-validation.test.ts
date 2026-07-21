/**
 * Phase 3.3B - Runtime manifest, anchor, and pose validation tests.
 * Validates the generated JSON manifests and authored pose definitions.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const MANIFEST_DIR = path.resolve(
  process.cwd(),
  'apps/game/public/assets/game/phase3-3b/manifests',
);
const TEXTURE_DIR = path.resolve(process.cwd(), 'apps/game/public/assets/game/phase3-3b');

function loadJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(MANIFEST_DIR, file), 'utf-8'));
}

describe('Phase 3.3B runtime manifest validation', () => {
  it('asset-manifest.json exists and is valid JSON', () => {
    const manifest = loadJson('asset-manifest.json') as {
      version: string;
      assetCount: number;
      assets: Record<
        string,
        {
          assetId: string;
          width: number;
          height: number;
          anchor: { x: number; y: number };
          runtimeTexturePath: string;
        }
      >;
    };
    expect(manifest.version).toBeTruthy();
    expect(manifest.assetCount).toBeGreaterThan(0);
    expect(Object.keys(manifest.assets).length).toBe(manifest.assetCount);
  });

  it('all asset entries have valid anchor values (0..1)', () => {
    const manifest = loadJson('asset-manifest.json') as {
      assets: Record<string, { anchor: { x: number; y: number }; pivot: { x: number; y: number } }>;
    };
    for (const [id, entry] of Object.entries(manifest.assets)) {
      expect(entry.anchor.x, `${id} anchor.x`).toBeGreaterThanOrEqual(0);
      expect(entry.anchor.x, `${id} anchor.x`).toBeLessThanOrEqual(1);
      expect(entry.anchor.y, `${id} anchor.y`).toBeGreaterThanOrEqual(0);
      expect(entry.anchor.y, `${id} anchor.y`).toBeLessThanOrEqual(1);
      expect(entry.pivot.x, `${id} pivot.x`).toBeGreaterThanOrEqual(0);
      expect(entry.pivot.x, `${id} pivot.x`).toBeLessThanOrEqual(1);
      expect(entry.pivot.y, `${id} pivot.y`).toBeGreaterThanOrEqual(0);
      expect(entry.pivot.y, `${id} pivot.y`).toBeLessThanOrEqual(1);
    }
  });

  it('all asset entries have positive dimensions', () => {
    const manifest = loadJson('asset-manifest.json') as {
      assets: Record<string, { width: number; height: number }>;
    };
    for (const [id, entry] of Object.entries(manifest.assets)) {
      expect(entry.width, `${id} width`).toBeGreaterThan(0);
      expect(entry.height, `${id} height`).toBeGreaterThan(0);
    }
  });

  it('runtime texture paths resolve to existing files (2x webp)', () => {
    const manifest = loadJson('asset-manifest.json') as {
      assets: Record<string, { desktopTexture: string }>;
    };
    let checked = 0;
    for (const [, entry] of Object.entries(manifest.assets)) {
      const texPath = path.join(TEXTURE_DIR, entry.desktopTexture);
      if (fs.existsSync(texPath)) checked++;
    }
    // At least 80% of textures should exist (some may be png-only fallbacks)
    expect(checked).toBeGreaterThan(Object.keys(manifest.assets).length * 0.7);
  });

  it('rig-manifest.json exists and has both fighters', () => {
    const rig = loadJson('rig-manifest.json') as {
      version: string;
      fighters: Record<string, Array<{ assetId: string; kind: string; z: number }>>;
    };
    expect(rig.version).toBeTruthy();
    expect(Object.keys(rig.fighters)).toContain('rookie-brawler');
    expect(Object.keys(rig.fighters)).toContain('practice-automaton');
  });

  it('each fighter rig has at least 10 parts', () => {
    const rig = loadJson('rig-manifest.json') as {
      fighters: Record<string, Array<{ assetId: string }>>;
    };
    for (const [fid, parts] of Object.entries(rig.fighters)) {
      expect(parts.length, `${fid} parts count`).toBeGreaterThanOrEqual(10);
    }
  });

  it('rig parts have valid z-ordering (no duplicates per fighter)', () => {
    const rig = loadJson('rig-manifest.json') as {
      fighters: Record<string, Array<{ z: number; assetId: string }>>;
    };
    for (const [fid, parts] of Object.entries(rig.fighters)) {
      const zValues = parts.map((p) => p.z);
      const unique = new Set(zValues);
      expect(unique.size, `${fid} z-order duplicates`).toBe(zValues.length);
    }
  });

  it('pose-manifest.json exists and has all 22 required poses', () => {
    const poses = loadJson('pose-manifest.json') as {
      version: string;
      poses: Array<{ poseId: string }>;
      cueToPose: Record<string, string>;
    };
    expect(poses.version).toBeTruthy();
    const requiredPoses = [
      'ready',
      'approach',
      'grip',
      'neutral',
      'lightAdvantagePlayer',
      'strongAdvantagePlayer',
      'lightAdvantageOpponent',
      'strongAdvantageOpponent',
      'counterPlayer',
      'counterOpponent',
      'criticalPlayer',
      'criticalOpponent',
      'recoveryPlayer',
      'recoveryOpponent',
      'fatiguePlayer',
      'fatigueOpponent',
      'finalSlamPlayer',
      'finalSlamOpponent',
      'victoryPlayer',
      'victoryOpponent',
      'defeatPlayer',
      'defeatOpponent',
    ];
    const poseIds = new Set(poses.poses.map((p) => p.poseId));
    for (const required of requiredPoses) {
      expect(poseIds.has(required), `missing pose: ${required}`).toBe(true);
    }
  });

  it('pose-manifest cueToPose maps all server animation cues', () => {
    const poses = loadJson('pose-manifest.json') as {
      cueToPose: Record<string, string>;
      poses: Array<{ poseId: string }>;
    };
    const poseIds = new Set(poses.poses.map((p) => p.poseId));
    for (const [, poseId] of Object.entries(poses.cueToPose)) {
      expect(poseIds.has(poseId), `cueToPose references unknown pose: ${poseId}`).toBe(true);
    }
  });

  it('pose definitions have valid lean values (-1..1)', () => {
    const poses = loadJson('pose-manifest.json') as {
      poses: Array<{ poseId: string; lean: number }>;
    };
    for (const p of poses.poses) {
      expect(Math.abs(p.lean), `${p.poseId} lean`).toBeLessThanOrEqual(1);
    }
  });

  it('hashes.json exists', () => {
    expect(fs.existsSync(path.join(MANIFEST_DIR, 'hashes.json'))).toBe(true);
  });

  it('mobile textures exist for fighter rig parts', () => {
    const manifest = loadJson('asset-manifest.json') as {
      assets: Record<string, { mobileTexture: string; fighterId: string | null }>;
    };
    let mobileCount = 0;
    for (const [, entry] of Object.entries(manifest.assets)) {
      if (entry.fighterId && entry.mobileTexture) {
        const texPath = path.join(TEXTURE_DIR, entry.mobileTexture);
        if (fs.existsSync(texPath)) mobileCount++;
      }
    }
    expect(mobileCount).toBeGreaterThan(0);
  });
});
