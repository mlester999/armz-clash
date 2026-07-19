/**
 * Safely remove Next.js and Turbo caches without touching source, env, or git.
 *
 * Usage: pnpm clean:next
 */
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { findMonorepoRoot } from './load-root-env.ts';

const root = findMonorepoRoot() ?? process.cwd();

const targets = [
  path.join(root, 'apps/web/.next'),
  path.join(root, 'apps/game/.next'),
  path.join(root, 'apps/admin/.next'),
  path.join(root, '.turbo'),
  path.join(root, 'apps/web/.turbo'),
  path.join(root, 'apps/game/.turbo'),
  path.join(root, 'apps/admin/.turbo'),
];

// Safety: never delete paths outside monorepo root or env/git.
for (const target of targets) {
  const resolved = path.resolve(target);
  if (!resolved.startsWith(path.resolve(root) + path.sep) && resolved !== path.resolve(root)) {
    console.error(`Refusing to delete path outside monorepo: ${resolved}`);
    process.exit(1);
  }
  if (
    resolved.includes(`${path.sep}.env`) ||
    resolved.endsWith('.git') ||
    resolved.includes(`${path.sep}.git${path.sep}`)
  ) {
    console.error(`Refusing unsafe path: ${resolved}`);
    process.exit(1);
  }
}

let removed = 0;
for (const target of targets) {
  if (!existsSync(target)) {
    console.log(`skip  ${path.relative(root, target)} (missing)`);
    continue;
  }
  rmSync(target, { recursive: true, force: true });
  console.log(`removed ${path.relative(root, target)}`);
  removed += 1;
}

console.log(`clean:next complete (${removed} paths removed). Restart Next apps after env changes.`);
