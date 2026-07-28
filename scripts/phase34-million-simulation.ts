import {
  EASY_DEMO_OPPONENT,
  generateCommonDemoStats,
  simulateDemoBattle,
} from '@armz-clash/game-core';

const iterations = 1_000_000;
let victories = 0;
let defeats = 0;
let durationTotal = 0;
let minDuration = Number.POSITIVE_INFINITY;
let maxDuration = 0;
let integrityFailures = 0;
let gripTimingFailures = 0;

for (let index = 0; index < iterations; index += 1) {
  const seed = `phase34-million-${index}`;
  const result = simulateDemoBattle({
    seed,
    player: generateCommonDemoStats(`${seed}:rookie_brawler`),
    opponent: EASY_DEMO_OPPONENT.stats,
  });
  if (result.outcome === 'victory') victories += 1;
  else defeats += 1;
  durationTotal += result.durationMs;
  minDuration = Math.min(minDuration, result.durationMs);
  maxDuration = Math.max(maxDuration, result.durationMs);
  const truthful =
    result.outcome === 'victory'
      ? result.opponentFinalStrength === 0 && result.playerFinalStrength > 0
      : result.playerFinalStrength === 0 && result.opponentFinalStrength > 0;
  if (!truthful) integrityFailures += 1;
  const grip = result.timeline.find((event) => event.type === 'hands_locked');
  if (!grip || grip.startMs > 2_500) gripTimingFailures += 1;
}

const averageDurationMs = durationTotal / iterations;
const report = {
  iterations,
  victories,
  defeats,
  winRate: victories / iterations,
  averageDurationMs,
  minDurationMs: minDuration,
  maxDurationMs: maxDuration,
  integrityFailures,
  gripTimingFailures,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

if (
  integrityFailures !== 0 ||
  gripTimingFailures !== 0 ||
  averageDurationMs < 8_000 ||
  averageDurationMs > 12_000 ||
  maxDuration > 14_000
) {
  process.exitCode = 1;
}
