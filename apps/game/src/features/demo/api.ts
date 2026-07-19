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

export type DemoApiError = Error & {
  status?: number;
  code?: string;
  correlationId?: string;
  kind: 'network' | 'api' | 'parse';
  apiBase: string;
};

export function resolveDemoApiBase(override?: string): string {
  const fromEnv = (override ?? loadClientEnv().NEXT_PUBLIC_ARMZ_API_URL ?? '').trim();
  const base = fromEnv || 'http://127.0.0.1:4000';
  return base.replace(/\/$/, '');
}

function apiBase(): string {
  return resolveDemoApiBase();
}

function correlationFromResponse(res: Response, body: Record<string, unknown>): string | undefined {
  const header =
    res.headers.get('x-correlation-id') || res.headers.get('x-request-id') || undefined;
  const fromBody =
    typeof body.correlationId === 'string'
      ? body.correlationId
      : typeof body.requestId === 'string'
        ? body.requestId
        : undefined;
  return header || fromBody || undefined;
}

function formatNetworkError(base: string, cause?: unknown): DemoApiError {
  const causeMsg =
    cause instanceof Error && cause.message && cause.message !== 'Failed to fetch'
      ? ` (${cause.message})`
      : '';
  const err = new Error(
    `The Armz Clash API could not be reached at ${base}. Make sure the API service is running (pnpm dev:api).${causeMsg}`,
  ) as DemoApiError;
  err.kind = 'network';
  err.apiBase = base;
  err.code = 'api_unreachable';
  return err;
}

async function demoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = apiBase();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch (cause) {
    throw formatNetworkError(base, cause);
  }

  const data = (await res.json().catch(() => ({}))) as T & {
    error?: string;
    message?: string;
    correlationId?: string;
    requestId?: string;
  };
  if (!res.ok) {
    const correlationId = correlationFromResponse(res, data as Record<string, unknown>);
    const baseMessage = data.message || data.error || `Request failed (${res.status})`;
    const withCorrelation = correlationId
      ? `${baseMessage} (correlation: ${correlationId})`
      : baseMessage;
    const err = new Error(withCorrelation) as DemoApiError;
    err.status = res.status;
    err.code = data.error;
    err.correlationId = correlationId;
    err.kind = 'api';
    err.apiBase = base;
    throw err;
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
