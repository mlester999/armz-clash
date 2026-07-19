import { describe, expect, it } from 'vitest';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { buildSignInMessage, generateNonce, sha256Hex } from '@armz-clash/blockchain/auth/message';
import { verifySolanaMessageSignature } from '@armz-clash/blockchain/auth/verify';

describe('auth message + signature pipeline', () => {
  it('binds wallet, domain, network, and verifies only exact message', () => {
    const keypair = Keypair.generate();
    const challengeId = crypto.randomUUID();
    const message = buildSignInMessage({
      domain: 'localhost:3000',
      uri: 'http://localhost:3000',
      walletAddress: keypair.publicKey.toBase58(),
      nonce: generateNonce(),
      challengeId,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      requestId: 'req_1',
    });
    expect(message).toContain('solana:devnet');
    expect(message).toContain('solana-devnet');
    expect(message).toContain(keypair.publicKey.toBase58());
    expect(message).toContain('does not trigger a blockchain transaction');
    expect(message).toContain('does not approve token spending');

    const sig = nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);
    expect(
      verifySolanaMessageSignature({
        message,
        signature: bs58.encode(sig),
        walletAddress: keypair.publicKey.toBase58(),
      }).ok,
    ).toBe(true);

    expect(sha256Hex(message)).toHaveLength(64);
  });
});
