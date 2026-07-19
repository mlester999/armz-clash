import { loadAuthConfig, allowedAuthOrigins, AUTH_NETWORK } from '@armz-clash/config';
import { buildSignInMessage, generateNonce, sha256Hex } from '@armz-clash/blockchain/auth/message';
import { isSolanaPublicKeyString } from '@armz-clash/blockchain';
import { getServiceDb } from '../lib/db';
import { generateToken } from '../lib/crypto';

export async function createAuthChallenge(input: {
  walletAddress: string;
  origin: string;
  uri: string;
  correlationId: string;
  requestMetadataHash?: string;
}) {
  const auth = loadAuthConfig();
  if (!isSolanaPublicKeyString(input.walletAddress)) {
    throw Object.assign(new Error('Invalid wallet address'), {
      statusCode: 400,
      code: 'invalid_wallet',
    });
  }

  const allowed = allowedAuthOrigins(auth);
  if (!allowed.includes(input.origin)) {
    throw Object.assign(new Error('Origin not allowed'), {
      statusCode: 403,
      code: 'origin_forbidden',
    });
  }

  const now = Date.now();
  const issuedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + auth.nonceTtlSeconds * 1000).toISOString();
  const challengeId = crypto.randomUUID();
  const nonce = generateNonce(32);
  const requestId = generateToken(16);
  const domain = new URL(input.origin).host;

  const message = buildSignInMessage({
    domain,
    uri: input.uri || input.origin,
    walletAddress: input.walletAddress,
    nonce,
    challengeId,
    issuedAt,
    expiresAt,
    requestId,
  });

  const db = getServiceDb();
  const { error } = await db.from('auth_challenges').insert({
    id: challengeId,
    wallet_address: input.walletAddress,
    nonce_hash: sha256Hex(nonce),
    message_hash: sha256Hex(message),
    domain,
    uri: input.uri || input.origin,
    network: AUTH_NETWORK,
    issued_at: issuedAt,
    expires_at: expiresAt,
    request_metadata_hash: input.requestMetadataHash ?? null,
    correlation_id: input.correlationId,
  });

  if (error) {
    throw Object.assign(new Error('Failed to create challenge'), {
      statusCode: 500,
      code: 'challenge_create_failed',
      cause: error.message,
    });
  }

  await db.from('auth_audit_events').insert({
    event_type: 'challenge_created',
    wallet_address: input.walletAddress,
    challenge_id: challengeId,
    success: true,
    correlation_id: input.correlationId,
  });

  return {
    challengeId,
    message,
    issuedAt,
    expiresAt,
    network: AUTH_NETWORK,
  };
}
