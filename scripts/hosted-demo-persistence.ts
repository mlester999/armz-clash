/**
 * True hosted Demo Mode persistence validation (database mode only).
 * Requires:
 *   SUPABASE_REMOTE_WRITES_APPROVED=true
 *   RUN_HOSTED_SUPABASE_TESTS=true
 *   ARMZ_DEMO_PERSISTENCE_MODE=database
 *   API reachable at NEXT_PUBLIC_ARMZ_API_URL (default 127.0.0.1:4000)
 *   Phase 3 tables migrated on armz-clash-dev
 *
 * Never prints secrets or session tokens.
 */
import { loadRootEnv } from './load-root-env.ts';

loadRootEnv();

const approved = process.env.SUPABASE_REMOTE_WRITES_APPROVED === 'true';
const enabled = process.env.RUN_HOSTED_SUPABASE_TESTS === 'true';
const mode = process.env.ARMZ_DEMO_PERSISTENCE_MODE ?? 'database';
const api = (process.env.NEXT_PUBLIC_ARMZ_API_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const origin = process.env.ARMZ_GAME_ORIGIN || 'http://127.0.0.1:3001';

function parseSetCookie(header: string | null): string {
  if (!header) return '';
  // Node fetch may join multiple set-cookie; take demo session only.
  const parts = header.split(/,(?=\s*[^;]+=)/);
  const demo = parts.find((p) => p.toLowerCase().includes('armz_clash_demo_session='));
  if (!demo) return '';
  return demo.split(';')[0]!.trim();
}

async function main() {
  if (!enabled) {
    console.log('SKIP: set RUN_HOSTED_SUPABASE_TESTS=true for hosted demo persistence tests');
    process.exit(0);
  }
  if (!approved) {
    console.error('FAIL: SUPABASE_REMOTE_WRITES_APPROVED must be true');
    process.exit(1);
  }
  if (mode !== 'database') {
    console.error('FAIL: ARMZ_DEMO_PERSISTENCE_MODE must be database for this suite');
    process.exit(1);
  }

  const results: Array<{ name: string; ok: boolean; detail: string }> = [];

  const health = await fetch(`${api}/health`);
  results.push({
    name: 'API health',
    ok: health.ok,
    detail: `status ${health.status}`,
  });

  const config = await fetch(`${api}/api/v1/demo/config`);
  const configBody = (await config.json().catch(() => ({}))) as {
    demoModeEnabled?: boolean;
    demoPersistence?: string;
    demoPersistenceHealthy?: boolean;
  };
  results.push({
    name: 'Demo config enabled',
    ok: config.ok && configBody.demoModeEnabled === true,
    detail: `enabled=${configBody.demoModeEnabled}`,
  });
  results.push({
    name: 'Demo persistence is Database',
    ok: configBody.demoPersistence === 'Database',
    detail: `label=${configBody.demoPersistence}`,
  });
  results.push({
    name: 'Demo persistence healthy',
    ok: configBody.demoPersistenceHealthy === true,
    detail: `healthy=${configBody.demoPersistenceHealthy}`,
  });

  const sessionRes = await fetch(`${api}/api/v1/demo/session`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: '{}',
  });
  const setCookie = sessionRes.headers.get('set-cookie');
  const cookie = parseSetCookie(setCookie);
  const sessionBody = (await sessionRes.json().catch(() => ({}))) as {
    armz?: { demoArmzId?: string; rarity?: string; temporary?: boolean };
    session?: { demoSessionId?: string };
    isNew?: boolean;
  };
  results.push({
    name: 'Create demo session',
    ok: sessionRes.ok && Boolean(sessionBody.armz?.demoArmzId),
    detail: `status ${sessionRes.status} rarity=${sessionBody.armz?.rarity}`,
  });
  results.push({
    name: 'Demo session cookie set',
    ok: cookie.toLowerCase().includes('armz_clash_demo_session='),
    detail: cookie ? 'cookie present (value redacted)' : 'missing',
  });
  results.push({
    name: 'Temporary Common ARMZ',
    ok: sessionBody.armz?.rarity === 'common' && sessionBody.armz?.temporary === true,
    detail: `rarity=${sessionBody.armz?.rarity} temporary=${sessionBody.armz?.temporary}`,
  });

  const restore = await fetch(`${api}/api/v1/demo/session`, {
    headers: { origin, cookie },
  });
  const restoreBody = (await restore.json().catch(() => ({}))) as {
    armz?: { demoArmzId?: string };
    session?: { demoSessionId?: string };
  };
  results.push({
    name: 'Restore session via cookie',
    ok:
      restore.ok &&
      restoreBody.armz?.demoArmzId === sessionBody.armz?.demoArmzId &&
      restoreBody.session?.demoSessionId === sessionBody.session?.demoSessionId,
    detail: restore.ok ? 'same session+armz' : `status ${restore.status}`,
  });

  const idem = `hosted-persist-${Date.now()}`;
  const battle1 = await fetch(`${api}/api/v1/demo/battle`, {
    method: 'POST',
    headers: {
      origin,
      cookie,
      'content-type': 'application/json',
      'idempotency-key': idem,
    },
    body: JSON.stringify({ idempotencyKey: idem, reducedMotion: true }),
  });
  const battle1Body = (await battle1.json().catch(() => ({}))) as {
    battleId?: string;
    outcome?: string;
  };
  results.push({
    name: 'Create battle persisted',
    ok: battle1.ok && Boolean(battle1Body.battleId),
    detail: `status ${battle1.status} outcome=${battle1Body.outcome}`,
  });

  const battle2 = await fetch(`${api}/api/v1/demo/battle`, {
    method: 'POST',
    headers: {
      origin,
      cookie,
      'content-type': 'application/json',
      'idempotency-key': idem,
    },
    body: JSON.stringify({ idempotencyKey: idem, reducedMotion: true }),
  });
  const battle2Body = (await battle2.json().catch(() => ({}))) as { battleId?: string };
  results.push({
    name: 'Idempotent battle returns same id',
    ok: battle2.ok && battle2Body.battleId === battle1Body.battleId,
    detail:
      battle2Body.battleId === battle1Body.battleId
        ? 'same battleId'
        : `b1≠b2 status=${battle2.status}`,
  });

  const history = await fetch(`${api}/api/v1/demo/history`, {
    headers: { origin, cookie },
  });
  const historyBody = (await history.json().catch(() => ({}))) as {
    history?: unknown[];
  };
  results.push({
    name: 'Battle history persisted',
    ok: history.ok && Array.isArray(historyBody.history) && historyBody.history.length >= 1,
    detail: `entries=${Array.isArray(historyBody.history) ? historyBody.history.length : 0}`,
  });

  // Confirm no silent memory mode in public status.
  results.push({
    name: 'Not using silent memory fallback',
    ok: configBody.demoPersistence === 'Database' && configBody.demoPersistenceHealthy === true,
    detail: `persistence=${configBody.demoPersistence}`,
  });

  let fail = 0;
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name} — ${r.detail}`);
    if (!r.ok) fail += 1;
  }
  console.log(`\nHosted demo persistence: ${results.length - fail} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Hosted demo persistence failed:', err instanceof Error ? err.message : 'unknown');
  process.exit(1);
});
