import { describe, expect, it } from 'vitest';
import { loadApiRootEnv } from './load-root-env';

describe('loadApiRootEnv', () => {
  it('finds monorepo root and does not throw', () => {
    const result = loadApiRootEnv();
    // In this workspace the monorepo root should resolve.
    expect(result).toHaveProperty('root');
    expect(result).toHaveProperty('loaded');
    expect(Array.isArray(result.loaded)).toBe(true);
  });

  it('does not override already-set process.env keys', () => {
    const key = 'ARMZ_DOCTOR_TEST_SENTINEL';
    const original = process.env[key];
    process.env[key] = 'keep-me';
    loadApiRootEnv();
    expect(process.env[key]).toBe('keep-me');
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  });
});
