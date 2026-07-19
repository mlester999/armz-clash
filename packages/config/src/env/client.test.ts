import { describe, expect, it } from 'vitest';
import {
  loadClientEnv,
  readBundledPublicEnvironment,
  isReownProjectIdConfigured,
  type PublicEnvironment,
} from './client';

describe('loadClientEnv', () => {
  it('uses explicit override object in tests (custom env still works)', () => {
    const env = loadClientEnv({
      NEXT_PUBLIC_REOWN_PROJECT_ID: 'test-project-id-32chars-xxxxxx',
      NEXT_PUBLIC_ARMZ_API_URL: 'http://127.0.0.1:4000',
      NEXT_PUBLIC_ARMZ_WEB_URL: 'http://127.0.0.1:3000',
      NEXT_PUBLIC_ARMZ_GAME_URL: 'http://127.0.0.1:3001',
      NEXT_PUBLIC_ARMZ_NETWORK: 'devnet',
      NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED: 'true',
      NEXT_PUBLIC_ARMZ_MAINNET_ENABLED: 'false',
    });
    expect(env.NEXT_PUBLIC_REOWN_PROJECT_ID).toBe('test-project-id-32chars-xxxxxx');
    expect(env.NEXT_PUBLIC_ARMZ_API_URL).toBe('http://127.0.0.1:4000');
    expect(env.NEXT_PUBLIC_ARMZ_WEB_URL).toBe('http://127.0.0.1:3000');
    expect(env.NEXT_PUBLIC_ARMZ_GAME_URL).toBe('http://127.0.0.1:3001');
    expect(env.NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED).toBe(true);
    expect(env.NEXT_PUBLIC_ARMZ_MAINNET_ENABLED).toBe(false);
  });

  it('preserves Reown Project ID when configured', () => {
    const id = 'abcdef0123456789abcdef0123456789';
    const env = loadClientEnv({ NEXT_PUBLIC_REOWN_PROJECT_ID: id });
    expect(env.NEXT_PUBLIC_REOWN_PROJECT_ID).toBe(id);
    expect(isReownProjectIdConfigured({ NEXT_PUBLIC_REOWN_PROJECT_ID: id })).toBe(true);
  });

  it('empty Reown Project ID produces safe unavailable state', () => {
    const env = loadClientEnv({ NEXT_PUBLIC_REOWN_PROJECT_ID: '' });
    expect(env.NEXT_PUBLIC_REOWN_PROJECT_ID).toBe('');
    expect(isReownProjectIdConfigured({ NEXT_PUBLIC_REOWN_PROJECT_ID: '' })).toBe(false);
    expect(isReownProjectIdConfigured({ NEXT_PUBLIC_REOWN_PROJECT_ID: '   ' })).toBe(false);
  });

  it('defaults API/web/game URLs to 127.0.0.1', () => {
    const env = loadClientEnv({});
    expect(env.NEXT_PUBLIC_ARMZ_API_URL).toBe('http://127.0.0.1:4000');
    expect(env.NEXT_PUBLIC_ARMZ_WEB_URL).toBe('http://127.0.0.1:3000');
    expect(env.NEXT_PUBLIC_ARMZ_GAME_URL).toBe('http://127.0.0.1:3001');
  });

  it('normalizes trailing slashes on public URLs', () => {
    const env = loadClientEnv({
      NEXT_PUBLIC_ARMZ_API_URL: 'http://127.0.0.1:4000/',
      NEXT_PUBLIC_ARMZ_WEB_URL: 'http://127.0.0.1:3000/',
      NEXT_PUBLIC_ARMZ_GAME_URL: 'http://127.0.0.1:3001/',
    });
    expect(env.NEXT_PUBLIC_ARMZ_API_URL).toBe('http://127.0.0.1:4000');
    expect(env.NEXT_PUBLIC_ARMZ_WEB_URL).toBe('http://127.0.0.1:3000');
    expect(env.NEXT_PUBLIC_ARMZ_GAME_URL).toBe('http://127.0.0.1:3001');
  });

  it('defaults demo true and mainnet false', () => {
    const env = loadClientEnv({});
    expect(env.NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED).toBe(true);
    expect(env.NEXT_PUBLIC_ARMZ_MAINNET_ENABLED).toBe(false);
    expect(env.NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED).toBe(false);
    expect(env.NEXT_PUBLIC_ARMZ_REAL_REWARDS_ENABLED).toBe(false);
    expect(env.NEXT_PUBLIC_ARMZ_CLAIMS_ENABLED).toBe(false);
    expect(env.NEXT_PUBLIC_ARMZ_MARKETPLACE_ENABLED).toBe(false);
  });

  it('client feature flags read only NEXT_PUBLIC_* variables (not server ARMZ_*)', () => {
    const env = loadClientEnv({
      // Server-only style keys must not drive client flags.
      ARMZ_DEMO_MODE_ENABLED: 'false',
      ARMZ_MAINNET_ENABLED: 'true',
      ARMZ_REAL_MINT_ENABLED: 'true',
      NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED: 'true',
      NEXT_PUBLIC_ARMZ_MAINNET_ENABLED: 'false',
    } as PublicEnvironment);
    expect(env.NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED).toBe(true);
    expect(env.NEXT_PUBLIC_ARMZ_MAINNET_ENABLED).toBe(false);
    expect(env.NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED).toBe(false);
  });

  it('server-only variables are not present on client config object', () => {
    const env = loadClientEnv({
      NEXT_PUBLIC_REOWN_PROJECT_ID: 'x',
      SUPABASE_SERVICE_ROLE_KEY: 'should-not-appear',
      ARMZ_SESSION_SIGNING_SECRET: 'should-not-appear',
      ARMZ_WALLET_NONCE_SECRET: 'should-not-appear',
    } as PublicEnvironment);
    const keys = Object.keys(env);
    expect(keys.some((k) => k.includes('SERVICE_ROLE'))).toBe(false);
    expect(keys.some((k) => k.includes('SESSION_SIGNING'))).toBe(false);
    expect(keys.some((k) => k.includes('NONCE_SECRET'))).toBe(false);
    expect(keys.every((k) => k.startsWith('NEXT_PUBLIC_'))).toBe(true);
  });

  it('rejects invalid public boolean strings', () => {
    expect(() => loadClientEnv({ NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED: 'yes' })).toThrow(
      /Invalid boolean|boolean/i,
    );
  });

  it('readBundledPublicEnvironment returns an object with expected public keys', () => {
    const bundled = readBundledPublicEnvironment();
    expect(bundled).toHaveProperty('NEXT_PUBLIC_REOWN_PROJECT_ID');
    expect(bundled).toHaveProperty('NEXT_PUBLIC_ARMZ_API_URL');
    expect(bundled).toHaveProperty('NEXT_PUBLIC_ARMZ_WEB_URL');
    expect(bundled).toHaveProperty('NEXT_PUBLIC_ARMZ_GAME_URL');
    expect(bundled).toHaveProperty('NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED');
    expect(bundled).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY');
    expect(bundled).not.toHaveProperty('ARMZ_SESSION_SIGNING_SECRET');
  });

  it('default load without override uses bundled public environment shape', () => {
    // Does not assert process values (may be empty in unit CI); asserts parse succeeds.
    const env = loadClientEnv();
    expect(typeof env.NEXT_PUBLIC_REOWN_PROJECT_ID).toBe('string');
    expect(env.NEXT_PUBLIC_ARMZ_API_URL).toMatch(/^https?:\/\//);
    expect(env.NEXT_PUBLIC_ARMZ_MAINNET_ENABLED).toBe(false);
  });
});
