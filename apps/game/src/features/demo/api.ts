import { loadClientEnv } from '@armz-clash/config';

export type DemoPublicPayload = {
  demoModeEnabled: boolean;
  session: {
    demoSessionId: string;
    expiresAt: string;
    expired: boolean;
    battlesPlayed: number;
    maxBattles: number;
    battlesRemaining: number;
    demoRewardUnitsTotal: number;
    demoRewardDisplay: string;
    replayAvailableInSeconds: number;
    resetAvailableInSeconds: number;
    configurationVersion: string;
    simulatedOnly: true;
    monetaryValue: false;
    claimable: false;
  };
  armz: DemoArmzPublic | null;
  opponent: {
    opponentKey: string;
    displayName: string;
    difficulty: 'easy';
    tagline: string;
    animationSetKey: string;
    estimatedMatchupLabel: string;
    palette: { skinTone: string; primaryCloth: string; accent: string; glove: string };
  };
  labels: Record<string, string>;
};

export type DemoArmzPublic = {
  demoArmzId: string;
  presetKey: string;
  displayName: string;
  rarity: 'common';
  level: 1;
  power: number;
  grip: number;
  technique: number;
  endurance: number;
  defense: number;
  speed: number;
  luck: number;
  criticalChance: number;
  cosmeticVariant: string;
  animationSetKey: string;
  temporary: true;
  transferable: false;
  claimable: false;
  blockchainAsset: false;
  createdAt: string;
  expiresAt: string;
  demoSessionId: string;
  palette: { skinTone: string; primaryCloth: string; accent: string; glove: string } | null;
  tagline: string;
};

export type DemoBattlePayload = {
  battleId: string;
  outcome: 'victory' | 'defeat';
  durationMs: number;
  playerFinalStrength: number;
  opponentFinalStrength: number;
  timeline: Array<{
    index: number;
    type: string;
    startMs: number;
    durationMs: number;
    playerStrengthBefore: number;
    playerStrengthAfter: number;
    opponentStrengthBefore: number;
    opponentStrengthAfter: number;
    intensity: number;
    animationCue: string;
    soundCue: string;
    vfxCue: string;
    side?: string;
  }>;
  reward: {
    demoUnits: number;
    display: string;
    simulated: true;
    noMonetaryValue: true;
    notClaimable: true;
    notWithdrawable: true;
  } | null;
  armz: DemoArmzPublic;
  session: DemoPublicPayload['session'];
  opponent: DemoPublicPayload['opponent'];
  labels: Record<string, string>;
};

function apiBase(): string {
  return (loadClientEnv().NEXT_PUBLIC_ARMZ_API_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
}

async function demoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!res.ok) {
    throw Object.assign(new Error(data.message || data.error || `Request failed (${res.status})`), {
      status: res.status,
      code: data.error,
      data,
    });
  }
  return data;
}

export const demoApi = {
  startSession() {
    return demoFetch<DemoPublicPayload & { isNew: boolean }>('/api/v1/demo/session', {
      method: 'POST',
      body: '{}',
    });
  },
  getSession() {
    return demoFetch<DemoPublicPayload>('/api/v1/demo/session');
  },
  resetArmz() {
    return demoFetch<DemoPublicPayload>('/api/v1/demo/armz/reset', { method: 'POST', body: '{}' });
  },
  startBattle(input: { idempotencyKey: string; reducedMotion?: boolean }) {
    return demoFetch<DemoBattlePayload>('/api/v1/demo/battle', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  history() {
    return demoFetch<{
      history: Array<{
        battleId: string;
        opponent: string;
        outcome: string;
        durationMs: number;
        demoRewardDisplay: string | null;
        playedAt: string;
      }>;
    }>('/api/v1/demo/history');
  },
  config() {
    return demoFetch<{ demoModeEnabled: boolean }>('/api/v1/demo/config');
  },
};
