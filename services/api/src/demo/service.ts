import {
  DEMO_ARMZ_PRESETS,
  formatDemoArmzAmount,
  generateDemoArmzIdentity,
  getDemoPreset,
  getEasyDemoOpponent,
  simulateDemoBattle,
  type DemoBattleResult,
} from '@armz-clash/game-core';
import { loadDemoConfig, type DemoConfig } from '@armz-clash/config';
import { generateToken, hashToken, sha256Hex } from '../lib/crypto';
import {
  deactivateDemoArmz,
  findActiveDemoArmz,
  findDemoBattleByIdempotency,
  findDemoSessionByTokenHash,
  insertDemoArmz,
  insertDemoBattle,
  insertDemoRewardEvent,
  insertDemoSession,
  listDemoBattles,
  updateDemoSession,
  type DemoArmzRow,
  type DemoBattleRow,
  type DemoSessionRow,
} from './store';

function demoSecret(): string {
  return (
    process.env.ARMZ_DEMO_SESSION_SIGNING_SECRET ||
    process.env.ARMZ_SESSION_SIGNING_SECRET ||
    'dev-demo-session-secret-not-for-production'
  );
}

export function isDemoModeEnabled(): boolean {
  const v = process.env.ARMZ_DEMO_MODE_ENABLED;
  if (v === undefined || v === '') return true;
  return v === 'true' || v === 'TRUE' || v === 'True';
}

function publicArmz(row: DemoArmzRow) {
  const preset = getDemoPreset(row.preset_key);
  return {
    demoArmzId: row.id,
    presetKey: row.preset_key,
    displayName: row.display_name,
    rarity: row.rarity,
    level: row.level,
    power: row.power,
    grip: row.grip,
    technique: row.technique,
    endurance: row.endurance,
    defense: row.defense,
    speed: row.speed,
    luck: row.luck,
    criticalChance: row.critical_chance_bps,
    cosmeticVariant: row.cosmetic_variant,
    animationSetKey: row.animation_set_key,
    temporary: true as const,
    transferable: false as const,
    claimable: false as const,
    blockchainAsset: false as const,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    demoSessionId: row.demo_session_id,
    palette: preset
      ? {
          skinTone: preset.skinTone,
          primaryCloth: preset.primaryCloth,
          accent: preset.accent,
          glove: preset.glove,
        }
      : null,
    tagline: preset?.tagline ?? '',
  };
}

function publicSession(row: DemoSessionRow, now: Date) {
  const expired = new Date(row.expires_at).getTime() <= now.getTime();
  const nextBattle = row.next_battle_available_at
    ? Math.max(
        0,
        Math.ceil((new Date(row.next_battle_available_at).getTime() - now.getTime()) / 1000),
      )
    : 0;
  const nextReset = row.next_armz_reset_available_at
    ? Math.max(
        0,
        Math.ceil((new Date(row.next_armz_reset_available_at).getTime() - now.getTime()) / 1000),
      )
    : 0;
  return {
    demoSessionId: row.id,
    expiresAt: row.expires_at,
    expired,
    battlesPlayed: row.battles_played,
    maxBattles: row.max_battles,
    battlesRemaining: Math.max(0, row.max_battles - row.battles_played),
    demoRewardUnitsTotal: row.demo_reward_units_total,
    demoRewardDisplay: formatDemoArmzAmount(Number(row.demo_reward_units_total)),
    replayAvailableInSeconds: nextBattle,
    resetAvailableInSeconds: nextReset,
    configurationVersion: row.configuration_version,
    simulatedOnly: true as const,
    monetaryValue: false as const,
    claimable: false as const,
  };
}

export async function createOrRestoreDemoSession(input: {
  existingToken?: string;
  playerId?: string | null;
  config?: DemoConfig;
}): Promise<{ token: string; session: DemoSessionRow; isNew: boolean }> {
  const config = input.config ?? loadDemoConfig();
  const now = new Date();
  if (input.existingToken) {
    const hash = hashToken(demoSecret(), input.existingToken);
    const existing = await findDemoSessionByTokenHash(hash);
    if (existing && new Date(existing.expires_at) > now && !existing.revoked_at) {
      return { token: input.existingToken, session: existing, isNew: false };
    }
  }
  const token = generateToken(32);
  const tokenHash = hashToken(demoSecret(), token);
  const expires = new Date(now.getTime() + config.sessionTtlSeconds * 1000);
  const session = await insertDemoSession({
    token_hash: tokenHash,
    player_id: input.playerId ?? null,
    battles_played: 0,
    max_battles: config.maxBattlesPerSession,
    demo_reward_units_total: 0,
    last_battle_at: null,
    next_battle_available_at: null,
    last_armz_reset_at: null,
    next_armz_reset_available_at: null,
    expires_at: expires.toISOString(),
    revoked_at: null,
    configuration_version: config.configurationVersion,
  });
  return { token, session, isNew: true };
}

