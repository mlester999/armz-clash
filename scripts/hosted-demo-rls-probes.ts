/**
 * Hosted Demo Mode RLS probes against armz-clash-dev.
 * Requires:
 *   SUPABASE_REMOTE_WRITES_APPROVED=true
 *   RUN_HOSTED_SUPABASE_TESTS=true
 *   NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Never prints secret values. A pass means the operation was denied as intended.
 */
import { createClient } from '@supabase/supabase-js';
import { loadRootEnv } from './load-root-env.ts';

loadRootEnv();

const approved = process.env.SUPABASE_REMOTE_WRITES_APPROVED === 'true';
const enabled = process.env.RUN_HOSTED_SUPABASE_TESTS === 'true';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

type Result = { name: string; ok: boolean; detail: string };

function denied(error: { message?: string; code?: string } | null, data: unknown): boolean {
  if (error) return true;
  if (data == null) return true;
  if (Array.isArray(data) && data.length === 0) return true;
  return false;
}

async function main() {
  if (!enabled) {
    console.log('SKIP: set RUN_HOSTED_SUPABASE_TESTS=true to run hosted demo RLS probes');
    process.exit(0);
  }
  if (!approved) {
    console.error('FAIL: SUPABASE_REMOTE_WRITES_APPROVED must be true for hosted probes');
    process.exit(1);
  }
  if (!url || !anon) {
    console.error('FAIL: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const results: Result[] = [];
  const tables = ['demo_sessions', 'demo_armz', 'demo_battles', 'demo_reward_events'] as const;

  for (const table of tables) {
    const select = await client.from(table).select('*').limit(5);
    results.push({
      name: `anon cannot read ${table}`,
      ok: denied(select.error, select.data),
      detail:
        select.error?.code ?? (Array.isArray(select.data) ? `rows=${select.data.length}` : 'empty'),
    });

    const insert = await client.from(table).insert({ id: '00000000-0000-0000-0000-000000000099' });
    results.push({
      name: `anon cannot insert ${table}`,
      ok: Boolean(insert.error),
      detail: insert.error?.code ?? insert.error?.message ?? 'unexpected success',
    });

    const update = await client
      .from(table)
      .update({ updated_at: new Date().toISOString() } as never)
      .eq('id', '00000000-0000-0000-0000-000000000001');
    results.push({
      name: `anon cannot update ${table}`,
      ok: Boolean(update.error) || (update.count ?? 0) === 0,
      detail: update.error?.code ?? 'no rows / denied',
    });

    const del = await client.from(table).delete().eq('id', '00000000-0000-0000-0000-000000000001');
    results.push({
      name: `anon cannot delete ${table}`,
      ok: Boolean(del.error) || (del.count ?? 0) === 0,
      detail: del.error?.code ?? 'no rows / denied',
    });
  }

  // Specific dangerous mutations
  const sessionTamper = await client
    .from('demo_sessions')
    .update({ battles_played: 0, expires_at: '2099-01-01T00:00:00Z' } as never, {
      count: 'exact',
    })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  results.push({
    name: 'anon cannot change demo session battle counts or expiry',
    ok: Boolean(sessionTamper.error) || (sessionTamper.count ?? 0) === 0,
    detail: sessionTamper.error?.code ?? `rows_affected=${sessionTamper.count ?? 0} (RLS filtered)`,
  });

  const armzTamper = await client
    .from('demo_armz')
    .update({ rarity: 'legendary', level: 99, power: 999 } as never, { count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  results.push({
    name: 'anon cannot change demo ARMZ stats/rarity/level',
    ok: Boolean(armzTamper.error) || (armzTamper.count ?? 0) === 0,
    detail: armzTamper.error?.code ?? `rows_affected=${armzTamper.count ?? 0} (RLS filtered)`,
  });

  const battleWinner = await client
    .from('demo_battles')
    .update({ outcome: 'victory' } as never, { count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  results.push({
    name: 'anon cannot submit or modify battle winner',
    ok: Boolean(battleWinner.error) || (battleWinner.count ?? 0) === 0,
    detail: battleWinner.error?.code ?? `rows_affected=${battleWinner.count ?? 0} (RLS filtered)`,
  });

  const rewardInsert = await client.from('demo_reward_events').insert({
    demo_session_id: '00000000-0000-0000-0000-000000000001',
    demo_battle_id: '00000000-0000-0000-0000-000000000002',
    demo_units: 9_999_999,
  } as never);
  results.push({
    name: 'anon cannot submit simulated reward events',
    ok: Boolean(rewardInsert.error),
    detail: rewardInsert.error?.code ?? 'unexpected success',
  });

  let fail = 0;
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name} — ${r.detail}`);
    if (!r.ok) fail += 1;
  }
  console.log(`\nHosted demo RLS probes: ${results.length - fail} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Probe runner failed:', err instanceof Error ? err.message : 'unknown');
  process.exit(1);
});
