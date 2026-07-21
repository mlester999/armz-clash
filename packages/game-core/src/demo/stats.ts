/**
 * Common-only demo stat generation.
 * Integer stats only; critical chance in basis points (100 = 1%).
 */

import { pickDemoPresetKey, type DemoArmzPresetKey } from './presets';
import { createSeededRng, type SeededRng } from './rng';

export type DemoCombatStats = {
  power: number;
  grip: number;
  technique: number;
  endurance: number;
  defense: number;
  speed: number;
  luck: number;
  /** Basis points 0–10000 */
  criticalChance: number;
};

export type CommonStatRanges = {
  power: [number, number];
  grip: [number, number];
  technique: [number, number];
  endurance: [number, number];
  defense: [number, number];
  speed: [number, number];
  luck: [number, number];
  criticalChance: [number, number];
};

export const COMMON_DEMO_STAT_RANGES: CommonStatRanges = {
  power: [35, 50],
  grip: [35, 50],
  technique: [30, 48],
  endurance: [38, 52],
  defense: [30, 47],
  speed: [30, 48],
  luck: [10, 25],
  criticalChance: [300, 700],
};

/** Phase 3.3 pacing: 8-12s battles, higher per-exchange damage. */
export const DEMO_CONFIG_VERSION = 'demo-combat-v3';

function rollInRange(rng: SeededRng, [min, max]: [number, number]): number {
  return rng.intInclusive(min, max);
}

export function generateCommonDemoStats(seed: string | number): DemoCombatStats {
  const rng = createSeededRng(seed);
  const r = COMMON_DEMO_STAT_RANGES;
  return {
    power: rollInRange(rng, r.power),
    grip: rollInRange(rng, r.grip),
    technique: rollInRange(rng, r.technique),
    endurance: rollInRange(rng, r.endurance),
    defense: rollInRange(rng, r.defense),
    speed: rollInRange(rng, r.speed),
    luck: rollInRange(rng, r.luck),
    criticalChance: rollInRange(rng, r.criticalChance),
  };
}

export function generateDemoArmzIdentity(seed: string | number): {
  presetKey: DemoArmzPresetKey;
  stats: DemoCombatStats;
} {
  const rng = createSeededRng(seed);
  const presetKey = pickDemoPresetKey(rng.intInclusive(0, 1_000_000));
  // Re-seed with preset so stats stable for same seed+preset pipeline
  const stats = generateCommonDemoStats(`${seed}:${presetKey}`);
  return { presetKey, stats };
}

/** Minimum corner of Common ranges (for balance sims). */
export function minCommonStats(): DemoCombatStats {
  const r = COMMON_DEMO_STAT_RANGES;
  return {
    power: r.power[0],
    grip: r.grip[0],
    technique: r.technique[0],
    endurance: r.endurance[0],
    defense: r.defense[0],
    speed: r.speed[0],
    luck: r.luck[0],
    criticalChance: r.criticalChance[0],
  };
}

export function maxCommonStats(): DemoCombatStats {
  const r = COMMON_DEMO_STAT_RANGES;
  return {
    power: r.power[1],
    grip: r.grip[1],
    technique: r.technique[1],
    endurance: r.endurance[1],
    defense: r.defense[1],
    speed: r.speed[1],
    luck: r.luck[1],
    criticalChance: r.criticalChance[1],
  };
}

export function averageCommonStats(): DemoCombatStats {
  const a = minCommonStats();
  const b = maxCommonStats();
  return {
    power: Math.round((a.power + b.power) / 2),
    grip: Math.round((a.grip + b.grip) / 2),
    technique: Math.round((a.technique + b.technique) / 2),
    endurance: Math.round((a.endurance + b.endurance) / 2),
    defense: Math.round((a.defense + b.defense) / 2),
    speed: Math.round((a.speed + b.speed) / 2),
    luck: Math.round((a.luck + b.luck) / 2),
    criticalChance: Math.round((a.criticalChance + b.criticalChance) / 2),
  };
}