export async function resolveDemoSession(
  token: string | undefined,
): Promise<DemoSessionRow | null> {
  if (!token) return null;
  const hash = hashToken(demoSecret(), token);
  const session = await findDemoSessionByTokenHash(hash);
  if (!session || session.revoked_at) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) return null;
  return session;
}

export async function ensureDemoArmz(session: DemoSessionRow): Promise<DemoArmzRow> {
  const existing = await findActiveDemoArmz(session.id);
  if (existing) return existing;
  const seed = `${session.id}:${session.created_at}`;
  const { presetKey, stats } = generateDemoArmzIdentity(seed);
  const preset = getDemoPreset(presetKey)!;
  return insertDemoArmz({
    demo_session_id: session.id,
    preset_key: presetKey,
    display_name: preset.displayName,
    rarity: 'common',
    level: 1,
    power: stats.power,
    grip: stats.grip,
    technique: stats.technique,
    endurance: stats.endurance,
    defense: stats.defense,
    speed: stats.speed,
    luck: stats.luck,
    critical_chance_bps: stats.criticalChance,
    cosmetic_variant: preset.cosmeticVariant,
    animation_set_key: preset.animationSetKey,
    temporary: true,
    transferable: false,
    claimable: false,
    blockchain_asset: false,
    is_active: true,
    expires_at: session.expires_at,
  });
}

export async function resetDemoArmz(
  session: DemoSessionRow,
  config: DemoConfig = loadDemoConfig(),
): Promise<DemoArmzRow> {
  const now = new Date();
  if (
    session.next_armz_reset_available_at &&
    new Date(session.next_armz_reset_available_at).getTime() > now.getTime()
  ) {
    throw Object.assign(new Error('Demo ARMZ reset is on cooldown'), {
      statusCode: 429,
      code: 'demo_reset_cooldown',
      retryAfterSeconds: Math.ceil(
        (new Date(session.next_armz_reset_available_at).getTime() - now.getTime()) / 1000,
      ),
    });
  }
  await deactivateDemoArmz(session.id);
  const seed = `${session.id}:reset:${now.toISOString()}`;
  const { presetKey, stats } = generateDemoArmzIdentity(seed);
  const preset = getDemoPreset(presetKey)!;
  const armz = await insertDemoArmz({
    demo_session_id: session.id,
    preset_key: presetKey,
    display_name: preset.displayName,
    rarity: 'common',
    level: 1,
    power: stats.power,
    grip: stats.grip,
    technique: stats.technique,
    endurance: stats.endurance,
    defense: stats.defense,
    speed: stats.speed,
    luck: stats.luck,
    critical_chance_bps: stats.criticalChance,
    cosmetic_variant: preset.cosmeticVariant,
    animation_set_key: preset.animationSetKey,
    temporary: true,
    transferable: false,
    claimable: false,
    blockchain_asset: false,
    is_active: true,
    expires_at: session.expires_at,
  });
  const nextReset = new Date(now.getTime() + config.armzResetCooldownSeconds * 1000);
  await updateDemoSession(session.id, {
    last_armz_reset_at: now.toISOString(),
    next_armz_reset_available_at: nextReset.toISOString(),
  });
  return armz;
}

