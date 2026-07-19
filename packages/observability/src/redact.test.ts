import { describe, expect, it } from 'vitest';
import { isSensitiveKey, redactObject } from './redact';

describe('secret redaction', () => {
  it('redacts sensitive keys', () => {
    const redacted = redactObject({
      password: 'hunter2',
      serviceRole: 'sr_xxx',
      privateKey: 'pk',
      authorization: 'Bearer x',
      cookie: 'sid=1',
      walletNonceSecret: 'n',
    });
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.serviceRole).toBe('[REDACTED]');
    expect(redacted.privateKey).toBe('[REDACTED]');
    expect(redacted.authorization).toBe('[REDACTED]');
    expect(redacted.cookie).toBe('[REDACTED]');
    expect(redacted.walletNonceSecret).toBe('[REDACTED]');
  });

  it('does not over-redact public token display fields', () => {
    expect(isSensitiveKey('tokenDisplay')).toBe(false);
    expect(isSensitiveKey('tokenSymbol')).toBe(false);
    const redacted = redactObject({
      tokenDisplay: '$ARMZ',
      tokenSymbol: 'ARMZ',
      productName: 'Armz Clash',
    });
    expect(redacted.tokenDisplay).toBe('$ARMZ');
    expect(redacted.tokenSymbol).toBe('ARMZ');
  });
});
