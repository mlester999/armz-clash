import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
  '.turbo',
  'screenshots',
]);

const SUSPICIOUS_FILE_PATTERNS = [
  /\.pem$/i,
  /\.p12$/i,
  /\.key$/i,
  /id_rsa$/i,
  /id_ed25519$/i,
  /keypair\.json$/i,
  /wallet\.json$/i,
];

const CONTENT_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'solana-private-array', re: /"privateKey"\s*:\s*\[/i },
  { name: 'begin-private-key', re: /-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/ },
  { name: 'service-role-literal', re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]eyJ/ },
  { name: 'aws-access-key', re: /AKIA[0-9A-Z]{16}/ },
];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function main() {
  const files = walk(ROOT);
  let failed = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (SUSPICIOUS_FILE_PATTERNS.some((re) => re.test(rel))) {
      console.error(`FAIL: suspicious secret-like filename: ${rel}`);
      failed += 1;
      continue;
    }

    if (!/\.(ts|tsx|js|mjs|cjs|json|md|sql|toml|yml|yaml|env|txt)$/i.test(rel)) {
      continue;
    }
    if (rel.endsWith('.env.example')) continue;

    let content = '';
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    // Skip lockfiles and huge generated outputs
    if (rel.endsWith('pnpm-lock.yaml') || rel.includes('package-lock')) continue;

    for (const pattern of CONTENT_PATTERNS) {
      if (pattern.re.test(content)) {
        console.error(`FAIL: ${pattern.name} matched in ${rel}`);
        failed += 1;
      }
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
  console.log(`Secrets scan passed (${files.length} files inspected).`);
}

main();
