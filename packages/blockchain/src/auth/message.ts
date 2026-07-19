import { createHash, randomBytes } from 'node:crypto';
import { AUTH_CHAIN, AUTH_MESSAGE_VERSION, AUTH_NETWORK } from '@armz-clash/config';

export type ChallengeMessageInput = {
  domain: string;
  uri: string;
  walletAddress: string;
  nonce: string;
  challengeId: string;
  issuedAt: string;
  expiresAt: string;
  requestId: string;
  statement?: string;
};

export function buildSignInMessage(input: ChallengeMessageInput): string {
  const statement =
    input.statement ??
    'Sign in to Armz Clash to authenticate your player profile. This request does not trigger a blockchain transaction, does not cost SOL, and does not approve token spending.';

  return [
    `${input.domain} wants you to sign in with your Solana account:`,
    input.walletAddress,
    '',
    statement,
    '',
    `URI: ${input.uri}`,
    `Version: ${AUTH_MESSAGE_VERSION}`,
    `Chain ID: ${AUTH_CHAIN}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt}`,
    `Expiration Time: ${input.expiresAt}`,
    `Request ID: ${input.requestId}`,
    `Challenge ID: ${input.challengeId}`,
    `Network: ${AUTH_NETWORK}`,
  ].join('\n');
}

export function sha256Hex(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateNonce(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hmacSha256Hex(secret: string, value: string): string {
  return createHash('sha256').update(`${secret}:${value}`).digest('hex');
}
