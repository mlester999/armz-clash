/**
 * Demo Mode persistence — explicit modes only.
 * No silent database → memory fallback.
 *
 * Modes:
 * - database: hosted/dev with Supabase (fail closed on errors)
 * - memory-test: CI / unit isolation (explicit)
 * - memory-development: local only when explicitly configured
 */

import { randomUUID } from 'node:crypto';
import { demoPersistencePublicLabel, type DemoPersistenceMode } from '@armz-clash/config';
import {
  assertDemoDatabaseConfigured,
  resolveDemoPersistenceMode,
} from '@armz-clash/config/demo-server';
import { getServiceDb } from '../lib/db';

export type DemoSessionRow = {
  id: string;
  token_hash: string;
  player_id: string | null;
  battles_played: number;
  max_battles: number;
  demo_reward_units_total: number;
  last_battle_at: string | null;
  next_battle_available_at: string | null;
  last_armz_reset_at: string | null;
  next_armz_reset_available_at: string | null;
  expires_at: string;
  revoked_at: string | null;
  configuration_version: string;
  created_at: string;
  updated_at: string;
};

export type DemoArmzRow = {
  id: string;
  demo_session_id: string;
  preset_key: string;
  display_name: string;
  rarity: 'common';
  level: 1;
  power: number;
  grip: number;
  technique: number;
  endurance: number;
  defense: number;
  speed: number;
  luck: number;
  critical_chance_bps: number;
  cosmetic_variant: string;
  animation_set_key: string;
  temporary: true;
  transferable: false;
  claimable: false;
  blockchain_asset: false;
  is_active: boolean;
  created_at: string;
  expires_at: string;
};

export type DemoBattleRow = {
  id: string;
  demo_session_id: string;
  demo_armz_id: string;
  opponent_key: string;
  opponent_display_name: string;
  difficulty: 'easy';
  outcome: 'victory' | 'defeat';
  player_final_strength: number;
  opponent_final_strength: number;
  duration_ms: number;
  critical_events: number;
  recovery_events: number;
  configuration_version: string;
  timeline: unknown;
  player_stats_snapshot: unknown;
  opponent_stats_snapshot: unknown;
  idempotency_key: string;
  battle_seed_hash: string;
  demo_reward_units: number | null;
  created_at: string;
};

export type DemoStorageHealth = {
  mode: DemoPersistenceMode;
  publicLabel: string;
  healthy: boolean;
  detail: string;
};

const mem = {
  sessions: new Map<string, DemoSessionRow>(),
  armz: new Map<string, DemoArmzRow>(),
  battles: new Map<string, DemoBattleRow>(),
  rewards: new Map<
    string,
    { id: string; demo_session_id: string; demo_battle_id: string; demo_units: number }
  >(),
};

let cachedMode: DemoPersistenceMode | null = null;
let lastHealth: DemoStorageHealth | null = null;

export function getDemoPersistenceMode(): DemoPersistenceMode {
  if (!cachedMode) {
    cachedMode = resolveDemoPersistenceMode();
  }
  return cachedMode;
}

/** Test helper — reset mode cache between unit tests. */
export function resetDemoPersistenceCacheForTests(): void {
  cachedMode = null;
  lastHealth = null;
}

function useMemory(): boolean {
  const mode = getDemoPersistenceMode();
  return mode === 'memory-test' || mode === 'memory-development';
}

export function isDemoStoreMemory(): boolean {
  return useMemory();
}

export function getDemoStorageHealthSnapshot(): DemoStorageHealth {
  if (lastHealth) return lastHealth;
  const mode = getDemoPersistenceMode();
  return {
    mode,
    publicLabel: demoPersistencePublicLabel(mode),
    healthy: mode !== 'database' ? true : false,
    detail: mode === 'database' ? 'not probed yet' : 'memory mode active',
  };
}

/**
 * Probe demo persistence. In database mode, missing tables/config fail closed.
 * Never switches to memory on failure.
 */
