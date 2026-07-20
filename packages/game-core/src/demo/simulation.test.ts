import { describe, expect, it } from 'vitest';
import {
  compressRatingDelta,
  easyWinChanceBps,
  formatDemoArmzAmount,
  simulateDemoBattle,
} from './combat';
import { EASY_DEMO_OPPONENT } from './opponent';
import {
  averageCommonStats,
  DEMO_CONFIG_VERSION,
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
    expect(a.configurationVersion).toBe(DEMO_CONFIG_VERSION);
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

  it('never guarantees 100% or 0% win chance for Common extremes', () => {
    const minBps = easyWinChanceBps(minCommonStats(), EASY_DEMO_OPPONENT.stats);
    const maxBps = easyWinChanceBps(maxCommonStats(), EASY_DEMO_OPPONENT.stats);
    expect(minBps).toBeGreaterThanOrEqual(5800);
    expect(minBps).toBeLessThanOrEqual(6200);
    expect(maxBps).toBeGreaterThanOrEqual(8200);
    expect(maxBps).toBeLessThanOrEqual(8600);
    expect(compressRatingDelta(0)).toBe(0);
  });

  it('recovery occurs at most once and is rare-but-visible (~2–5%)', () => {
    const samples = 20_000;
    let withRecovery = 0;
    let multiRecovery = 0;
    for (let i = 0; i < samples; i += 1) {
      const r = simulateDemoBattle({
        seed: `rec-${i}`,
        player: averageCommonStats(),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      if (r.recoveryEvents > 0) withRecovery += 1;
      if (r.recoveryEvents > 1) multiRecovery += 1;
    }
    const rate = withRecovery / samples;
    expect(multiRecovery).toBe(0);
    expect(rate).toBeGreaterThanOrEqual(0.02);
    expect(rate).toBeLessThanOrEqual(0.05);
  });
});

describe('demo balance simulation (1M)', () => {
  it('meets Phase 3.2 Easy win-rate targets for Common demo ARMZ', () => {
    const N = 1_000_000;
    const opponent = EASY_DEMO_OPPONENT.stats;

    let wins = 0;
    let crits = 0;
    let recoveries = 0;
    let battlesWithRecovery = 0;
    let durationSum = 0;
    let rewardSum = 0;
    let rewardCount = 0;

    for (let i = 0; i < N; i += 1) {
      const player = generateCommonDemoStats(`bal-v2-${i}`);
      const r = simulateDemoBattle({
        seed: `battle-v2-${i}`,
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
      if (r.recoveryEvents > 0) battlesWithRecovery += 1;
      durationSum += r.durationMs;
    }

    const winRate = wins / N;
    // Overall Common distribution ~69–75%
    expect(winRate).toBeGreaterThanOrEqual(0.69);
    expect(winRate).toBeLessThanOrEqual(0.75);

    const cornerN = 50_000;
    const minWins = Array.from({ length: cornerN }, (_, i) =>
      simulateDemoBattle({
        seed: `min-v2-${i}`,
        player: minCommonStats(),
        opponent,
      }),
    ).filter((r) => r.outcome === 'victory').length;
    const minRate = minWins / cornerN;
    expect(minRate).toBeGreaterThanOrEqual(0.58);
    expect(minRate).toBeLessThanOrEqual(0.62);

    const maxWins = Array.from({ length: cornerN }, (_, i) =>
      simulateDemoBattle({
        seed: `max-v2-${i}`,
        player: maxCommonStats(),
        opponent,
      }),
    ).filter((r) => r.outcome === 'victory').length;
    const maxRate = maxWins / cornerN;
    expect(maxRate).toBeGreaterThanOrEqual(0.82);
    expect(maxRate).toBeLessThanOrEqual(0.86);
    expect(maxRate).toBeGreaterThan(minRate);

    const avgWins = Array.from({ length: cornerN }, (_, i) =>
      simulateDemoBattle({
        seed: `avg-v2-${i}`,
        player: averageCommonStats(),
        opponent,
      }),
    ).filter((r) => r.outcome === 'victory').length;
    const avgRate = avgWins / cornerN;
    expect(avgRate).toBeGreaterThanOrEqual(0.69);
    expect(avgRate).toBeLessThanOrEqual(0.75);

    // Preset coverage
    const presetRates: Record<string, number> = {};
    for (const preset of DEMO_ARMZ_PRESETS) {
      let pWins = 0;
      const samples = 10_000;
      for (let i = 0; i < samples; i += 1) {
        const player = generateCommonDemoStats(`${preset.key}-v2-${i}`);
        const r = simulateDemoBattle({
          seed: `${preset.key}-b-v2-${i}`,
          player,
          opponent,
        });
        if (r.outcome === 'victory') pWins += 1;
      }
      const rate = pWins / samples;
      presetRates[preset.key] = rate;
      expect(rate).toBeGreaterThan(0.6);
      expect(rate).toBeLessThan(0.85);
    }

    const recoveryBattleRate = battlesWithRecovery / N;
    expect(recoveryBattleRate).toBeGreaterThanOrEqual(0.02);
    expect(recoveryBattleRate).toBeLessThanOrEqual(0.05);
    expect(crits / N).toBeGreaterThan(0);
    expect(durationSum / N).toBeGreaterThan(8_000);
    expect(rewardCount).toBe(wins);
    if (rewardCount > 0) {
      const avgReward = rewardSum / rewardCount;
      expect(avgReward).toBeGreaterThanOrEqual(1_000_000);
      expect(avgReward).toBeLessThanOrEqual(2_000_000);
    }

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        configurationVersion: DEMO_CONFIG_VERSION,
        n: N,
        winRate,
        minRate,
        avgRate,
        maxRate,
        presetRates,
        avgDurationMs: Math.round(durationSum / N),
        criticalPerBattle: crits / N,
        recoveryPerBattle: recoveries / N,
        recoveryBattleRate,
        avgRewardMicros: rewardCount ? Math.round(rewardSum / rewardCount) : 0,
        previousWinRateApprox: 0.7072,
        previousMinRateApprox: 0.521,
        previousMaxRateApprox: 0.866,
        previousRecoveryPerBattleApprox: 0.003,
      }),
    );
  }, 300_000);
});
