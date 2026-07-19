/**
 * Hosted auth security tests (challenge, verify, session, renew, isolation).
 * Runs only when RUN_HOSTED_SUPABASE_TESTS=true and required env is present.
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { readFileSync, existsSync } from 'node:fs';

function loadEnvFile() {
  if (!existsSync('.env')) return;
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

loadEnvFile();

const enabled = process.env.RUN_HOSTED_SUPABASE_TESTS === 'true';
const apiBase = process.env.NEXT_PUBLIC_ARMZ_API_URL || 'http://127.0.0.1:4000';
const origin = process.env.ARMZ_WEB_ORIGIN || 'http://localhost:3000';

function signMessage(message: string, keypair: Keypair): string {
  const sig = nacl.sign.detached(new TextEncoder().encode(message), keypair.secretKey);
  return bs58.encode(sig);
}

async function challenge(wallet: string, uri = origin) {
  const res = await fetch(`${apiBase}/api/v1/auth/challenge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ walletAddress: wallet, uri }),
  });
  return { res, json: await res.json() };
}

async function verify(body: {
  challengeId: string;
  walletAddress: string;
  message: string;
  signature: string;
}) {
  const res = await fetch(`${apiBase}/api/v1/auth/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(body),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const json = await res.json();
  return { res, json, setCookie };
}

function parseCookie(setCookie: string[], name: string): string | undefined {
  for (const c of setCookie) {
    const first = c.split(';')[0] ?? '';
    const eq = first.indexOf('=');
    if (eq < 0) continue;
    const key = first.slice(0, eq).trim();
    if (key === name) return first.slice(eq + 1);
  }
  return undefined;
}

function cookieJar(setCookie: string[]): string {
  return setCookie
    .map((c) => c.split(';')[0] ?? '')
    .filter(Boolean)
    .join('; ');
}

const describeMaybe = enabled ? describe : describe.skip;

describeMaybe('auth security integration (requires API + hosted DB)', () => {
  beforeAll(async () => {
    const health = await fetch(`${apiBase}/health`).catch(() => null);
    if (!health?.ok) {
      throw new Error(
        `API not reachable at ${apiBase}. Start with pnpm dev:api before hosted auth tests.`,
      );
    }
  });

  it('rejects missing origin on challenge', async () => {
    const kp = Keypair.generate();
    const res = await fetch(`${apiBase}/api/v1/auth/challenge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ walletAddress: kp.publicKey.toBase58() }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid wallet', async () => {
    const { res, json } = await challenge('not-a-wallet');
    expect(res.status).toBe(400);
    expect(json.error).toBe('invalid_wallet');
  });

  it('rejects forbidden origin', async () => {
    const kp = Keypair.generate();
    const res = await fetch(`${apiBase}/api/v1/auth/challenge`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.example',
      },
      body: JSON.stringify({ walletAddress: kp.publicKey.toBase58() }),
    });
    expect([403, 500]).toContain(res.status);
  });

  it('completes sign-in and sets HttpOnly session cookie', async () => {
    const kp = Keypair.generate();
    const wallet = kp.publicKey.toBase58();
    const { res: cRes, json: c } = await challenge(wallet);
    expect(cRes.status).toBe(200);
    expect(c.message).toContain('does not approve token spending');
    expect(c.message).toContain('solana-devnet');
    expect(c.network).toBe('solana-devnet');

    const signature = signMessage(c.message, kp);
    const { res, json, setCookie } = await verify({
      challengeId: c.challengeId,
      walletAddress: wallet,
      message: c.message,
      signature,
    });
    expect(res.status).toBe(200);
    expect(json.authenticated).toBe(true);
    expect(json.profile?.id).toBeTruthy();
    const sessionCookie = setCookie.find((c) => c.startsWith('armz_clash_session='));
    expect(sessionCookie).toBeTruthy();
    expect(sessionCookie).toMatch(/HttpOnly/i);
    expect(sessionCookie).toMatch(/Path=\//i);
    expect(sessionCookie).toMatch(/SameSite=Lax/i);
  });

  it('rejects wallet B using wallet A challenge', async () => {
    const a = Keypair.generate();
    const b = Keypair.generate();
    const { json: c } = await challenge(a.publicKey.toBase58());
    const signature = signMessage(c.message, a);
    const { res, json } = await verify({
      challengeId: c.challengeId,
      walletAddress: b.publicKey.toBase58(),
      message: c.message,
      signature,
    });
    expect(res.status).toBe(400);
    expect(json.error).toBe('wallet_mismatch');
  });

  it('rejects modified message', async () => {
    const kp = Keypair.generate();
    const wallet = kp.publicKey.toBase58();
    const { json: c } = await challenge(wallet);
    const signature = signMessage(c.message, kp);
    const { res, json } = await verify({
      challengeId: c.challengeId,
      walletAddress: wallet,
      message: `${c.message}\nextra`,
      signature,
    });
    expect(res.status).toBe(400);
    expect(json.error).toBe('message_mismatch');
  });

  it('rejects replay of consumed challenge', async () => {
    const kp = Keypair.generate();
    const wallet = kp.publicKey.toBase58();
    const { json: c } = await challenge(wallet);
    const signature = signMessage(c.message, kp);
    const first = await verify({
      challengeId: c.challengeId,
      walletAddress: wallet,
      message: c.message,
      signature,
    });
    expect(first.res.status).toBe(200);
    const second = await verify({
      challengeId: c.challengeId,
      walletAddress: wallet,
      message: c.message,
      signature,
    });
    expect(second.res.status).toBe(409);
    expect(second.json.error).toBe('challenge_consumed');
  });

  it('allows only one concurrent verify for the same challenge', async () => {
    const kp = Keypair.generate();
    const wallet = kp.publicKey.toBase58();
    const { json: c } = await challenge(wallet);
    const signature = signMessage(c.message, kp);
    const body = {
      challengeId: c.challengeId,
      walletAddress: wallet,
      message: c.message,
      signature,
    };
    const [a, b] = await Promise.all([verify(body), verify(body)]);
    const statuses = [a.res.status, b.res.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  it('isolates wallet A profile from wallet B', async () => {
    const a = Keypair.generate();
    const b = Keypair.generate();

    const ca = await challenge(a.publicKey.toBase58());
    const va = await verify({
      challengeId: ca.json.challengeId,
      walletAddress: a.publicKey.toBase58(),
      message: ca.json.message,
      signature: signMessage(ca.json.message, a),
    });
    expect(va.res.status).toBe(200);
    const profileA = va.json.profile.id as string;
    const cookieA = parseCookie(va.setCookie, 'armz_clash_session');
    expect(cookieA).toBeTruthy();

    const cb = await challenge(b.publicKey.toBase58());
    const vb = await verify({
      challengeId: cb.json.challengeId,
      walletAddress: b.publicKey.toBase58(),
      message: cb.json.message,
      signature: signMessage(cb.json.message, b),
    });
    expect(vb.res.status).toBe(200);
    const profileB = vb.json.profile.id as string;
    expect(profileA).not.toBe(profileB);

    const meA = await fetch(`${apiBase}/api/v1/me`, {
      headers: { cookie: cookieJar(va.setCookie) },
    });
    const meAjson = await meA.json();
    expect(meA.status).toBe(200);
    expect(meAjson.profile.id).toBe(profileA);
    expect(meAjson.walletAddress).toBe(a.publicKey.toBase58());
  });

  it('rejects CSRF mismatch on profile update', async () => {
    const kp = Keypair.generate();
    const wallet = kp.publicKey.toBase58();
    const { json: c } = await challenge(wallet);
    const v = await verify({
      challengeId: c.challengeId,
      walletAddress: wallet,
      message: c.message,
      signature: signMessage(c.message, kp),
    });
    const session = parseCookie(v.setCookie, 'armz_clash_session');
    const csrf = parseCookie(v.setCookie, 'armz_clash_csrf');
    expect(session && csrf).toBeTruthy();

    const jar = cookieJar(v.setCookie);
    const bad = await fetch(`${apiBase}/api/v1/me/profile`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        origin,
        cookie: jar,
        'x-csrf-token': 'wrong',
      },
      body: JSON.stringify({ displayName: 'Hacker' }),
    });
    expect(bad.status).toBe(403);

    const good = await fetch(`${apiBase}/api/v1/me/profile`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        origin,
        cookie: jar,
        'x-csrf-token': csrf!,
      },
      body: JSON.stringify({ displayName: 'ValidName' }),
    });
    expect(good.status).toBe(200);
    const gj = await good.json();
    expect(gj.profile.displayName).toBe('ValidName');
  });

  it('rejects XSS-like display names', async () => {
    const kp = Keypair.generate();
    const wallet = kp.publicKey.toBase58();
    const { json: c } = await challenge(wallet);
    const v = await verify({
      challengeId: c.challengeId,
      walletAddress: wallet,
      message: c.message,
      signature: signMessage(c.message, kp),
    });
    expect(v.res.status).toBe(200);
    const jar = cookieJar(v.setCookie);
    const csrf = parseCookie(v.setCookie, 'armz_clash_csrf');
    expect(csrf).toBeTruthy();
    const res = await fetch(`${apiBase}/api/v1/me/profile`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        origin,
        cookie: jar,
        'x-csrf-token': csrf!,
      },
      body: JSON.stringify({ displayName: '<script>alert(1)</script>' }),
    });
    expect(res.status).toBe(400);
  });

  it('does not rotate session outside renewal window', async () => {
    const kp = Keypair.generate();
    const wallet = kp.publicKey.toBase58();
    const { json: c } = await challenge(wallet);
    const v = await verify({
      challengeId: c.challengeId,
      walletAddress: wallet,
      message: c.message,
      signature: signMessage(c.message, kp),
    });
    expect(v.res.status).toBe(200);
    const jar = cookieJar(v.setCookie);
    const csrf = parseCookie(v.setCookie, 'armz_clash_csrf');
    const session = parseCookie(v.setCookie, 'armz_clash_session');
    expect(session && csrf).toBeTruthy();
    const renew = await fetch(`${apiBase}/api/v1/auth/renew`, {
      method: 'POST',
      headers: {
        origin,
        cookie: jar,
        'x-csrf-token': csrf!,
      },
    });
    const rj = await renew.json();
    expect(renew.status).toBe(200);
    expect(rj.rotated).toBe(false);
    // Old session still valid
    const me = await fetch(`${apiBase}/api/v1/auth/session`, {
      headers: { cookie: jar },
    });
    const mj = await me.json();
    expect(mj.authenticated).toBe(true);
  });

  it('logout revokes session', async () => {
    const kp = Keypair.generate();
    const wallet = kp.publicKey.toBase58();
    const { json: c } = await challenge(wallet);
    const v = await verify({
      challengeId: c.challengeId,
      walletAddress: wallet,
      message: c.message,
      signature: signMessage(c.message, kp),
    });
    const jar = cookieJar(v.setCookie);
    const logout = await fetch(`${apiBase}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { origin, cookie: jar },
    });
    expect(logout.status).toBe(200);
    const me = await fetch(`${apiBase}/api/v1/auth/session`, {
      headers: { cookie: jar },
    });
    const mj = await me.json();
    expect(mj.authenticated).toBe(false);
  });
});