export async function probeDemoStorageHealth(): Promise<DemoStorageHealth> {
  const mode = getDemoPersistenceMode();
  const publicLabel = demoPersistencePublicLabel(mode);

  if (mode === 'memory-test' || mode === 'memory-development') {
    lastHealth = {
      mode,
      publicLabel,
      healthy: true,
      detail: 'In-process memory (explicit non-production mode)',
    };
    return lastHealth;
  }

  try {
    assertDemoDatabaseConfigured();
  } catch (error) {
    lastHealth = {
      mode,
      publicLabel,
      healthy: false,
      detail: error instanceof Error ? error.message : 'Database configuration missing',
    };
    return lastHealth;
  }

  try {
    const db = getServiceDb();
    const { error } = await db.from('demo_sessions').select('id').limit(1);
    if (error) {
      lastHealth = {
        mode,
        publicLabel,
        healthy: false,
        detail: 'Demo tables unavailable or not migrated',
      };
      return lastHealth;
    }
    lastHealth = {
      mode,
      publicLabel,
      healthy: true,
      detail: 'Demo sessions table reachable',
    };
    return lastHealth;
  } catch {
    lastHealth = {
      mode,
      publicLabel,
      healthy: false,
      detail: 'Database connection failed',
    };
    return lastHealth;
  }
}

function rethrowDb(error: unknown): never {
  const msg = String((error as { message?: string })?.message ?? error ?? 'demo_store_error');
  throw Object.assign(new Error(msg), {
    statusCode: 503,
    code: 'demo_persistence_unavailable',
  });
}

export async function insertDemoSession(
  row: Omit<DemoSessionRow, 'id' | 'created_at' | 'updated_at'> & { id?: string },
): Promise<DemoSessionRow> {
  const now = new Date().toISOString();
  const full: DemoSessionRow = {
    id: row.id ?? randomUUID(),
    token_hash: row.token_hash,
    player_id: row.player_id,
    battles_played: row.battles_played,
    max_battles: row.max_battles,
    demo_reward_units_total: row.demo_reward_units_total,
    last_battle_at: row.last_battle_at,
    next_battle_available_at: row.next_battle_available_at,
    last_armz_reset_at: row.last_armz_reset_at,
    next_armz_reset_available_at: row.next_armz_reset_available_at,
    expires_at: row.expires_at,
    revoked_at: row.revoked_at,
    configuration_version: row.configuration_version,
    created_at: now,
    updated_at: now,
  };
  if (useMemory()) {
    mem.sessions.set(full.id, full);
    return full;
  }
  try {
    const db = getServiceDb();
    const { data, error } = await db.from('demo_sessions').insert(full).select('*').single();
    if (error) throw error;
    return data as DemoSessionRow;
  } catch (error) {
    rethrowDb(error);
  }
}

export async function findDemoSessionByTokenHash(
  tokenHash: string,
): Promise<DemoSessionRow | null> {
  if (useMemory()) {
    for (const s of mem.sessions.values()) {
      if (s.token_hash === tokenHash && !s.revoked_at) return s;
    }
    return null;
  }
  try {
    const db = getServiceDb();
    const { data, error } = await db
      .from('demo_sessions')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('revoked_at', null)
      .maybeSingle();
    if (error) throw error;
    return (data as DemoSessionRow) ?? null;
  } catch (error) {
    rethrowDb(error);
  }
}

export async function updateDemoSession(
  id: string,
  patch: Partial<DemoSessionRow>,
): Promise<DemoSessionRow> {
  if (useMemory()) {
    const cur = mem.sessions.get(id);
    if (!cur) throw new Error('demo_session_not_found');
    const next = { ...cur, ...patch, updated_at: new Date().toISOString() };
    mem.sessions.set(id, next);
    return next;
  }
  try {
    const db = getServiceDb();
    const { data, error } = await db
      .from('demo_sessions')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as DemoSessionRow;
  } catch (error) {
    rethrowDb(error);
  }
}

export async function insertDemoArmz(
  row: Omit<DemoArmzRow, 'id' | 'created_at'> & { id?: string },
): Promise<DemoArmzRow> {
  const full: DemoArmzRow = {
    id: row.id ?? randomUUID(),
    demo_session_id: row.demo_session_id,
    preset_key: row.preset_key,
    display_name: row.display_name,
    rarity: 'common',
    level: 1,
    power: row.power,
    grip: row.grip,
    technique: row.technique,
    endurance: row.endurance,
    defense: row.defense,
    speed: row.speed,
    luck: row.luck,
    critical_chance_bps: row.critical_chance_bps,
    cosmetic_variant: row.cosmetic_variant,
    animation_set_key: row.animation_set_key,
    temporary: true,
    transferable: false,
    claimable: false,
    blockchain_asset: false,
    is_active: row.is_active,
    created_at: new Date().toISOString(),
    expires_at: row.expires_at,
  };
  if (useMemory()) {
    mem.armz.set(full.id, full);
    return full;
  }
  try {
    const db = getServiceDb();
    const { data, error } = await db.from('demo_armz').insert(full).select('*').single();
    if (error) throw error;
    return data as DemoArmzRow;
  } catch (error) {
    rethrowDb(error);
  }
}

