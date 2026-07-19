import { loadAuthConfig, allowedAuthOrigins, AUTH_NETWORK } from '@armz-clash/config';
import { sha256Hex } from '@armz-clash/blockchain/auth/message';
import { verifySolanaMessageSignature } from '@armz-clash/blockchain/auth/verify';
import { isSolanaPublicKeyString } from '@armz-clash/blockchain';
import { getServiceDb } from '../lib/db';
import { generateToken, hashToken } from '../lib/crypto';

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export async function verifyAuthChallenge(input: {
  challengeId: string;
  walletAddress: string;
  message: string;
  signature: string;
  signatureEncoding?: 'base58' | 'base64';
  origin: string;
  correlationId: string;
  userAgent?: string;
  ip?: string;
}) {
  const auth = loadAuthConfig();
  if (!allowedAuthOrigins(auth).includes(input.origin)) {
    throw Object.assign(new Error('Origin not allowed'), {
      statusCode: 403,
      code: 'origin_forbidden',
    });
  }
  if (!isSolanaPublicKeyString(input.walletAddress)) {
    throw Object.assign(new Error('Invalid wallet'), { statusCode: 400, code: 'invalid_wallet' });
  }

  const db = getServiceDb();
  const { data: challenge, error } = await db
    .from('auth_challenges')
    .select('*')
    .eq('id', input.challengeId)
    .maybeSingle();

  if (error || !challenge) {
    throw Object.assign(new Error('Challenge not found'), {
      statusCode: 404,
      code: 'challenge_not_found',
    });
  }

  if (challenge.consumed_at) {
    throw Object.assign(new Error('Challenge already used'), {
      statusCode: 409,
      code: 'challenge_consumed',
    });
  }

  if (new Date(challenge.expires_at).getTime() < Date.now() - auth.clockSkewSeconds * 1000) {
    throw Object.assign(new Error('Challenge expired'), {
      statusCode: 410,
      code: 'challenge_expired',
    });
  }

  if (challenge.wallet_address !== input.walletAddress) {
    throw Object.assign(new Error('Wallet mismatch'), { statusCode: 400, code: 'wallet_mismatch' });
  }

  if (challenge.network !== AUTH_NETWORK) {
    throw Object.assign(new Error('Network mismatch'), {
      statusCode: 400,
      code: 'network_mismatch',
    });
  }

  if (sha256Hex(input.message) !== challenge.message_hash) {
    await db
      .from('auth_challenges')
      .update({ failed_attempts: (challenge.failed_attempts ?? 0) + 1 })
      .eq('id', challenge.id);
    throw Object.assign(new Error('Message mismatch'), {
      statusCode: 400,
      code: 'message_mismatch',
    });
  }

  if ((challenge.failed_attempts ?? 0) >= (challenge.max_failed_attempts ?? 5)) {
    throw Object.assign(new Error('Challenge locked'), {
      statusCode: 429,
      code: 'challenge_locked',
    });
  }

  const verified = verifySolanaMessageSignature({
    message: input.message,
    signature: input.signature,
    walletAddress: input.walletAddress,
    signatureEncoding: input.signatureEncoding ?? 'base58',
  });

  if (!verified.ok) {
    await db
      .from('auth_challenges')
      .update({ failed_attempts: (challenge.failed_attempts ?? 0) + 1 })
      .eq('id', challenge.id);
    await db.from('auth_audit_events').insert({
      event_type: 'verify_failed',
      wallet_address: input.walletAddress,
      challenge_id: challenge.id,
      success: false,
      error_code: verified.reason,
      correlation_id: input.correlationId,
    });
    throw Object.assign(new Error('Invalid signature'), {
      statusCode: 401,
      code: verified.reason,
    });
  }

  // Atomic consume
  const { data: consumed, error: consumeError } = await db
    .from('auth_challenges')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', challenge.id)
    .is('consumed_at', null)
    .select('id')
    .maybeSingle();

  if (consumeError || !consumed) {
    throw Object.assign(new Error('Challenge already used'), {
      statusCode: 409,
      code: 'challenge_consumed',
    });
  }

  // Upsert player + wallet
  let playerId: string;
  const { data: existingWallet } = await db
    .from('wallet_accounts')
    .select('player_id')
    .eq('wallet_address', input.walletAddress)
    .maybeSingle();

  if (existingWallet?.player_id) {
    playerId = existingWallet.player_id as string;
    await db
      .from('players')
      .update({ last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', playerId);
    await db
      .from('wallet_accounts')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('wallet_address', input.walletAddress);
  } else {
    const displayName = `Player ${truncateAddress(input.walletAddress)}`;
    const { data: player, error: playerError } = await db
      .from('players')
      .insert({
        display_name: displayName,
        primary_wallet_address: input.walletAddress,
        last_seen_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (playerError || !player) {
      throw Object.assign(new Error('Failed to create player'), {
        statusCode: 500,
        code: 'player_create_failed',
      });
    }
    playerId = player.id as string;
    await db.from('wallet_accounts').insert({
      player_id: playerId,
      wallet_address: input.walletAddress,
      network: AUTH_NETWORK,
      is_primary: true,
    });
  }

  const sessionToken = generateToken(32);
  const csrfToken = generateToken(24);
  const sessionSecret = process.env.ARMZ_SESSION_SIGNING_SECRET ?? '';
  if (!sessionSecret) {
    throw Object.assign(new Error('Session secret missing'), {
      statusCode: 500,
      code: 'session_secret_missing',
    });
  }

  const now = Date.now();
  const expiresAt = new Date(now + auth.sessionTtlSeconds * 1000).toISOString();
  const absoluteExpiresAt = new Date(now + auth.sessionAbsoluteTtlSeconds * 1000).toISOString();

  const { data: session, error: sessionError } = await db
    .from('player_sessions')
    .insert({
      player_id: playerId,
      wallet_address: input.walletAddress,
      token_hash: hashToken(sessionSecret, sessionToken),
      csrf_hash: hashToken(sessionSecret, csrfToken),
      expires_at: expiresAt,
      absolute_expires_at: absoluteExpiresAt,
      user_agent_hash: input.userAgent ? sha256Hex(input.userAgent) : null,
      ip_hash: input.ip ? sha256Hex(input.ip) : null,
      correlation_id: input.correlationId,
    })
    .select('id, expires_at, absolute_expires_at')
    .single();

  if (sessionError || !session) {
    throw Object.assign(new Error('Failed to create session'), {
      statusCode: 500,
      code: 'session_create_failed',
    });
  }

  const { data: profile } = await db.from('players').select('*').eq('id', playerId).single();

  await db.from('auth_audit_events').insert({
    event_type: 'verify_success',
    wallet_address: input.walletAddress,
    player_id: playerId,
    session_id: session.id,
    challenge_id: challenge.id,
    success: true,
    correlation_id: input.correlationId,
  });

  return {
    authenticated: true as const,
    sessionToken,
    csrfToken,
    session: {
      id: session.id as string,
      expiresAt: session.expires_at as string,
      absoluteExpiresAt: session.absolute_expires_at as string,
    },
    profile: {
      id: profile?.id as string,
      displayName: profile?.display_name as string,
      avatarPreset: profile?.avatar_preset as string,
      primaryWalletAddress: profile?.primary_wallet_address as string,
    },
  };
}
