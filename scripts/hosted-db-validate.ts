/**
 * Hosted Supabase schema / feature-flag / admin validation.
 * Requires RUN_HOSTED_SUPABASE_TESTS=true and service-role credentials.
 * Never logs secret values.
 */
import { createClient } from '@supabase/supabase-js';
import { loadDotEnv } from './load-env.ts';

loadDotEnv();

const REQUIRED_TABLES = [
  'app_config_versions',
  'system_feature_flags',
  'admin_roles',
  'admin_permissions',
  'admin_role_permissions',
  'admin_role_assignments',
  'admin_audit_logs',
  'reconciliation_runs',
] as const;

const EXPECTED_FLAGS: Record<string, boolean> = {
  demo_mode_enabled: true,
  real_mint_enabled: false,
  real_rewards_enabled: false,
  claims_enabled: false,
  marketplace_enabled: false,
  marketplace_settlement_enabled: false,
  oracle_enabled: false,
  mainnet_enabled: false,
  admin_economy_writes_enabled: false,
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

async function main() {
  if (process.env.RUN_HOSTED_SUPABASE_TESTS !== 'true') {
    console.log('SKIP: RUN_HOSTED_SUPABASE_TESTS is not true');
    process.exit(0);
  }

  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let failed = 0;
  const pass = (label: string) => console.log(`PASS: ${label}`);
  const fail = (label: string, detail?: string) => {
    console.error(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  };

  // Table existence via service-role selects
  for (const table of REQUIRED_TABLES) {
    const { error } = await admin.from(table).select('*').limit(1);
    if (error) {
      fail(`table exists: ${table}`, error.message);
    } else {
      pass(`table exists: ${table}`);
    }
  }

  // Feature flags
  const { data: flags, error: flagsError } = await admin
    .from('system_feature_flags')
    .select('key, enabled');
  if (flagsError) {
    fail('read system_feature_flags', flagsError.message);
  } else {
    const map = new Map((flags ?? []).map((row) => [row.key as string, row.enabled as boolean]));
    for (const [key, expected] of Object.entries(EXPECTED_FLAGS)) {
      const actual = map.get(key);
      if (actual === undefined) {
        fail(`feature flag present: ${key}`);
      } else if (actual !== expected) {
        fail(`feature flag ${key}`, `expected ${expected}, got ${actual}`);
      } else {
        pass(`feature flag ${key}=${expected}`);
      }
    }
  }

  // No default admin assignments
  const { count: assignmentCount, error: assignError } = await admin
    .from('admin_role_assignments')
    .select('*', { count: 'exact', head: true })
    .is('revoked_at', null);
  if (assignError) {
    fail('count admin_role_assignments', assignError.message);
  } else if ((assignmentCount ?? 0) > 0) {
    fail('no default admin assignments', `found ${assignmentCount} active assignments`);
  } else {
    pass('no default admin assignments');
  }

  // Role catalog size sanity
  const { data: roles, error: rolesError } = await admin.from('admin_roles').select('key');
  if (rolesError) {
    fail('read admin_roles', rolesError.message);
  } else {
    const keys = (roles ?? []).map((r) => r.key);
    const required = [
      'super_admin',
      'game_administrator',
      'economy_manager',
      'live_operations_manager',
      'blockchain_operator',
      'marketplace_manager',
      'customer_support',
      'fraud_risk_analyst',
      'read_only_analyst',
    ];
    for (const key of required) {
      if (!keys.includes(key)) fail(`admin role exists: ${key}`);
      else pass(`admin role exists: ${key}`);
    }
  }

  // RLS enabled check via pg_catalog (service role RPC not available — use SQL if DB URL present)
  const dbUrl = process.env.SUPABASE_DATABASE_URL;
  if (dbUrl) {
    try {
      const { default: pg } = await import('pg');
      const client = new pg.Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      const rls = await client.query<{
        relname: string;
        relrowsecurity: boolean;
        relforcerowsecurity: boolean;
      }>(
        `select c.relname, c.relrowsecurity, c.relforcerowsecurity
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public'
           and c.relname = any($1::text[])
         order by c.relname`,
        [REQUIRED_TABLES as unknown as string[]],
      );
      for (const row of rls.rows) {
        if (!row.relrowsecurity) fail(`RLS enabled: ${row.relname}`);
        else pass(`RLS enabled: ${row.relname}`);
        if (!row.relforcerowsecurity) fail(`RLS forced: ${row.relname}`);
        else pass(`RLS forced: ${row.relname}`);
      }

      // Broad write policy check
      const policies = await client.query<{
        tablename: string;
        policyname: string;
        cmd: string;
        qual: string | null;
        with_check: string | null;
      }>(
        `select tablename, policyname, cmd, qual, with_check
         from pg_policies
         where schemaname = 'public'
           and tablename = any($1::text[])`,
        [REQUIRED_TABLES as unknown as string[]],
      );
      for (const p of policies.rows) {
        const isWrite = ['INSERT', 'UPDATE', 'DELETE', 'ALL'].includes(p.cmd);
        if (isWrite && (p.qual === 'true' || p.with_check === 'true')) {
          fail(`no broad write policy on ${p.tablename}`, p.policyname);
        }
      }
      pass(`policy inventory reviewed (${policies.rows.length} policies)`);

      await client.end();
    } catch (error) {
      fail(
        'direct SQL RLS inspection',
        error instanceof Error ? error.message : 'unknown SQL error',
      );
    }
  } else {
    console.log('NOTE: SUPABASE_DATABASE_URL missing — skipped direct SQL RLS force checks');
  }

  if (failed > 0) {
    console.error(`Hosted validation failed with ${failed} error(s).`);
    process.exit(1);
  }
  console.log('Hosted database validation passed.');
}

main().catch((error) => {
  console.error('Hosted validation crashed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
