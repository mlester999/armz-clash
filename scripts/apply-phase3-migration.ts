/**
 * Apply Phase 3 demo migration to hosted Supabase when approved.
 * Requires SUPABASE_DATABASE_URL and SUPABASE_REMOTE_WRITES_APPROVED=true.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
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

async function main() {
  loadEnv();
  if (process.env.SUPABASE_REMOTE_WRITES_APPROVED !== 'true') {
    console.error('Refusing: set SUPABASE_REMOTE_WRITES_APPROVED=true to apply hosted migration.');
    process.exit(1);
  }
  const url = process.env.SUPABASE_DATABASE_URL;
  if (!url) {
    console.error('SUPABASE_DATABASE_URL missing');
    process.exit(1);
  }
  const sql = readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260719190000_phase3_demo_mode.sql'),
    'utf8',
  );
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log('Phase 3 demo migration applied successfully.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
