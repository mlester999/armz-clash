/**
 * RLS probes for Phase 2 auth tables (anon must not read/write).
 */
import { createClient } from '@supabase/supabase-js';
import { loadDotEnv } from './load-env.ts';

loadDotEnv();

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function main() {
  if (process.env.RUN_HOSTED_SUPABASE_TESTS !== 'true') {
    console.log('SKIP: RUN_HOSTED_SUPABASE_TESTS is not true');
    process.exit(0);
  }

  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tables = [
    'players',
    'wallet_accounts',
    'auth_challenges',
    'player_sessions',
    'auth_audit_events',
  ] as const;

  let failed = 0;
  for (const table of tables) {
    const { data, error } = await anon.from(table).select('*').limit(5);
    const emptyOrDenied = Boolean(error) || (Array.isArray(data) && data.length === 0);
    // With FORCE RLS and no policies, PostgREST may error or return empty.
    if (!emptyOrDenied && Array.isArray(data) && data.length > 0) {
      console.error(`FAIL: anon can read rows from ${table}`);
      failed += 1;
    } else {
      console.log(`PASS: anon cannot read ${table} (${error?.code ?? 'empty'})`);
    }

    const insert = await anon.from(table).insert({} as never);
    if (!insert.error) {
      console.error(`FAIL: anon insert succeeded on ${table}`);
      failed += 1;
    } else {
      console.log(`PASS: anon cannot insert ${table}`);
    }
  }

  // Service role can count tables
  for (const table of tables) {
    const { error } = await admin.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`FAIL: service role cannot access ${table}: ${error.message}`);
      failed += 1;
    } else {
      console.log(`PASS: service role can access ${table}`);
    }
  }

  // No default sessions / no default admin from phase1
  const { count: sessions } = await admin
    .from('player_sessions')
    .select('*', { count: 'exact', head: true })
    .is('revoked_at', null);
  console.log(`NOTE: active sessions count=${sessions ?? 0} (may be >0 from tests)`);

  if (failed > 0) {
    console.error(`Auth RLS probes failed: ${failed}`);
    process.exit(1);
  }
  console.log('Auth RLS probes passed.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
