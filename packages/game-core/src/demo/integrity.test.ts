import { describe, expect, it } from 'vitest';
import { simulateDemoBattle } from './combat';
import { EASY_DEMO_OPPONENT } from './opponent';
import { averageCommonStats, generateCommonDemoStats, minCommonStats } from './stats';

describe('Phase 3.3 result integrity', () => {
  it('victory always produces opponent end Control = 0', () => {
    for (let i = 0; i < 5000; i += 1) {
      const r = simulateDemoBattle({
        seed: `integrity-v-${i}`,
        player: generateCommonDemoStats(`integrity-v-${i}`),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      if (r.outcome === 'victory') {
        expect(r.opponentFinalStrength).toBe(0);
        expect(r.playerFinalStrength).toBeGreaterThan(0);
      }
    }
  });

  it('defeat always produces player end Control = 0', () => {
    for (let i = 0; i < 5000; i += 1) {
      const r = simulateDemoBattle({
        seed: `integrity-d-${i}`,
        player: generateCommonDemoStats(`integrity-d-${i}`),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      if (r.outcome === 'defeat') {
        expect(r.playerFinalStrength).toBe(0);
        expect(r.opponentFinalStrength).toBeGreaterThan(0);
      }
    }
  });

  it('final_slam event is present and zeros the loser', () => {
    for (let i = 0; i < 2000; i += 1) {
      const r = simulateDemoBattle({
        seed: `integrity-slam-${i}`,
        player: averageCommonStats(),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      const slam = r.timeline.find((e) => e.type === 'final_slam');
      expect(slam).toBeDefined();
      if (r.outcome === 'victory') {
        expect(slam!.opponentStrengthAfter).toBe(0);
        expect(slam!.playerStrengthAfter).toBeGreaterThan(0);
      } else {
        expect(slam!.playerStrengthAfter).toBe(0);
        expect(slam!.opponentStrengthAfter).toBeGreaterThan(0);
      }
    }
  });

  it('final_slam is the last damage event before result reveal', () => {
    const r = simulateDemoBattle({
      seed: 'integrity-order-1',
      player: averageCommonStats(),
      opponent: EASY_DEMO_OPPONENT.stats,
    });
    const slamIdx = r.timeline.findIndex((e) => e.type === 'final_slam');
    expect(slamIdx).toBeGreaterThan(0);
    // No damage events after final_slam
    const afterSlam = r.timeline.slice(slamIdx + 1);
    const damageAfter = afterSlam.filter(
      (e) =>
        e.playerStrengthAfter !== e.playerStrengthBefore ||
        e.opponentStrengthAfter !== e.opponentStrengthBefore,
    );
    expect(damageAfter).toHaveLength(0);
  });

  it('battle duration is within 8-14s for standard battles', () => {
    let totalDuration = 0;
    let maxDuration = 0;
    const N = 1000;
    for (let i = 0; i < N; i += 1) {
      const r = simulateDemoBattle({
        seed: `integrity-dur-${i}`,
        player: generateCommonDemoStats(`integrity-dur-${i}`),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      totalDuration += r.durationMs;
      maxDuration = Math.max(maxDuration, r.durationMs);
    }
    const avg = totalDuration / N;
    expect(avg).toBeGreaterThanOrEqual(8000);
    expect(avg).toBeLessThanOrEqual(12000);
    expect(maxDuration).toBeLessThanOrEqual(14000);
  });

  it('grip lock occurs within first 2.5 seconds', () => {
    for (let i = 0; i < 500; i += 1) {
      const r = simulateDemoBattle({
        seed: `integrity-grip-${i}`,
        player: generateCommonDemoStats(`integrity-grip-${i}`),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      const grip = r.timeline.find((e) => e.type === 'hands_locked');
      expect(grip).toBeDefined();
      // Grip lock should start by ~1.7s (intro 400 + approach 700 = 1100, grip starts at 1100)
      expect(grip!.startMs).toBeLessThanOrEqual(2500);
    }
  });

  it('active struggle (first push) begins within ~3.5 seconds', () => {
    for (let i = 0; i < 500; i += 1) {
      const r = simulateDemoBattle({
        seed: `integrity-struggle-${i}`,
        player: generateCommonDemoStats(`integrity-struggle-${i}`),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      // A push may be retyped to 'critical' when it crits
      const firstPush = r.timeline.find(
        (e) => e.type === 'player_push' || e.type === 'opponent_push' || e.type === 'critical',
      );
      expect(firstPush).toBeDefined();
      // Pre-action: intro(400) + approach(700) + grip(600) + countdown(500) = 2200ms
      expect(firstPush!.startMs).toBeLessThanOrEqual(3500);
    }
  });

  it('reduced motion produces shorter battles', () => {
    const normal = simulateDemoBattle({
      seed: 'integrity-rm-1',
      player: averageCommonStats(),
      opponent: EASY_DEMO_OPPONENT.stats,
    });
    const reduced = simulateDemoBattle({
      seed: 'integrity-rm-1',
      player: averageCommonStats(),
      opponent: EASY_DEMO_OPPONENT.stats,
      reducedMotion: true,
    });
    expect(reduced.durationMs).toBeLessThan(normal.durationMs);
    // Same outcome regardless of motion setting
    expect(reduced.outcome).toBe(normal.outcome);
  });

  it('min stats still produce valid integrity (no zero-zero)', () => {
    for (let i = 0; i < 1000; i += 1) {
      const r = simulateDemoBattle({
        seed: `integrity-min-${i}`,
        player: minCommonStats(),
        opponent: EASY_DEMO_OPPONENT.stats,
      });
      // Exactly one side must be zero
      const zeros = [r.playerFinalStrength === 0, r.opponentFinalStrength === 0].filter(
        Boolean,
      ).length;
      expect(zeros).toBe(1);
    }
  });
});
