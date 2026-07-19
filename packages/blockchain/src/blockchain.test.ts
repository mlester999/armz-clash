import { describe, expect, it } from 'vitest';
import {
  assertMainnetAllowed,
  DEFAULT_NETWORK,
  MainnetSafetyError,
  resolveActiveNetwork,
} from './network';
import { buildAddressExplorerUrl, buildTransactionExplorerUrl } from './explorer';
import { isSolanaPublicKeyString, isValidTokenDecimals } from './validators';

describe('mainnet safety', () => {
  it('defaults to devnet', () => {
    expect(DEFAULT_NETWORK).toBe('devnet');
    expect(resolveActiveNetwork(undefined, false)).toBe('devnet');
  });

  it('blocks mainnet when flag is false', () => {
    expect(() => assertMainnetAllowed('mainnet-beta', false)).toThrow(MainnetSafetyError);
    expect(() => resolveActiveNetwork('mainnet-beta', false)).toThrow(MainnetSafetyError);
  });

  it('allows mainnet only when explicitly enabled', () => {
    expect(() => assertMainnetAllowed('mainnet-beta', true)).not.toThrow();
  });
});

describe('explorer urls', () => {
  it('builds devnet transaction and address urls', () => {
    expect(buildTransactionExplorerUrl('Sig123', 'devnet')).toContain('cluster=devnet');
    expect(buildTransactionExplorerUrl('Sig123', 'devnet')).toContain('/tx/Sig123');
    expect(buildAddressExplorerUrl('Addr123', 'devnet')).toContain('/address/Addr123');
  });
});

describe('validators', () => {
  it('validates public key shape loosely', () => {
    expect(isSolanaPublicKeyString('11111111111111111111111111111111')).toBe(true);
    expect(isSolanaPublicKeyString('short')).toBe(false);
  });

  it('validates token decimals', () => {
    expect(isValidTokenDecimals(6)).toBe(true);
    expect(isValidTokenDecimals(9)).toBe(true);
    expect(isValidTokenDecimals(-1)).toBe(false);
    expect(isValidTokenDecimals(19)).toBe(false);
  });
});
