import type { DemoCombatStats } from './stats';

export type DemoOpponentKey = 'practice_automaton';

export type DemoOpponent = {
  opponentKey: DemoOpponentKey;
  displayName: string;
  difficulty: 'easy';
  tagline: string;
  animationSetKey: string;
  stats: DemoCombatStats;
  configurationVersion: string;
  /** Procedural colors */
  skinTone: string;
  primaryCloth: string;
  accent: string;
  glove: string;
};

/**
 * Easy opponent tuned so average Common ARMZ wins ~68–76%.
 * Still capable of defeating weak rolls.
 */
export const EASY_DEMO_OPPONENT: DemoOpponent = {
  opponentKey: 'practice_automaton',
  displayName: 'Practice Automaton',
  difficulty: 'easy',
  tagline: 'Armored training arm of the Arena — firm, fair, and never real currency.',
  animationSetKey: 'easy_opponent_v1',
  configurationVersion: 'demo-combat-v1',
  // Tuned near average Common totals so min can still win ~55%+ and max ~85%.
  stats: {
    power: 42,
    grip: 42,
    technique: 39,
    endurance: 45,
    defense: 38,
    speed: 39,
    luck: 17,
    criticalChance: 500,
  },
  skinTone: '6a7380',
  primaryCloth: '2a3140',
  accent: '5b8def',
  glove: '8a93a0',
};

export function getEasyDemoOpponent(): DemoOpponent {
  return EASY_DEMO_OPPONENT;
}
