/**
 * Server-authoritative Easy demo battle engine.
 * Integer math for combat power; deterministic timeline from seed.
 *
 * Balance targets (demo-combat-v3, 1M sims):
 * - Average Common roll: 69–75% win vs Easy
 * - Min Common stats: 58–62%
 * - Max Common stats: 82–86%
 * - Recovery: ~2–5% of battles (at most once)
 *
 * Phase 3.3 pacing targets:
 * - Grip lock by ~2.2s
 * - Active struggle by ~2.8s
 * - Total battle 8–12s (max 14s)
 * - Loser Control reaches 0 at final_slam
 */

import type { DemoCombatStats } from './stats';
import { createSeededRng } from './rng';
import {
  DEMO_ARMZ_MICRO,
  STRENGTH_MAX,
  type AnimationCue,
  type BattleTimelineEvent,
  type DemoBattleResult,
  type SimulatedDemoReward,
  type SoundCue,
  type VfxCue,
} from './timeline';
import { DEMO_CONFIG_VERSION } from './stats';

/** Phase 3.3 pacing: compressed pre-action sequence */
const TIMING = {
  intro: 400,
  approach: 700,
  gripLock: 600,
  countdown: 500,
  pushLight: 480,
  pushHeavy: 620,
  counter: 420,
  recovery: 520,
  fatigue: 320,
  struggle: 260,
  finalStruggle: 650,
  finalSlam: 950,
  resultReveal: 850,
  rewardReveal: 750,
  complete: 300,
} as const;

function clampStrength(v: number): number {
  return Math.max(0, Math.min(STRENGTH_MAX, Math.round(v)));
}

export function offensiveRating(s: DemoCombatStats): number {
  return s.power * 3 + s.grip * 2 + s.technique * 2 + s.speed + s.luck;
}

export function defensiveRating(s: DemoCombatStats): number {
  return s.defense * 3 + s.endurance * 2 + s.grip + s.technique;
}

export function totalCombatRating(s: DemoCombatStats): number {
  return (
    offensiveRating(s) + Math.floor(defensiveRating(s) / 2) + Math.floor(s.criticalChance / 50)
  );
}

/**
 * Map rating delta → win-chance contribution (bps).
 * Calibrated so Common min/avg/max land near 60% / 72% / 84%.
 * Integer-only; soft clamps keep extremes inside product bands.
 */
export function compressRatingDelta(delta: number): number {
  // ~12 bps per rating point; cap tails so no auto-win / auto-lose.
  const scaled = delta * 12;
  return Math.max(-1350, Math.min(1450, scaled));
}

/**
 * Win probability in basis points for the final contested roll.
 * Calibrated for Common ranges vs Practice Automaton (demo-combat-v2).
 */
export function easyWinChanceBps(player: DemoCombatStats, opponent: DemoCombatStats): number {
  const delta = totalCombatRating(player) - totalCombatRating(opponent);
  // Equal ratings ≈ 71.5%.
  const bps = 7150 + compressRatingDelta(delta);
  // Hard safety clamps: never auto-win, never hopeless for Common min.
  return Math.max(5800, Math.min(8600, bps));
}

function exchangeDamage(
  attacker: DemoCombatStats,
  defender: DemoCombatStats,
  rng: ReturnType<typeof createSeededRng>,
  heavy: boolean,
): { damage: number; critical: boolean } {
  const atk = offensiveRating(attacker);
  const def = defensiveRating(defender);
  // Phase 3.3: higher per-exchange damage so bars drop meaningfully in fewer rounds
  const base = Math.max(5, Math.floor((atk - def / 2) / 22) + (heavy ? 6 : 4));
  let damage = base + rng.intInclusive(0, 3);
  let critical = false;
  if (rng.chanceBps(attacker.criticalChance)) {
    critical = true;
    damage = Math.floor((damage * 140) / 100) + 2;
  }
  damage = Math.max(4, damage - Math.floor(defender.endurance / 50));
  return { damage, critical };
}

/**
 * Simulate a full Easy demo battle with a deterministic timeline.
 */
