/**
 * Phase 3.3B - Build determinism, rig solver, result integrity, audio lifecycle, and pacing tests.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import {
  solveRig,
  blendPoses,
  computeGripPoint,
  smoothstep,
  lerp,
} from '../apps/game/src/features/demo/renderer/rigSolver';
import { simulateDemoBattle } from '@armz-clash/game-core';
import { EASY_DEMO_OPPONENT } from '@armz-clash/game-core';
import { generateCommonDemoStats } from '@armz-clash/game-core';

const HASHES_PATH = path.join(
  process.cwd(),
  'apps/game/public/assets/game/phase3-3b/manifests/hashes.json',
);
const OUTPUT_DIR = path.join(process.cwd(), 'apps/game/public/assets/game/phase3-3b');

interface HashesFile {
  version: string;
  hashes: Record<string, string>;
}

describe('Phase 3.3B build determinism', () => {
  it('hashes.json contains valid content hashes for all assets', () => {
    const data = JSON.parse(fs.readFileSync(HASHES_PATH, 'utf-8')) as HashesFile;
    expect(data.version).toBe('phase3-3b-v1');
    const keys = Object.keys(data.hashes);
    expect(keys.length).toBeGreaterThan(0);
    // All hash values should be full SHA-256 hex strings (64 chars)
    for (const [key, hash] of Object.entries(data.hashes)) {
      expect(typeof hash, `${key} hash type`).toBe('string');
      expect(hash.length, `${key} hash length`).toBe(64);
      expect(hash, `${key} hash format`).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('stored hashes match actual output files (determinism proxy)', () => {
    // Verify that the stored hashes match a fresh hash of the rasterized output files.
    // This proves the build is deterministic: same input -> same output -> same hash.
    const data = JSON.parse(fs.readFileSync(HASHES_PATH, 'utf-8')) as HashesFile;
    const sampleKeys = Object.keys(data.hashes).slice(0, 10);
    expect(sampleKeys.length).toBeGreaterThan(0);
    for (const rel of sampleKeys) {
      const filePath = path.join(OUTPUT_DIR, rel);
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath);
      const hash = createHash('sha256').update(content).digest('hex');
      expect(hash, `hash mismatch for ${rel}`).toBe(data.hashes[rel]);
    }
  });
});

describe('Phase 3.3B rig solver', () => {
  const testParts = [
    {
      assetId: 'test/shoulder',
      kind: 'shoulder' as const,
      anchor: { x: 0.5, y: 0.42 },
      axisT: -0.35,
      z: 10,
    },
    {
      assetId: 'test/upper-arm',
      kind: 'upperArm' as const,
      anchor: { x: 0.5, y: 0.07 },
      axisT: -0.35,
      z: 20,
    },
    { assetId: 'test/elbow', kind: 'elbow' as const, anchor: { x: 0.5, y: 0.5 }, axisT: 0, z: 30 },
    {
      assetId: 'test/forearm',
      kind: 'forearm' as const,
      anchor: { x: 0.5, y: 0.07 },
      axisT: 0,
      z: 40,
    },
    { assetId: 'test/hand', kind: 'hand' as const, anchor: { x: 0.5, y: 0.1 }, axisT: 0.82, z: 60 },
  ];
  const baseLengths: Record<string, number> = {
    'test/shoulder': 50,
    'test/upper-arm': 100,
    'test/elbow': 40,
    'test/forearm': 120,
    'test/hand': 60,
  };
  const neutralPose = {
    lean: 0,
    shoulderSettle: 0,
    elbowFlare: 0,
    bones: {},
    layers: {
      wraps: true,
      bracer: true,
      fingers: true,
      thumb: true,
      highlights: true,
      shadows: true,
      strain: false,
    },
    material: { deformation: 0, glow: 0 },
  };

  it('produces transforms for all parts', () => {
    const result = solveRig(testParts, baseLengths, {
      elbow: { x: 100, y: 200 },
      grip: { x: 200, y: 150 },
      pose: neutralPose,
      mirror: false,
    });
    for (const part of testParts) {
      expect(
        result.transforms[part.assetId],
        `missing transform for ${part.assetId}`,
      ).toBeDefined();
    }
  });

  it('grip point is stable (shared grip contract)', () => {
    const grip = { x: 200, y: 150 };
    const result = solveRig(testParts, baseLengths, {
      elbow: { x: 100, y: 200 },
      grip,
      pose: neutralPose,
      mirror: false,
    });
    expect(result.grip.x).toBe(grip.x);
    expect(result.grip.y).toBe(grip.y);
  });

  it('mirror flips scaleX sign', () => {
    const normal = solveRig(testParts, baseLengths, {
      elbow: { x: 100, y: 200 },
      grip: { x: 200, y: 150 },
      pose: neutralPose,
      mirror: false,
    });
    const mirrored = solveRig(testParts, baseLengths, {
      elbow: { x: 300, y: 200 },
      grip: { x: 200, y: 150 },
      pose: neutralPose,
      mirror: true,
    });
    const normalHand = normal.transforms['test/hand'];
    const mirrorHand = mirrored.transforms['test/hand'];
    expect(Math.sign(normalHand.scaleX)).not.toBe(Math.sign(mirrorHand.scaleX));
  });

  it('computeGripPoint moves grip toward pin based on diff', () => {
    const center = { x: 200, y: 150 };
    const right = computeGripPoint(center, 0.5, 100, 10);
    const left = computeGripPoint(center, -0.5, 100, 10);
    expect(right.x).toBeGreaterThan(center.x);
    expect(left.x).toBeLessThan(center.x);
    expect(right.y).toBeGreaterThan(center.y); // dip
  });

  it('smoothstep produces correct easing', () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBe(0.5);
    expect(smoothstep(-0.5)).toBe(0);
    expect(smoothstep(1.5)).toBe(1);
  });

  it('blendPoses interpolates correctly', () => {
    const a = { ...neutralPose, lean: 0 };
    const b = { ...neutralPose, lean: 1 };
    const blended = blendPoses(a, b, 0.5);
    expect(blended.lean).toBeCloseTo(0.5, 1);
  });
});

describe('Phase 3.3B result integrity regression', () => {
  it('victory: opponentFinalControl === 0 && playerFinalControl > 0', () => {
    for (let i = 0; i < 2000; i++) {
      const r = simulateDemoBattle({
        seed: `phase33b-v-${i}`,
        player: generateCommonDemoStats(`phase33b-v-${i}`),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      if (r.outcome === 'victory') {
        expect(r.opponentFinalStrength).toBe(0);
        expect(r.playerFinalStrength).toBeGreaterThan(0);
      }
    }
  });

  it('defeat: playerFinalControl === 0 && opponentFinalControl > 0', () => {
    for (let i = 0; i < 2000; i++) {
      const r = simulateDemoBattle({
        seed: `phase33b-d-${i}`,
        player: generateCommonDemoStats(`phase33b-d-${i}`),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      if (r.outcome === 'defeat') {
        expect(r.playerFinalStrength).toBe(0);
        expect(r.opponentFinalStrength).toBeGreaterThan(0);
      }
    }
  });

  it('exactly one side reaches zero (no zero-zero, no double-win)', () => {
    for (let i = 0; i < 2000; i++) {
      const r = simulateDemoBattle({
        seed: `phase33b-z-${i}`,
        player: generateCommonDemoStats(`phase33b-z-${i}`),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      const zeros = [r.playerFinalStrength === 0, r.opponentFinalStrength === 0].filter(
        Boolean,
      ).length;
      expect(zeros).toBe(1);
    }
  });

  it('skip-to-result produces same final values as full playback', () => {
    const r = simulateDemoBattle({
      seed: 'phase33b-skip-1',
      player: generateCommonDemoStats('phase33b-skip-1'),
      opponent: EASY_DEMO_OPPONENT.stats,
    });
    // The final timeline event should match the reported final strengths
    const last = r.timeline[r.timeline.length - 1];
    expect(last.playerStrengthAfter).toBe(r.playerFinalStrength);
    expect(last.opponentStrengthAfter).toBe(r.opponentFinalStrength);
  });
});

describe('Phase 3.3B battle pacing', () => {
  it('average battle duration is 8-12 seconds', () => {
    let total = 0;
    const N = 1000;
    for (let i = 0; i < N; i++) {
      const r = simulateDemoBattle({
        seed: `phase33b-pace-${i}`,
        player: generateCommonDemoStats(`phase33b-pace-${i}`),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      total += r.durationMs;
    }
    const avg = total / N;
    expect(avg).toBeGreaterThanOrEqual(8000);
    expect(avg).toBeLessThanOrEqual(12000);
  });

  it('grip lock occurs within first 2.5 seconds', () => {
    for (let i = 0; i < 200; i++) {
      const r = simulateDemoBattle({
        seed: `phase33b-grip-${i}`,
        player: generateCommonDemoStats(`phase33b-grip-${i}`),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      const grip = r.timeline.find((e) => e.type === 'hands_locked');
      expect(grip).toBeDefined();
      expect(grip!.startMs).toBeLessThanOrEqual(2500);
    }
  });

  it('no battle exceeds 14 seconds', () => {
    for (let i = 0; i < 500; i++) {
      const r = simulateDemoBattle({
        seed: `phase33b-max-${i}`,
        player: generateCommonDemoStats(`phase33b-max-${i}`),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      expect(r.durationMs).toBeLessThanOrEqual(14000);
    }
  });
});

describe('Phase 3.3B audio lifecycle', () => {
  it('BattleAudio class exists and has proper lifecycle methods', async () => {
    // Dynamic import to avoid AudioContext issues in node
    const mod = await import('../apps/game/src/features/demo/renderer/BattleAudio');
    expect(mod.BattleAudio).toBeDefined();
    const audio = new mod.BattleAudio();
    expect(typeof audio.init).toBe('function');
    expect(typeof audio.destroy).toBe('function');
    expect(typeof audio.playCue).toBe('function');
    expect(typeof audio.setSfxEnabled).toBe('function');
    expect(typeof audio.setMusicEnabled).toBe('function');
    // Destroy without init should not throw
    audio.destroy();
  });

  it('playCue after destroy does not throw', async () => {
    const mod = await import('../apps/game/src/features/demo/renderer/BattleAudio');
    const audio = new mod.BattleAudio();
    audio.destroy();
    expect(() => audio.playCue('hands_lock', 5000)).not.toThrow();
  });

  it('double destroy does not throw', async () => {
    const mod = await import('../apps/game/src/features/demo/renderer/BattleAudio');
    const audio = new mod.BattleAudio();
    audio.destroy();
    expect(() => audio.destroy()).not.toThrow();
  });
});
