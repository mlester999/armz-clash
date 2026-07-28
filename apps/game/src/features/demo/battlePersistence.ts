import type { DemoBattlePayload } from './api';

const STORAGE_KEY = 'armz-clash:phase3-4:last-battle';

export type StoredDemoBattle = {
  battle: DemoBattlePayload;
  resultReady: boolean;
};

export function hasTruthfulFinalState(battle: DemoBattlePayload): boolean {
  return battle.outcome === 'victory'
    ? battle.opponentFinalStrength === 0 && battle.playerFinalStrength > 0
    : battle.playerFinalStrength === 0 && battle.opponentFinalStrength > 0;
}

function isStoredDemoBattle(value: unknown): value is StoredDemoBattle {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredDemoBattle>;
  const battle = candidate.battle as Partial<DemoBattlePayload> | undefined;
  return Boolean(
    battle &&
    typeof battle.battleId === 'string' &&
    (battle.outcome === 'victory' || battle.outcome === 'defeat') &&
    typeof battle.playerFinalStrength === 'number' &&
    typeof battle.opponentFinalStrength === 'number' &&
    Array.isArray(battle.timeline) &&
    typeof candidate.resultReady === 'boolean' &&
    hasTruthfulFinalState(battle as DemoBattlePayload),
  );
}

export function saveStoredBattle(battle: DemoBattlePayload, resultReady = false): void {
  if (typeof window === 'undefined' || !hasTruthfulFinalState(battle)) return;
  const stored: StoredDemoBattle = { battle, resultReady };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function markStoredBattleResultReady(battle: DemoBattlePayload): void {
  saveStoredBattle(battle, true);
}

export function readStoredBattle(demoSessionId: string): StoredDemoBattle | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredDemoBattle(parsed)) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (parsed.battle.session.demoSessionId !== demoSessionId) return null;
    return parsed;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearStoredBattle(): void {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
}