export function simulateDemoBattle(input: {
  seed: string;
  player: DemoCombatStats;
  opponent: DemoCombatStats;
  reducedMotion?: boolean;
}): DemoBattleResult {
  const rng = createSeededRng(input.seed);
  const reduced = Boolean(input.reducedMotion);
  const scale = reduced ? 0.5 : 1;

  // Decide authoritative outcome first (hidden from browser until end), then stage bars to match.
  const winBps = easyWinChanceBps(input.player, input.opponent);
  const playerWins = rng.chanceBps(winBps);

  let pStr = STRENGTH_MAX;
  let oStr = STRENGTH_MAX;
  const timeline: BattleTimelineEvent[] = [];
  let t = 0;
  let criticalEvents = 0;
  let recoveryEvents = 0;
  let recoveryUsed = false;

  const emit = (
    type: BattleTimelineEvent['type'],
    durationMs: number,
    apply: () => {
      animationCue: AnimationCue;
      soundCue: SoundCue;
      vfxCue: VfxCue;
      side?: 'player' | 'opponent' | 'both';
      intensity: number;
    },
  ) => {
    const beforeP = pStr;
    const beforeO = oStr;
    const meta = apply();
    const duration = Math.max(200, Math.round(durationMs * scale));
    timeline.push({
      index: timeline.length,
      type,
      startMs: t,
      durationMs: duration,
      playerStrengthBefore: beforeP,
      playerStrengthAfter: pStr,
      opponentStrengthBefore: beforeO,
      opponentStrengthAfter: oStr,
      intensity: meta.intensity,
      animationCue: meta.animationCue,
      soundCue: meta.soundCue,
      vfxCue: meta.vfxCue,
      side: meta.side,
    });
    t += duration;
  };

  // Phase 3.3: compressed pre-action — fighters visible immediately, grip by ~2.2s
  emit('intro', TIMING.intro, () => ({
    animationCue: 'idle',
    soundCue: 'ambience_loop',
    vfxCue: 'none',
    intensity: 1000,
    side: 'both',
  }));
  emit('hands_approaching', TIMING.approach, () => ({
    animationCue: 'approach',
    soundCue: 'cloth_move',
    vfxCue: 'dust_light',
    intensity: 2500,
    side: 'both',
  }));
  emit('hands_locked', TIMING.gripLock, () => ({
    animationCue: 'grip',
    soundCue: 'hands_lock',
    vfxCue: 'grip_spark',
    intensity: 4000,
    side: 'both',
  }));
  emit('countdown', TIMING.countdown, () => ({
    animationCue: 'strain_light',
    soundCue: 'strain',
    vfxCue: 'none',
    intensity: 3000,
    side: 'both',
  }));

  // Six rounds is the hard presentation ceiling. A seventh exchange could push
  // rare counter/recovery/reward timelines beyond the accepted 14s maximum.
  const rounds = rng.intInclusive(5, 6);
  // Bias mid-fight exchanges toward the pre-rolled outcome without making bars static
  const playerLeadBias = playerWins ? 6200 : 3800;

  for (let i = 0; i < rounds; i += 1) {
    if (pStr <= 12 || oStr <= 12) break;

    const playerLeads = rng.chanceBps(playerLeadBias + input.player.speed * 5);

    if (playerLeads) {
      const heavy = rng.chanceBps(3000);
      emit('player_push', heavy ? TIMING.pushHeavy : TIMING.pushLight, () => {
        const { damage, critical } = exchangeDamage(input.player, input.opponent, rng, heavy);
        if (critical) {
          criticalEvents += 1;
        }
        oStr = clampStrength(oStr - damage);
        pStr = clampStrength(pStr - rng.intInclusive(1, 3));
        return {
          animationCue: critical ? 'critical' : heavy ? 'push_heavy' : 'push_light',
          soundCue: critical ? 'critical' : heavy ? 'impact_heavy' : 'impact_light',
          vfxCue: critical ? 'critical_flash' : heavy ? 'dust_heavy' : 'dust_light',
          intensity: critical ? 9000 : heavy ? 7000 : 5000,
          side: 'player' as const,
        };
      });
      if (timeline[timeline.length - 1]!.animationCue === 'critical') {
        timeline[timeline.length - 1]!.type = 'critical';
      }
    } else {
      const heavy = rng.chanceBps(3400);
      emit('opponent_push', heavy ? TIMING.pushHeavy : TIMING.pushLight, () => {
        const { damage, critical } = exchangeDamage(input.opponent, input.player, rng, heavy);
        if (critical) criticalEvents += 1;
        pStr = clampStrength(pStr - damage);
        oStr = clampStrength(oStr - rng.intInclusive(1, 3));
        return {
          animationCue: critical ? 'critical' : heavy ? 'push_heavy' : 'push_light',
          soundCue: critical ? 'critical' : heavy ? 'impact_heavy' : 'impact_light',
          vfxCue: critical ? 'critical_flash' : heavy ? 'dust_heavy' : 'dust_light',
          intensity: critical ? 9000 : heavy ? 7000 : 5000,
          side: 'opponent' as const,
        };
      });
      if (timeline[timeline.length - 1]!.animationCue === 'critical') {
        timeline[timeline.length - 1]!.type = 'critical';
      }
    }

    if (pStr > 15 && oStr > 15 && rng.chanceBps(2000)) {
      emit('counter', TIMING.counter, () => {
        const playerCounter = rng.chanceBps(playerLeadBias);
        const dmg = rng.intInclusive(2, 5);
        if (playerCounter) oStr = clampStrength(oStr - dmg);
        else pStr = clampStrength(pStr - dmg);
        return {
          animationCue: 'counter',
          soundCue: 'impact_light',
          vfxCue: 'energy_trail',
          intensity: 6500,
          side: playerCounter ? ('player' as const) : ('opponent' as const),
        };
      });
    }

    // Recovery: Approach A — at most once per battle, target ~3% of battles.
    // Single checkpoint at mid-fight so frequency is independent of bar state.
    // Final slam still enforces the pre-rolled winner.
    if (!recoveryUsed && i === Math.floor(rounds / 2) && rng.chanceBps(320)) {
      recoveryUsed = true;
      recoveryEvents += 1;
      emit('recovery', TIMING.recovery, () => {
        // Modest heal that never exceeds STRENGTH_MAX.
        pStr = clampStrength(Math.min(STRENGTH_MAX, pStr + rng.intInclusive(4, 8)));
        return {
          animationCue: 'recovery',
          soundCue: 'recovery',
          vfxCue: 'energy_trail',
          intensity: 5500,
          side: 'player' as const,
        };
      });
    }

    if (i === Math.floor(rounds / 2)) {
      emit('fatigue', TIMING.fatigue, () => ({
        animationCue: 'fatigue',
        soundCue: 'strain',
        vfxCue: 'none',
        intensity: 3500,
        side: 'both',
      }));
    }

    emit('struggle', TIMING.struggle, () => ({
      animationCue: 'strain_light',
      soundCue: 'table_creak',
      vfxCue: 'none',
      intensity: 3000,
      side: 'both',
    }));
  }

  emit('final_struggle', TIMING.finalStruggle, () => ({
    animationCue: 'strain_heavy',
    soundCue: 'strain',
    vfxCue: 'dust_light',
    intensity: 8000,
    side: 'both',
  }));

  // Authoritative finish — bars must match outcome
  if (playerWins) {
    oStr = 0;
    pStr = clampStrength(Math.max(pStr, 12 + rng.intInclusive(0, 20)));
  } else {
    pStr = 0;
    oStr = clampStrength(Math.max(oStr, 12 + rng.intInclusive(0, 20)));
  }

  const outcome = playerWins ? 'victory' : 'defeat';

  emit('final_slam', TIMING.finalSlam, () => ({
    animationCue: outcome === 'victory' ? 'winning_slam' : 'defeated',
    soundCue: 'final_slam',
    vfxCue: 'final_impact',
    intensity: 10000,
    side: outcome === 'victory' ? 'player' : 'opponent',
  }));

  emit(outcome === 'victory' ? 'victory' : 'defeat', TIMING.resultReveal, () => ({
    animationCue: outcome === 'victory' ? 'winning_slam' : 'defeated',
    soundCue: outcome === 'victory' ? 'victory' : 'defeat',
    vfxCue: outcome === 'victory' ? 'victory_particles' : 'defeat_particles',
    intensity: 9000,
    side: outcome === 'victory' ? 'player' : 'opponent',
  }));

  let reward: SimulatedDemoReward | null = null;
  if (outcome === 'victory') {
    const micros = rng.intInclusive(1_000_000, 2_000_000);
    reward = {
      demoUnits: micros,
      label: 'Demo $ARMZ',
      monetaryValue: false,
      claimable: false,
      withdrawable: false,
      transferable: false,
      simulated: true,
    };
    emit('reward_reveal', TIMING.rewardReveal, () => ({
      animationCue: 'idle',
      soundCue: 'reward_reveal',
      vfxCue: 'victory_particles',
      intensity: 5000,
      side: 'player',
    }));
  }

  emit('complete', TIMING.complete, () => ({
    animationCue: 'idle',
    soundCue: 'none',
    vfxCue: 'none',
    intensity: 1000,
    side: 'both',
  }));

  return {
    outcome,
    playerFinalStrength: pStr,
    opponentFinalStrength: oStr,
    durationMs: t,
    timeline,
    criticalEvents,
    recoveryEvents,
    configurationVersion: DEMO_CONFIG_VERSION,
    reward,
  };
}

export function formatDemoArmzAmount(demoUnits: number): string {
  const whole = Math.floor(demoUnits / DEMO_ARMZ_MICRO);
  const frac = Math.floor((demoUnits % DEMO_ARMZ_MICRO) / 10_000);
  return `${whole}.${String(frac).padStart(2, '0')}`;
}
