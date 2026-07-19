import type { BalancePayload, SessionPayload } from './types';

export function createAuthApi(baseUrl: string) {
  const root = baseUrl.replace(/\/$/, '');

  async function request<T>(path: string, init: RequestInit & { csrf?: string } = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('content-type', 'application/json');
    if (init.csrf) headers.set('x-csrf-token', init.csrf);
    const res = await fetch(`${root}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });
    const data = (await res.json().catch(() => ({}))) as T & {
      error?: string;
      message?: string;
    };
    if (!res.ok) {
      throw new Error(data.message || data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  return {
    challenge(walletAddress: string, uri?: string) {
      return request<{
        challengeId: string;
        message: string;
        issuedAt: string;
        expiresAt: string;
        network: string;
      }>('/api/v1/auth/challenge', {
        method: 'POST',
        body: JSON.stringify({ walletAddress, uri }),
      });
    },
    verify(input: {
      challengeId: string;
      walletAddress: string;
      message: string;
      signature: string;
      signatureEncoding?: 'base58' | 'base64';
    }) {
      return request<SessionPayload & { authenticated: true }>('/api/v1/auth/verify', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    session() {
      return request<SessionPayload>('/api/v1/auth/session');
    },
    renew(csrf: string) {
      return request<SessionPayload>('/api/v1/auth/renew', { method: 'POST', csrf });
    },
    logout() {
      return request<{ loggedOut: boolean }>('/api/v1/auth/logout', { method: 'POST' });
    },
    me() {
      return request<{ profile: SessionPayload['profile']; walletAddress: string }>('/api/v1/me');
    },
    updateProfile(csrf: string, body: { displayName?: string; avatarPreset?: string }) {
      return request<{ profile: NonNullable<SessionPayload['profile']> }>('/api/v1/me/profile', {
        method: 'PATCH',
        csrf,
        body: JSON.stringify(body),
      });
    },
    balances() {
      return request<BalancePayload>('/api/v1/wallet/balances');
    },
  };
}

export function readCsrfCookie(name = 'armz_clash_csrf'): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export function truncateWalletAddress(address: string, size = 4): string {
  if (address.length <= size * 2 + 1) return address;
  return `${address.slice(0, size)}…${address.slice(-size)}`;
}
