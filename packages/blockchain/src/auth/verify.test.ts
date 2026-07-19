import { describe, expect, it } from 'vitest';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { verifySolanaMessageSignature } from './verify';
import { buildSignInMessage, generateNonce } from './message';
import { canTransition, transitionWalletState } from './wallet-state';

describe('verifySolanaMessageSignature', () => {
  it('accepts a valid Ed25519 wallet signature', () => {
    const keypair = Keypair.generate();
    const message = buildSignInMessage({
      domain: 'localhost:3000',
      uri: 'http://localhost:3000',
      walletAddress: keypair.publicKey.toBase58(),
      nonce: generateNonce(),
      challengeId: crypto.randomUUID(),
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      requestId: 'req_test',
    });
    const sig = nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);
    const result = verifySolanaMessageSignature({
      message,
      signature: bs58.encode(sig),
      walletAddress: keypair.publicKey.toBase58(),
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a modified message', () => {
    const keypair = Keypair.generate();
    const message = 'hello armz';
    const sig = nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);
    const result = verifySolanaMessageSignature({
      message: 'hello armz!',
      signature: bs58.encode(sig),
      walletAddress: keypair.publicKey.toBase58(),
    });
    expect(result.ok).toBe(false);
  });

  it('rejects wrong wallet', () => {
    const signer = Keypair.generate();
    const other = Keypair.generate();
    const message = 'hello';
    const sig = nacl.sign.detached(new TextEncoder().encode(message), signer.secretKey);
    const result = verifySolanaMessageSignature({
      message,
      signature: bs58.encode(sig),
      walletAddress: other.publicKey.toBase58(),
    });
    expect(result.ok).toBe(false);
  });
});

describe('wallet state machine', () => {
  it('allows connected -> requesting_challenge', () => {
    expect(canTransition('connected_unauthenticated', 'requesting_challenge')).toBe(true);
    expect(transitionWalletState('connected_unauthenticated', 'requesting_challenge')).toBe(
      'requesting_challenge',
    );
  });

  it('blocks disconnected -> authenticated', () => {
    expect(canTransition('disconnected', 'authenticated')).toBe(false);
    expect(() => transitionWalletState('disconnected', 'authenticated')).toThrow();
  });
});
