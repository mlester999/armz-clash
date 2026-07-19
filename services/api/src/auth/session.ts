import { loadAuthConfig } from '@armz-clash/config';
import { getServiceDb } from '../lib/db';
import { generateToken, hashToken } from '../lib/crypto';

export type ActiveSession = {
  sessionId: string;
  playerId: string;
  walletAddress: string;
  expiresAt: string;
  absoluteExpiresAt: string;
  profile: {
    id: string;
    displayName: string;
    avatarPreset: string;
    primaryWalletAddress: string | null;
  };
};

export type RenewResult =
  | {
      rotated: true;
      sessionToken: string;
      csrfToken: string;
      expiresAt: string;
      absoluteExpiresAt: string;
      profile: ActiveSession['profile'];
      walletAddress: string;
    }
  | {
      rotated: false;
      expiresAt: string;
      absoluteExpiresAt: string;
      profile: ActiveSession['profile'];
      walletAddress: string;
    };

export async function loadSessionFromToken(
  token: string | undefined,
): Promise<ActiveSession | null> {
  if (!token) return null;
  const secret = process.env.ARMZ_SESSION_SIGNING_SECRET ?? '';
  if (!secret || secret.length < 16) return null;
  const db = getServiceDb();
  const tokenHash = hashToken(secret, token);
  const { data: session } = await db
    .from('player_sessions')
    .select('*')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (!session) return null;
  const now = Date.now();
  if (new Date(session.expires_at).getTime() < now) return null;
  if (new Date(session.absolute_expires_at).getTime() < now) return null;

  await db
    .from('player_sessions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', session.id);

  const { data: profile } = await db
    .from('players')
    .select('*')
    .eq('id', session.player_id)
    .maybeSingle();

  if (!profile) return null;

  return {
    sessionId: session.id as string,
    playerId: session.player_id as string,
    walletAddress: session.wallet_address as string,
    expiresAt: session.expires_at as string,
    absoluteExpiresAt: session.absolute_expires_at as string,
    profile: {
      id: profile.id as string,
      displayName: profile.display_name as string,
      avatarPreset: profile.avatar_preset as string,
      primaryWalletAddress: (profile.primary_wallet_address as string | null) ?? null,
    },
  };
}

/**
 * Renew session:
 * - Outside renewal window: return same session metadata without rotation.
 * - Inside window: atomically revoke current, then create child session.
 * Concurrent renewals: only one revoke succeeds; others fail.
 */
export async function renewSession(token: string | undefined): Promise<RenewResult | null> {
  const current = await loadSessionFromToken(token);
  if (!current || !token) return null;
  const auth = loadAuthConfig();
  const now = Date.now();
  const expiresAtMs = new Date(current.expiresAt).getTime();
  const absoluteMs = new Date(current.absoluteExpiresAt).getTime();
  if (absoluteMs <= now) return null;

  const remainingMs = expiresAtMs - now;
  if (remainingMs > auth.sessionRenewalWindowSeconds * 1000) {
    return {
      rotated: false,
      expiresAt: current.expiresAt,
      absoluteExpiresAt: current.absoluteExpiresAt,
      profile: current.profile,
      walletAddress: current.walletAddress,
    };
  }

  const secret = process.env.ARMZ_SESSION_SIGNING_SECRET ?? '';
  if (!secret) return null;
  const db = getServiceDb();

  // Atomic claim: only one concurrent renew can revoke the parent.
  const { data: revoked, error: revokeError } = await db
    .from('player_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', current.sessionId)
    .is('revoked_at', null)
    .select('id')
    .maybeSingle();

  if (revokeError || !revoked) {
    return null;
  }

  const sessionToken = generateToken(32);
  const csrfToken = generateToken(24);
  const newExpires = new Date(
    Math.min(now + auth.sessionTtlSeconds * 1000, absoluteMs),
  ).toISOString();

  const { data: created, error } = await db
    .from('player_sessions')
    .insert({
      player_id: current.playerId,
      wallet_address: current.walletAddress,
      token_hash: hashToken(secret, sessionToken),
      csrf_hash: hashToken(secret, csrfToken),
      expires_at: newExpires,
      absolute_expires_at: current.absoluteExpiresAt,
      rotated_from_session_id: current.sessionId,
    })
    .select('expires_at, absolute_expires_at')
    .single();

  if (error || !created) {
    return null;
  }

  return {
    rotated: true,
    sessionToken,
    csrfToken,
    expiresAt: created.expires_at as string,
    absoluteExpiresAt: created.absolute_expires_at as string,
    profile: current.profile,
    walletAddress: current.walletAddress,
  };
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token) return;
  const secret = process.env.ARMZ_SESSION_SIGNING_SECRET ?? '';
  if (!secret) return;
  const db = getServiceDb();
  await db
    .from('player_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', hashToken(secret, token))
    .is('revoked_at', null);
}

export async function revokeAllSessionsForWallet(
  walletAddress: string,
  exceptSessionId?: string,
): Promise<void> {
  const db = getServiceDb();
  let query = db
    .from('player_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('wallet_address', walletAddress)
    .is('revoked_at', null);
  if (exceptSessionId) {
    query = query.neq('id', exceptSessionId);
  }
  await query;
}

const DISPLAY_NAME_RE = /^[\p{L}\p{N} _.-]{1,32}$/u;
const AVATAR_PRESET_RE = /^[a-z0-9_-]{1,64}$/i;

function stripControlChars(value: string): string {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 32 && code !== 127) out += ch;
  }
  return out;
}

export async function updateProfile(
  playerId: string,
  patch: { displayName?: string; avatarPreset?: string },
) {
  const updates: Record<string, string> = { updated_at: new Date().toISOString() };
  if (patch.displayName !== undefined) {
    const name = stripControlChars(patch.displayName.trim());
    if (!DISPLAY_NAME_RE.test(name) || /[<>&"`]/.test(name)) {
      throw Object.assign(new Error('Invalid display name'), {
        statusCode: 400,
        code: 'invalid_display_name',
      });
    }
    updates.display_name = name;
  }
  if (patch.avatarPreset !== undefined) {
    const preset = patch.avatarPreset.trim();
    if (!AVATAR_PRESET_RE.test(preset)) {
      throw Object.assign(new Error('Invalid avatar preset'), {
        statusCode: 400,
        code: 'invalid_avatar_preset',
      });
    }
    updates.avatar_preset = preset;
  }
  const db = getServiceDb();
  const { data, error } = await db
    .from('players')
    .update(updates)
    .eq('id', playerId)
    .select('*')
    .single();
  if (error || !data) {
    throw Object.assign(new Error('Profile update failed'), {
      statusCode: 500,
      code: 'profile_update_failed',
    });
  }
  return {
    id: data.id as string,
    displayName: data.display_name as string,
    avatarPreset: data.avatar_preset as string,
    primaryWalletAddress: data.primary_wallet_address as string | null,
  };
}
