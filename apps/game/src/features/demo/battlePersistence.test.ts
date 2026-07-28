import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DemoBattlePayload } from './api';
import { hasTruthfulFinalState, readStoredBattle, saveStoredBattle } from './battlePersistence';

const STORAGE_KEY = 'armz-clash:phase3-4:last-battle';

function battle(
  outcome: DemoBattlePayload['outcome'],
  playerFinalStrength: number,
  opponentFinalStrength: number,
): DemoBattlePayload {
  return { outcome, playerFinalStrength, opponentFinalStrength } as DemoBattlePayload;
}

function storedBattle(sessionId = 'session-a'): DemoBattlePayload {
  return {
    ...battle('victory', 24, 0),
    battleId: 'battle-a',
    timeline: [],
    session: { demoSessionId: sessionId },
  } as unknown as DemoBattlePayload;
}

function stubSessionStorage() {
  const values = new Map<string, string>();
  const sessionStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  vi.stubGlobal('window', { sessionStorage });
  return { sessionStorage, values };
}

describe('Phase 3.4 completed-battle persistence integrity', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('accepts only truthful victory finals', () => {
    expect(hasTruthfulFinalState(battle('victory', 24, 0))).toBe(true);
    expect(hasTruthfulFinalState(battle('victory', 0, 24))).toBe(false);
    expect(hasTruthfulFinalState(battle('victory', 0, 0))).toBe(false);
  });

  it('accepts only truthful defeat finals', () => {
    expect(hasTruthfulFinalState(battle('defeat', 0, 31))).toBe(true);
    expect(hasTruthfulFinalState(battle('defeat', 31, 0))).toBe(false);
    expect(hasTruthfulFinalState(battle('defeat', 0, 0))).toBe(false);
  });

  it('restores a truthful completed result only for the current demo session', () => {
    stubSessionStorage();
    saveStoredBattle(storedBattle(), true);

    expect(readStoredBattle('session-a')).toMatchObject({
      resultReady: true,
      battle: { battleId: 'battle-a', outcome: 'victory' },
    });
    expect(readStoredBattle('session-b')).toBeNull();
  });

  it('rejects malformed or impossible stored results', () => {
    const { sessionStorage, values } = stubSessionStorage();
    sessionStorage.setItem(STORAGE_KEY, '{not-json');
    expect(readStoredBattle('session-a')).toBeNull();
    expect(values.has(STORAGE_KEY)).toBe(false);

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        battle: { ...storedBattle(), opponentFinalStrength: 22 },
        resultReady: true,
      }),
    );
    expect(readStoredBattle('session-a')).toBeNull();
    expect(values.has(STORAGE_KEY)).toBe(false);
  });
});
