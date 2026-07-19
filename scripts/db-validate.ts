import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const migrationsDir = path.join(ROOT, 'supabase', 'migrations');

/** Reject real staking schema objects; allow "no staking" safety comments. */
function hasNoStakingSchema(sql: string): boolean {
  return !/\b(create\s+table\s+(if\s+not\s+exists\s+)?(public\.)?staking|create\s+schema\s+staking)\b/i.test(
    sql,
  );
}

function foundationChecks(sql: string): Array<[string, boolean]> {
  return [
    ['non-empty', sql.trim().length > 0],
    ['enables RLS', /enable row level security/i.test(sql)],
    ['force RLS on sensitive tables', /force row level security/i.test(sql)],
    ['feature flags seed mainnet false', /mainnet_enabled',\s*false/i.test(sql)],
    ['feature flags seed real_mint false', /real_mint_enabled',\s*false/i.test(sql)],
    ['feature flags seed real_rewards false', /real_rewards_enabled',\s*false/i.test(sql)],
    ['feature flags seed claims false', /claims_enabled',\s*false/i.test(sql)],
    ['feature flags seed settlement false', /marketplace_settlement_enabled',\s*false/i.test(sql)],
    ['creates admin_audit_logs', /create table if not exists public\.admin_audit_logs/i.test(sql)],
    ['no staking schema', hasNoStakingSchema(sql)],
  ];
}

function phase2AuthChecks(sql: string): Array<[string, boolean]> {
  return [
    ['non-empty', sql.trim().length > 0],
    ['enables RLS', /enable row level security/i.test(sql)],
    ['force RLS on sensitive tables', /force row level security/i.test(sql)],
    ['no staking schema', hasNoStakingSchema(sql)],
    ['player_sessions table', /player_sessions/i.test(sql)],
    ['auth_challenges table', /auth_challenges/i.test(sql)],
  ];
}

function phase3DemoChecks(sql: string): Array<[string, boolean]> {
  return [
    ['non-empty', sql.trim().length > 0],
    ['enables RLS', /enable row level security/i.test(sql)],
    ['force RLS on sensitive tables', /force row level security/i.test(sql)],
    ['no staking schema', hasNoStakingSchema(sql)],
    ['demo_sessions table', /demo_sessions/i.test(sql)],
    ['demo_armz table', /demo_armz/i.test(sql)],
    ['demo_battles table', /demo_battles/i.test(sql)],
    ['demo_reward_events table', /demo_reward_events/i.test(sql)],
    ['simulated reward flags', /simulated boolean not null default true/i.test(sql)],
    ['common-only demo armz', /rarity = 'common'/i.test(sql)],
  ];
}

function defaultChecks(sql: string): Array<[string, boolean]> {
  return [
    ['non-empty', sql.trim().length > 0],
    ['no staking schema', hasNoStakingSchema(sql)],
  ];
}

function checksFor(file: string, sql: string): Array<[string, boolean]> {
  if (file.includes('phase1_foundation')) return foundationChecks(sql);
  if (file.includes('phase2_wallet_auth')) return phase2AuthChecks(sql);
  if (file.includes('phase3_demo_mode')) return phase3DemoChecks(sql);
  return defaultChecks(sql);
}

function main() {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  if (files.length === 0) {
    console.error('FAIL: no SQL migrations found');
    process.exit(1);
  }

  let failed = 0;
  for (const file of files) {
    const full = path.join(migrationsDir, file);
    const sql = readFileSync(full, 'utf8');
    const checks = checksFor(file, sql);

    console.log(`Validating ${file}`);
    for (const [label, ok] of checks) {
      if (!ok) {
        console.error(`  FAIL: ${label}`);
        failed += 1;
      } else {
        console.log(`  PASS: ${label}`);
      }
    }
  }

  const hostedWrites = process.env.SUPABASE_REMOTE_WRITES_APPROVED === 'true';
  const hostedTests = process.env.RUN_HOSTED_SUPABASE_TESTS === 'true';

  console.log(
    `Hosted writes approved: ${hostedWrites} (default false — Phase 1 does not auto-migrate hosted DB)`,
  );
  console.log(`Hosted tests enabled: ${hostedTests} (default false)`);

  if (!process.env.SUPABASE_DATABASE_URL) {
    console.log('NOTE: SUPABASE_DATABASE_URL not set — static migration validation only.');
  } else if (!hostedTests) {
    console.log(
      'NOTE: SUPABASE_DATABASE_URL present but RUN_HOSTED_SUPABASE_TESTS!=true — skipping live DB probes.',
    );
  } else {
    console.log(
      'NOTE: Hosted test mode requested. Wire live probes after owner approval; Phase 1 keeps static validation.',
    );
  }

  if (failed > 0) {
    process.exit(1);
  }

  console.log('Database validation passed (static foundation checks).');
}

main();