export async function findActiveDemoArmz(sessionId: string): Promise<DemoArmzRow | null> {
  if (useMemory()) {
    for (const a of mem.armz.values()) {
      if (a.demo_session_id === sessionId && a.is_active) return a;
    }
    return null;
  }
  try {
    const db = getServiceDb();
    const { data, error } = await db
      .from('demo_armz')
      .select('*')
      .eq('demo_session_id', sessionId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return (data as DemoArmzRow) ?? null;
  } catch (error) {
    rethrowDb(error);
  }
}

export async function deactivateDemoArmz(sessionId: string): Promise<void> {
  if (useMemory()) {
    for (const [id, a] of mem.armz) {
      if (a.demo_session_id === sessionId && a.is_active) {
        mem.armz.set(id, { ...a, is_active: false });
      }
    }
    return;
  }
  try {
    const db = getServiceDb();
    const { error } = await db
      .from('demo_armz')
      .update({ is_active: false })
      .eq('demo_session_id', sessionId)
      .eq('is_active', true);
    if (error) throw error;
  } catch (error) {
    rethrowDb(error);
  }
}

export async function insertDemoBattle(
  row: Omit<DemoBattleRow, 'id' | 'created_at'> & { id?: string },
): Promise<DemoBattleRow> {
  const full: DemoBattleRow = {
    id: row.id ?? randomUUID(),
    ...row,
    created_at: new Date().toISOString(),
  } as DemoBattleRow;
  if (useMemory()) {
    mem.battles.set(full.id, full);
    return full;
  }
  try {
    const db = getServiceDb();
    const { data, error } = await db.from('demo_battles').insert(full).select('*').single();
    if (error) throw error;
    return data as DemoBattleRow;
  } catch (error) {
    rethrowDb(error);
  }
}

export async function findDemoBattleByIdempotency(
  sessionId: string,
  idempotencyKey: string,
): Promise<DemoBattleRow | null> {
  if (useMemory()) {
    for (const b of mem.battles.values()) {
      if (b.demo_session_id === sessionId && b.idempotency_key === idempotencyKey) return b;
    }
    return null;
  }
  try {
    const db = getServiceDb();
    const { data, error } = await db
      .from('demo_battles')
      .select('*')
      .eq('demo_session_id', sessionId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (error) throw error;
    return (data as DemoBattleRow) ?? null;
  } catch (error) {
    rethrowDb(error);
  }
}

export async function listDemoBattles(sessionId: string, limit = 20): Promise<DemoBattleRow[]> {
  if (useMemory()) {
    return [...mem.battles.values()]
      .filter((b) => b.demo_session_id === sessionId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
  try {
    const db = getServiceDb();
    const { data, error } = await db
      .from('demo_battles')
      .select('*')
      .eq('demo_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as DemoBattleRow[]) ?? [];
  } catch (error) {
    rethrowDb(error);
  }
}

export async function insertDemoRewardEvent(input: {
  demo_session_id: string;
  demo_battle_id: string;
  demo_units: number;
}): Promise<void> {
  if (useMemory()) {
    mem.rewards.set(input.demo_battle_id, {
      id: randomUUID(),
      ...input,
    });
    return;
  }
  try {
    const db = getServiceDb();
    const { error } = await db.from('demo_reward_events').insert({
      demo_session_id: input.demo_session_id,
      demo_battle_id: input.demo_battle_id,
      demo_units: input.demo_units,
      monetary_value: false,
      claimable: false,
      withdrawable: false,
      transferable: false,
      simulated: true,
    });
    if (error) throw error;
  } catch (error) {
    rethrowDb(error);
  }
}

export async function cleanupExpiredDemoSessions(now = new Date()): Promise<number> {
  const iso = now.toISOString();
  if (useMemory()) {
    let n = 0;
    for (const [id, s] of mem.sessions) {
      if (s.expires_at < iso || s.revoked_at) {
        mem.sessions.delete(id);
        n += 1;
      }
    }
    return n;
  }
  try {
    const db = getServiceDb();
    const { data, error } = await db
      .from('demo_sessions')
      .delete()
      .lt('expires_at', iso)
      .select('id');
    if (error) throw error;
    return data?.length ?? 0;
  } catch (error) {
    rethrowDb(error);
  }
}
