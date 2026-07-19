/**
 * Live RLS probes against hosted Supabase.
 * Requires RUN_HOSTED_SUPABASE_TESTS=true.
 *
 * Note: PostgREST often returns HTTP 200 with zero affected rows for UPDATE/DELETE
 * when RLS filters all rows. Probes therefore use canary rows and verify no mutation.
 */
import { createClient } from '@supabase/supabase-js';
import { loadDotEnv } from './load-env.ts';

loadDotEnv();

type ProbeResult = { name: string; ok: boolean; detail: string };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function isDenied(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return (
    error.code === '42501' ||
    error.code === 'PGRST301' ||
    error.code === 'PGRST116' ||
    msg.includes('permission') ||
    msg.includes('policy') ||
    msg.includes('row-level security') ||
    msg.includes('rls') ||
    msg.includes('not allowed') ||
    msg.includes('forbidden')
  );
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

  const results: ProbeResult[] = [];

  // --- admin_roles insert denied ---
  {
    const { error } = await anon.from('admin_roles').insert({
      key: 'probe_role_should_fail',
      display_name: 'Probe',
    });
    results.push({
      name: 'anon: cannot insert admin_roles',
      ok: isDenied(error),
      detail: error ? `denied (${error.code ?? 'no-code'})` : 'request unexpectedly succeeded',
    });
  }

  // --- canary role for update/delete mutation checks ---
  const canaryRole = `probe_rls_${Date.now()}`;
  {
    const { error: createError } = await admin.from('admin_roles').insert({
      key: canaryRole,
      display_name: 'RLS Probe Canary',
      description: 'Temporary canary for Phase 1.1 RLS probes',
      is_system: false,
    });
    if (createError) {
      results.push({
        name: 'setup: create canary admin role',
        ok: false,
        detail: createError.message,
      });
    } else {
      results.push({
        name: 'setup: create canary admin role',
        ok: true,
        detail: 'created',
      });

      const { error: updateError } = await anon
        .from('admin_roles')
        .update({ display_name: 'TAMPERED' })
        .eq('key', canaryRole);
      const { data: afterUpdate } = await admin
        .from('admin_roles')
        .select('display_name')
        .eq('key', canaryRole)
        .maybeSingle();
      const updateBlocked =
        afterUpdate?.display_name === 'RLS Probe Canary' &&
        (isDenied(updateError) || updateError === null);
      results.push({
        name: 'anon: cannot update admin_roles',
        ok: Boolean(updateBlocked && afterUpdate?.display_name !== 'TAMPERED'),
        detail: updateBlocked
          ? `mutation blocked (postgrest error=${updateError?.code ?? 'none'})`
          : `unexpected mutation result: ${afterUpdate?.display_name ?? 'missing'}`,
      });

      const { error: deleteError } = await anon.from('admin_roles').delete().eq('key', canaryRole);
      const { data: afterDelete } = await admin
        .from('admin_roles')
        .select('key')
        .eq('key', canaryRole)
        .maybeSingle();
      results.push({
        name: 'anon: cannot delete admin_roles',
        ok: Boolean(afterDelete?.key === canaryRole),
        detail:
          afterDelete?.key === canaryRole
            ? `row retained (postgrest error=${deleteError?.code ?? 'none'})`
            : 'canary row was deleted by anon',
      });

      await admin.from('admin_roles').delete().eq('key', canaryRole);
    }
  }

  // --- sensitive reads ---
  for (const table of ['admin_role_assignments', 'admin_audit_logs'] as const) {
    const { data, error } = await anon.from(table).select('*').limit(5);
    const denied = isDenied(error) || (Array.isArray(data) && data.length === 0 && !error);
    // Empty without error can be RLS filter; for these tables empty is also expected.
    // Prefer deny-or-empty AND ensure service role can still read structure.
    results.push({
      name: `anon: cannot read ${table}`,
      ok: Boolean(denied),
      detail: error
        ? `denied (${error.code ?? 'no-code'})`
        : `empty under RLS (${(data as unknown[] | null)?.length ?? 0} rows)`,
    });
  }

  // --- feature flag mutation denied ---
  {
    const { data: before } = await admin
      .from('system_feature_flags')
      .select('enabled')
      .eq('key', 'mainnet_enabled')
      .maybeSingle();
    const { error } = await anon
      .from('system_feature_flags')
      .update({ enabled: true })
      .eq('key', 'mainnet_enabled');
    const { data: after } = await admin
      .from('system_feature_flags')
      .select('enabled')
      .eq('key', 'mainnet_enabled')
      .maybeSingle();
    const stillFalse = after?.enabled === false;
    results.push({
      name: 'anon: cannot mutate system_feature_flags',
      ok: stillFalse && (isDenied(error) || error === null),
      detail: stillFalse
        ? `flag remains false (before=${String(before?.enabled)})`
        : 'flag was changed by anon',
    });
  }

  // --- admin_role_assignments insert denied ---
  {
    const { error } = await anon.from('admin_role_assignments').insert({
      user_id: '00000000-0000-0000-0000-000000000001',
      role_key: 'super_admin',
    });
    results.push({
      name: 'anon: cannot insert admin_role_assignments',
      ok: isDenied(error),
      detail: error ? `denied (${error.code ?? 'no-code'})` : 'request unexpectedly succeeded',
    });
  }

  // --- audit log append/update/delete ---
  {
    const { error: insertError } = await anon.from('admin_audit_logs').insert({
      action: 'probe',
      succeeded: true,
    });
    results.push({
      name: 'anon: cannot insert admin_audit_logs',
      ok: isDenied(insertError),
      detail: insertError
        ? `denied (${insertError.code ?? 'no-code'})`
        : 'request unexpectedly succeeded',
    });

    const { data: canary, error: canaryError } = await admin
      .from('admin_audit_logs')
      .insert({
        action: 'rls_probe_canary',
        succeeded: true,
        reason: 'phase1.1 probe',
      })
      .select('id, action')
      .maybeSingle();

    if (canaryError || !canary?.id) {
      results.push({
        name: 'setup: create canary audit log',
        ok: false,
        detail: canaryError?.message ?? 'missing canary id',
      });
    } else {
      results.push({
        name: 'setup: create canary audit log',
        ok: true,
        detail: 'created',
      });

      const { error: updateError } = await anon
        .from('admin_audit_logs')
        .update({ action: 'tampered' })
        .eq('id', canary.id);
      const { data: afterUpdate } = await admin
        .from('admin_audit_logs')
        .select('action')
        .eq('id', canary.id)
        .maybeSingle();
      results.push({
        name: 'anon: cannot update admin_audit_logs',
        ok: afterUpdate?.action === 'rls_probe_canary',
        detail:
          afterUpdate?.action === 'rls_probe_canary'
            ? `row unchanged (postgrest error=${updateError?.code ?? 'none'})`
            : `row changed to ${afterUpdate?.action ?? 'missing'}`,
      });

      const { error: deleteError } = await anon
        .from('admin_audit_logs')
        .delete()
        .eq('id', canary.id);
      const { data: afterDelete } = await admin
        .from('admin_audit_logs')
        .select('id')
        .eq('id', canary.id)
        .maybeSingle();
      results.push({
        name: 'anon: cannot delete admin_audit_logs',
        ok: Boolean(afterDelete?.id),
        detail: afterDelete?.id
          ? `row retained (postgrest error=${deleteError?.code ?? 'none'})`
          : 'canary audit row deleted by anon',
      });

      // Cleanup canary with service role (allowed for ops; not an open client path)
      await admin.from('admin_audit_logs').delete().eq('id', canary.id);
    }
  }

  // --- public feature flags readable ---
  {
    const { data, error } = await anon
      .from('system_feature_flags')
      .select('key, enabled')
      .in('key', ['demo_mode_enabled', 'mainnet_enabled', 'real_mint_enabled']);
    results.push({
      name: 'anon: can read public feature flags',
      ok: !error && Array.isArray(data) && data.length >= 1,
      detail: error ? error.message : `readable (${data?.length ?? 0} rows)`,
    });
  }

  console.log(
    'NOTE: authenticated ordinary-user probes require a seeded non-admin auth user (not created in Phase 1.1).',
  );
  console.log(
    'NOTE: FORCE RLS without write policies blocks authenticated writes the same way as anon for these tables.',
  );

  let failed = 0;
  for (const result of results) {
    if (result.ok) console.log(`PASS: ${result.name} — ${result.detail}`);
    else {
      console.error(`FAIL: ${result.name} — ${result.detail}`);
      failed += 1;
    }
  }

  if (failed > 0) {
    console.error(`RLS probes failed: ${failed}`);
    process.exit(1);
  }
  console.log(`RLS probes passed: ${results.length}`);
}

main().catch((error) => {
  console.error('RLS probes crashed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
