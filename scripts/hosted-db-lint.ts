/**
 * Run Supabase database lint against the hosted development project.
 * Prefers SUPABASE_DATABASE_URL (more reliable than linked login role).
 * Requires RUN_HOSTED_SUPABASE_TESTS=true.
 */
import { spawnSync } from 'node:child_process';
import { loadDotEnv, redactSecrets } from './load-env.ts';

loadDotEnv();

function main() {
  if (process.env.RUN_HOSTED_SUPABASE_TESTS !== 'true') {
    console.log('SKIP: RUN_HOSTED_SUPABASE_TESTS is not true');
    process.exit(0);
  }

  const dbUrl = process.env.SUPABASE_DATABASE_URL;
  const args = dbUrl
    ? ['dlx', 'supabase', 'db', 'lint', '--db-url', dbUrl, '--level', 'warning']
    : ['dlx', 'supabase', 'db', 'lint', '--linked', '--level', 'warning'];

  if (!dbUrl) {
    console.log('NOTE: SUPABASE_DATABASE_URL missing; falling back to --linked');
  }

  const result = spawnSync('pnpm', args, {
    encoding: 'utf8',
    env: process.env,
    shell: false,
  });

  const combined = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  console.log(redactSecrets(combined));

  if (/No schema errors found/i.test(combined) || /No issues found/i.test(combined)) {
    console.log('Database lint completed successfully (no schema errors).');
    process.exit(0);
  }

  if (result.status === 0) {
    console.log('Database lint completed successfully.');
    process.exit(0);
  }

  console.error('Database lint reported issues (see above).');
  process.exit(result.status ?? 1);
}

main();