export async function startDemoBattle(input: {
  session: DemoSessionRow;
  idempotencyKey: string;
  reducedMotion?: boolean;
  config?: DemoConfig;
}): Promise<{
  battle: DemoBattleRow;
  result: DemoBattleResult;
  session: DemoSessionRow;
  armz: DemoArmzRow;
  replay: ReturnType<typeof publicSession>;
}> {
  const config = input.config ?? loadDemoConfig();
  const now = new Date();
  const existing = await findDemoBattleByIdempotency(input.session.id, input.idempotencyKey);
  if (existing) {
    const armz = (await findActiveDemoArmz(input.session.id))!;
    const session = (await findDemoSessionByTokenHash(input.session.token_hash)) ?? input.session;
    return {
      battle: existing,
      result: {
        outcome: existing.outcome,
        playerFinalStrength: existing.player_final_strength,
        opponentFinalStrength: existing.opponent_final_strength,
        durationMs: existing.duration_ms,
        timeline: existing.timeline as DemoBattleResult['timeline'],
        criticalEvents: existing.critical_events,
        recoveryEvents: existing.recovery_events,
        configurationVersion: existing.configuration_version,
        reward: existing.demo_reward_units
          ? {
              demoUnits: Number(existing.demo_reward_units),
              label: 'Demo $ARMZ',
              monetaryValue: false,
              claimable: false,
              withdrawable: false,
              transferable: false,
              simulated: true,
            }
          : null,
      },
      session,
      armz,
      replay: publicSession(session, now),
    };
  }

  if (input.session.battles_played >= input.session.max_battles) {
    throw Object.assign(new Error('Demo battle limit reached for this session'), {
      statusCode: 429,
      code: 'demo_battle_limit',
    });
  }
  if (
    input.session.next_battle_available_at &&
    new Date(input.session.next_battle_available_at).getTime() > now.getTime()
  ) {
    throw Object.assign(new Error('Demo replay cooldown active'), {
      statusCode: 429,
      code: 'demo_replay_cooldown',
      retryAfterSeconds: Math.ceil(
        (new Date(input.session.next_battle_available_at).getTime() - now.getTime()) / 1000,
      ),
    });
  }

  const armz = await ensureDemoArmz(input.session);
  const opponent = getEasyDemoOpponent();
  const battleSeed = generateToken(32);
  const seedHash = sha256Hex(battleSeed);

  const result = simulateDemoBattle({
    seed: battleSeed,
    player: {
      power: armz.power,
      grip: armz.grip,
      technique: armz.technique,
      endurance: armz.endurance,
      defense: armz.defense,
      speed: armz.speed,
      luck: armz.luck,
      criticalChance: armz.critical_chance_bps,
    },
    opponent: opponent.stats,
    reducedMotion: input.reducedMotion,
  });

  const battle = await insertDemoBattle({
    demo_session_id: input.session.id,
    demo_armz_id: armz.id,
    opponent_key: opponent.opponentKey,
    opponent_display_name: opponent.displayName,
    difficulty: 'easy',
    outcome: result.outcome,
    player_final_strength: result.playerFinalStrength,
    opponent_final_strength: result.opponentFinalStrength,
    duration_ms: result.durationMs,
    critical_events: result.criticalEvents,
    recovery_events: result.recoveryEvents,
    configuration_version: result.configurationVersion,
    timeline: result.timeline,
    player_stats_snapshot: {
      power: armz.power,
      grip: armz.grip,
      technique: armz.technique,
      endurance: armz.endurance,
      defense: armz.defense,
      speed: armz.speed,
      luck: armz.luck,
      criticalChance: armz.critical_chance_bps,
    },
    opponent_stats_snapshot: opponent.stats,
    idempotency_key: input.idempotencyKey,
    battle_seed_hash: seedHash,
    demo_reward_units: result.reward?.demoUnits ?? null,
  });

  if (result.reward) {
    await insertDemoRewardEvent({
      demo_session_id: input.session.id,
      demo_battle_id: battle.id,
      demo_units: result.reward.demoUnits,
    });
  }

  const nextBattle = new Date(now.getTime() + config.replayCooldownSeconds * 1000);
  const session = await updateDemoSession(input.session.id, {
    battles_played: input.session.battles_played + 1,
    last_battle_at: now.toISOString(),
    next_battle_available_at: nextBattle.toISOString(),
    demo_reward_units_total:
      Number(input.session.demo_reward_units_total) + (result.reward?.demoUnits ?? 0),
  });

  return {
    battle,
    result,
    session,
    armz,
    replay: publicSession(session, now),
  };
}

export function buildDemoPublicPayload(session: DemoSessionRow, armz: DemoArmzRow | null) {
  const now = new Date();
  const opponent = getEasyDemoOpponent();
  return {
    demoModeEnabled: true,
    session: publicSession(session, now),
    armz: armz ? publicArmz(armz) : null,
    opponent: {
      opponentKey: opponent.opponentKey,
      displayName: opponent.displayName,
      difficulty: opponent.difficulty,
      tagline: opponent.tagline,
      animationSetKey: opponent.animationSetKey,
      // Stats visible as estimated matchup labels only — not editable
      estimatedMatchupLabel: 'Estimated demo matchup — not a guaranteed win',
      palette: {
        skinTone: opponent.skinTone,
        primaryCloth: opponent.primaryCloth,
        accent: opponent.accent,
        glove: opponent.glove,
      },
    },
    presets: DEMO_ARMZ_PRESETS.map((p) => ({
      key: p.key,
      displayName: p.displayName,
      tagline: p.tagline,
    })),
    labels: {
      mode: 'Demo Mode',
      temporary: 'Temporary Common ARMZ',
      simulated: 'Simulated',
      noMonetaryValue: 'No monetary value',
      notClaimable: 'Not claimable',
      notWithdrawable: 'Not withdrawable',
      notTransferable: 'Not transferable',
      noBlockchain: 'No blockchain transaction',
      noWalletRequired: 'No wallet required',
    },
  };
}

export async function getDemoHistory(sessionId: string) {
  const battles = await listDemoBattles(sessionId, 20);
  return battles.map((b) => ({
    battleId: b.id,
    opponent: b.opponent_display_name,
    outcome: b.outcome,
    demoArmzId: b.demo_armz_id,
    durationMs: b.duration_ms,
    demoRewardUnits: b.demo_reward_units,
    demoRewardDisplay: b.demo_reward_units
      ? formatDemoArmzAmount(Number(b.demo_reward_units))
      : null,
    playedAt: b.created_at,
    simulated: true,
    claimable: false,
  }));
}

export { publicArmz, publicSession };
