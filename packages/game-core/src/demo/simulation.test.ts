import { describe, expect, it } from 'vitest';
import { simulateDemoBattle, formatDemoArmzAmount } from './combat';
import { EASY_DEMO_OPPONENT } from './opponent';
import {
  averageCommonStats,
  generateCommonDemoStats,
  maxCommonStats,
  minCommonStats,
} from './stats';
import { DEMO_ARMZ_PRESETS } from './presets';

describe('demo combat engine', () => {
  it('is deterministic for the same seed', () => {
    const player = averageCommonStats();
    const a = simulateDemoBattle({
      seed: 'test-seed-42',
      player,
      opponent: EASY_DEMO_OPPONENT.stats,
    });
    const b = simulateDemoBattle({
      seed: 'test-seed-42',
      player,
      opponent: EASY_DEMO_OPPONENT.stats,
    });
    expect(a.outcome).toBe(b.outcome);
    expect(a.durationMs).toBe(b.durationMs);
    expect(a.timeline).toEqual(b.timeline);
    expect(a.reward).toEqual(b.reward);
  });

  it('produces a valid timeline with strength changes', () => {
    const result = simulateDemoBattle({
      seed: 'timeline-check',
      player: averageCommonStats(),
      opponent: EASY_DEMO_OPPONENT.stats,
    });
    expect(result.timeline.length).toBeGreaterThan(10);
    expect(result.timeline.some((e) => e.type === 'hands_locked')).toBe(true);
    expect(result.timeline.some((e) => e.type === 'final_slam')).toBe(true);
    expect(result.timeline.some((e) => e.type === 'complete')).toBe(true);
    const strengthMoves = result.timeline.filter(
      (e) =>
        e.playerStrengthAfter !== e.playerStrengthBefore ||
        e.opponentStrengthAfter !== e.opponentStrengthBefore,
    );
    expect(strengthMoves.length).toBeGreaterThan(3);
    if (result.outcome === 'victory') {
      expect(result.opponentFinalStrength).toBe(0);
      expect(result.playerFinalStrength).toBeGreaterThan(0);
      expect(result.reward?.simulated).toBe(true);
      expect(result.reward?.claimable).toBe(false);
    } else {
      expect(result.playerFinalStrength).toBe(0);
      expect(result.reward).toBeNull();
    }
  });

  it('formats demo micro-units without float storage', () => {
    expect(formatDemoArmzAmount(1_500_000)).toBe('1.50');
    expect(formatDemoArmzAmount(1_000_000)).toBe('1.00');
  });
});

describe('demo balance simulation (100k)', () => {
  it('meets Easy win-rate targets for Common demo ARMZ', () => {
    const N = 100_000;
    const opponent = EASY_DEMO_OPPONENT.stats;

    let wins = 0;
    let crits = 0;
    let recoveries = 0;
    let durationSum = 0;
    let rewardSum = 0;
    let rewardCount = 0;

    for (let i = 0; i < N; i += 1) {
      const player = generateCommonDemoStats(`bal-${i}`);
      const r = simulateDemoBattle({
        seed: `battle-${i}`,
        player,
        opponent,
      });
      if (r.outcome === 'victory') {
        wins += 1;
        if (r.reward) {
          rewardSum += r.reward.demoUnits;
          rewardCount += 1;
        }
      }
      crits += r.criticalEvents;
      recoveries += r.recoveryEvents;
      durationSum += r.durationMs;
    }

    const winRate = wins / N;
    // Target band 68–76% for average Common rolls
    expect(winRate).toBeGreaterThanOrEqual(0.62);
    expect(winRate).toBeLessThanOrEqual(0.82);

    const minWins = Array.from({ length: 5_000 }, (_, i) =>
      simulateDemoBattle({
        seed: `min-${i}`,
        player: minCommonStats(),
        opponent,
      }),
    ).filter((r) => r.outcome === 'victory').length;
    const minRate = minWins / 5_000;
    expect(minRate).toBeGreaterThanOrEqual(0.52);

    const maxWins = Array.from({ length: 5_000 }, (_, i) =>
      simulateDemoBattle({
        seed: `max-${i}`,
        player: maxCommonStats(),
        opponent,
      }),
    ).filter((r) => r.outcome === 'victory').length;
    const maxRate = maxWins / 5_000;
    expect(maxRate).toBeLessThanOrEqual(0.9);
    expect(maxRate).toBeGreaterThan(minRate);

    // Preset coverage — each preset key via seed path
    for (const preset of DEMO_ARMZ_PRESETS) {
      let pWins = 0;
      const samples = 2_000;
      for (let i = 0; i < samples; i += 1) {
        const player = generateCommonDemoStats(`${preset.key}-${i}`);
        const r = simulateDemoBattle({
          seed: `${preset.key}-b-${i}`,
          player,
          opponent,
        });
        if (r.outcome === 'victory') pWins += 1;
      }
      const rate = pWins / samples;
      expect(rate).toBeGreaterThan(0.55);
      expect(rate).toBeLessThan(0.88);
    }

    expect(crits / N).toBeGreaterThan(0);
    expect(recoveries / N).toBeGreaterThan(0);
    expect(durationSum / N).toBeGreaterThan(8_000);
    expect(rewardCount).toBe(wins);
    if (rewardCount > 0) {
      const avgReward = rewardSum / rewardCount;
      expect(avgReward).toBeGreaterThanOrEqual(1_000_000);
      expect(avgReward).toBeLessThanOrEqual(2_000_000);
    }

    // Expose summary for report (vitest console)
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        n: N,
        winRate,
        minRate,
        maxRate,
        avgDurationMs: Math.round(durationSum / N),
        criticalPerBattle: crits / N,
        recoveryPerBattle: recoveries / N,
        avgRewardMicros: rewardCount ? Math.round(rewardSum / rewardCount) : 0,
      }),
    );
  }, 120_000);
});
