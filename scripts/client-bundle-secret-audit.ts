/**
 * Scan Next.js client static bundles for server-only secret identifiers.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const FORBIDDEN = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DATABASE_URL',
  'ARMZ_SESSION_SIGNING_SECRET',
  'ARMZ_WALLET_NONCE_SECRET',
  'ARMZ_REWARD_SIGNER_SECRET',
  'BEGIN PRIVATE KEY',
  'BEGIN RSA PRIVATE KEY',
  'BEGIN OPENSSH PRIVATE KEY',
];

const APPS = ['web', 'game', 'admin'] as const;

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (/\.(js|css|html|txt|map)$/.test(entry)) files.push(full);
  }
  return files;
}

function main() {
  let failed = 0;
  for (const app of APPS) {
    const staticDir = path.join(process.cwd(), 'apps', app, '.next', 'static');
    if (!existsSync(staticDir)) {
      console.error(`FAIL: missing client static output for ${app} (build first)`);
      failed += 1;
      continue;
    }
    const files = walk(staticDir);
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const needle of FORBIDDEN) {
        if (content.includes(needle)) {
          console.error(`FAIL: ${needle} found in ${path.relative(process.cwd(), file)}`);
          failed += 1;
        }
      }
    }
    console.log(`PASS: ${app} client static scan (${files.length} files)`);
  }

  if (failed > 0) {
    process.exit(1);
  }
  console.log('Client-bundle secret audit passed.');
}

main();
