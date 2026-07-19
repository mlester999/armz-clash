import { describe, expect, it } from 'vitest';
import { loadClientEnv } from '../packages/config/src/env/client.ts';
import { loadAuthConfig, allowedAuthOrigins } from '../packages/config/src/auth.ts';

/**
 * Unit coverage for doctor mismatch rules (no network, no secrets printed).
 */
describe('doctor hostname mismatch rules', () => {
  it('detects mixed localhost and 127.0.0.1 public URLs', () => {
    const client = loadClientEnv({
      NEXT_PUBLIC_ARMZ_API_URL: 'http://127.0.0.1:4000',
      NEXT_PUBLIC_ARMZ_WEB_URL: 'http://localhost:3000',
      NEXT_PUBLIC_ARMZ_GAME_URL: 'http://127.0.0.1:3001',
    });
    const hosts = [
      new URL(client.NEXT_PUBLIC_ARMZ_API_URL).hostname,
      new URL(client.NEXT_PUBLIC_ARMZ_WEB_URL).hostname,
      new URL(client.NEXT_PUBLIC_ARMZ_GAME_URL).hostname,
    ];
    const hasLocalhost = hosts.includes('localhost');
    const hasLoopback = hosts.includes('127.0.0.1');
    expect(hasLocalhost && hasLoopback).toBe(true);
  });

  it('passes when all local hosts are 127.0.0.1', () => {
    const client = loadClientEnv({
      NEXT_PUBLIC_ARMZ_API_URL: 'http://127.0.0.1:4000',
      NEXT_PUBLIC_ARMZ_WEB_URL: 'http://127.0.0.1:3000',
      NEXT_PUBLIC_ARMZ_GAME_URL: 'http://127.0.0.1:3001',
    });
    const auth = loadAuthConfig({
      ARMZ_WEB_ORIGIN: 'http://127.0.0.1:3000',
      ARMZ_GAME_ORIGIN: 'http://127.0.0.1:3001',
      ARMZ_ADMIN_ORIGIN: 'http://127.0.0.1:3002',
      ARMZ_API_ORIGIN: 'http://127.0.0.1:4000',
    });
    const hosts = [
      new URL(client.NEXT_PUBLIC_ARMZ_API_URL).hostname,
      new URL(client.NEXT_PUBLIC_ARMZ_WEB_URL).hostname,
      new URL(client.NEXT_PUBLIC_ARMZ_GAME_URL).hostname,
      new URL(auth.webOrigin).hostname,
      new URL(auth.gameOrigin).hostname,
    ];
    expect(hosts.every((h) => h === '127.0.0.1')).toBe(true);
    expect(allowedAuthOrigins(auth)).toEqual(['http://127.0.0.1:3000', 'http://127.0.0.1:3001']);
  });
});
