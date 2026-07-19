/**
 * Local development doctor — checks config and connectivity without printing secrets.
 *
 * Usage: pnpm doctor
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadRootEnv, findMonorepoRoot } from './load-root-env.ts';
import { loadClientEnv } from '../packages/config/src/env/client.ts';
import { loadServerEnv } from '../packages/config/src/env/server.ts';
import { loadAuthConfig, allowedAuthOrigins } from '../packages/config/src/auth.ts';

type Result = { level: 'PASS' | 'WARN' | 'FAIL'; label: string; detail?: string };

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function probe(url: string, timeoutMs = 2500): Promise<{ ok: boolean; status?: number }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  loadRootEnv();
  const results: Result[] = [];
  const root = findMonorepoRoot() ?? process.cwd();

  const client = loadClientEnv();
  const server = loadServerEnv();
  const auth = loadAuthConfig();
  const playerOrigins = allowedAuthOrigins(auth);

  const reownConfigured = Boolean(client.NEXT_PUBLIC_REOWN_PROJECT_ID.trim());
  results.push({
    level: reownConfigured ? 'PASS' : 'WARN',
    label: 'Reown Project ID configured',
    detail: reownConfigured ? 'present (value not printed)' : 'missing — wallet modal disabled',
  });

  results.push({
    level: client.NEXT_PUBLIC_ARMZ_API_URL ? 'PASS' : 'FAIL',
    label: 'API URL configured',
    detail: client.NEXT_PUBLIC_ARMZ_API_URL,
  });
  results.push({
    level: client.NEXT_PUBLIC_ARMZ_WEB_URL ? 'PASS' : 'FAIL',
    label: 'Web URL configured',
    detail: client.NEXT_PUBLIC_ARMZ_WEB_URL,
  });
  results.push({
    level: client.NEXT_PUBLIC_ARMZ_GAME_URL ? 'PASS' : 'FAIL',
    label: 'Game URL configured',
    detail: client.NEXT_PUBLIC_ARMZ_GAME_URL,
  });

  results.push({
    level: client.NEXT_PUBLIC_ARMZ_NETWORK === 'devnet' ? 'PASS' : 'WARN',
    label: 'Network is devnet',
    detail: client.NEXT_PUBLIC_ARMZ_NETWORK,
  });

  const hosts = [
    hostnameOf(client.NEXT_PUBLIC_ARMZ_API_URL),
    hostnameOf(client.NEXT_PUBLIC_ARMZ_WEB_URL),
    hostnameOf(client.NEXT_PUBLIC_ARMZ_GAME_URL),
    hostnameOf(auth.webOrigin),
    hostnameOf(auth.gameOrigin),
    hostnameOf(auth.adminOrigin),
    hostnameOf(auth.apiOrigin),
  ].filter(Boolean) as string[];

  const hasLocalhost = hosts.some((h) => h === 'localhost');
  const hasLoopback = hosts.some((h) => h === '127.0.0.1');
  if (hasLocalhost && hasLoopback) {
    results.push({
      level: 'FAIL',
      label: 'No localhost/127.0.0.1 mismatch',
      detail: 'Mixed hostnames detected — use 127.0.0.1 everywhere for local CORS',
    });
  } else if (hasLocalhost && !hasLoopback) {
    results.push({
      level: 'WARN',
      label: 'Local hostname consistency',
      detail: 'Using localhost; project standard is 127.0.0.1',
    });
  } else {
    results.push({
      level: 'PASS',
      label: 'No localhost/127.0.0.1 mismatch',
      detail: hasLoopback ? '127.0.0.1 consistent' : 'non-local hosts',
    });
  }

  results.push({
    level: server.features.demoModeEnabled ? 'PASS' : 'WARN',
    label: 'Demo Mode enabled',
    detail: String(server.features.demoModeEnabled),
  });
  results.push({
    level: !server.features.mainnetEnabled ? 'PASS' : 'FAIL',
    label: 'Mainnet disabled',
  });
  results.push({
    level: !server.features.realMintEnabled ? 'PASS' : 'FAIL',
    label: 'Real mint disabled',
  });
  results.push({
    level: !server.features.realRewardsEnabled ? 'PASS' : 'FAIL',
    label: 'Real rewards disabled',
  });
  results.push({
    level: !server.features.claimsEnabled ? 'PASS' : 'FAIL',
    label: 'Claims disabled',
  });
  results.push({
    level: !server.features.marketplaceSettlementEnabled ? 'PASS' : 'FAIL',
    label: 'Marketplace settlement disabled',
  });

  const supabasePublic =
    Boolean(client.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(client.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  results.push({
    level: supabasePublic ? 'PASS' : 'WARN',
    label: 'Supabase public configuration present',
    detail: supabasePublic ? 'url+anon present' : 'optional for pure local foundation',
  });

  const authSecrets =
    Boolean(server.ARMZ_SESSION_SIGNING_SECRET?.trim()) &&
    Boolean(server.ARMZ_WALLET_NONCE_SECRET?.trim());
  results.push({
    level: authSecrets ? 'PASS' : 'WARN',
    label: 'Required server secrets present for API auth',
    detail: authSecrets ? 'session+nonce secrets set' : 'missing — wallet auth will fail',
  });

  const tokenMint = Boolean(client.NEXT_PUBLIC_ARMZ_TOKEN_MINT?.trim());
  results.push({
    level: tokenMint ? 'PASS' : 'WARN',
    label: 'ARMZ token mint configured',
    detail: tokenMint ? 'present' : 'not configured (expected until later phases)',
  });

  const gameEnvLocal = existsSync(path.join(root, 'apps/game/.env.local'));
  const webEnvLocal = existsSync(path.join(root, 'apps/web/.env.local'));
  results.push({
    level: gameEnvLocal || reownConfigured ? 'PASS' : 'WARN',
    label: 'Game public env available',
    detail: gameEnvLocal
      ? 'apps/game/.env.local present'
      : 'root .env / next.config load monorepo public vars',
  });
  results.push({
    level: webEnvLocal || reownConfigured ? 'PASS' : 'WARN',
    label: 'Web public env available',
    detail: webEnvLocal
      ? 'apps/web/.env.local present'
      : 'root .env / next.config load monorepo public vars',
  });

  const apiBase = client.NEXT_PUBLIC_ARMZ_API_URL.replace(/\/$/, '');
  const health = await probe(`${apiBase}/health`);
  results.push({
    level: health.ok ? 'PASS' : 'WARN',
    label: 'API reachable on configured URL',
    detail: health.ok
      ? `${apiBase}/health OK`
      : `${apiBase}/health not reachable — run pnpm dev:api`,
  });

  if (health.ok) {
    const ready = await probe(`${apiBase}/ready`);
    results.push({
      level: ready.ok || ready.status === 503 ? 'PASS' : 'WARN',
      label: 'API readiness endpoint responds',
      detail: ready.status ? `status ${ready.status}` : 'no response',
    });

    try {
      const corsRes = await fetch(`${apiBase}/api/v1/config/public`, {
        headers: { Origin: auth.gameOrigin },
      });
      const allow = corsRes.headers.get('access-control-allow-origin');
      const corsOk = allow === auth.gameOrigin;
      results.push({
        level: corsOk ? 'PASS' : 'FAIL',
        label: 'Game origin allowed by CORS',
        detail: corsOk
          ? `Access-Control-Allow-Origin: ${allow}`
          : `expected ${auth.gameOrigin}, got ${allow ?? '(none)'}`,
      });
    } catch {
      results.push({
        level: 'WARN',
        label: 'Game origin allowed by CORS',
        detail: 'could not complete CORS probe',
      });
    }

    results.push({
      level: playerOrigins.includes(auth.gameOrigin) ? 'PASS' : 'FAIL',
      label: 'Player origins include game',
      detail: playerOrigins.join(', '),
    });
  }

  let fail = 0;
  let warn = 0;
  for (const r of results) {
    const line = r.detail ? `${r.level} ${r.label} — ${r.detail}` : `${r.level} ${r.label}`;
    console.log(line);
    if (r.level === 'FAIL') fail += 1;
    if (r.level === 'WARN') warn += 1;
  }

  console.log('');
  console.log(`Doctor complete: ${results.length - fail - warn} pass, ${warn} warn, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Doctor failed:', err instanceof Error ? err.message : 'unknown');
  process.exit(1);
});
