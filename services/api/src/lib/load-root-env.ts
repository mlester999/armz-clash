/**
 * Load monorepo root .env when the API is started from services/api.
 * Never overrides existing process.env keys. Never logs values.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function findMonorepoRoot(): string | null {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, '../../../../'), // services/api/src/lib → repo root
    path.resolve(process.cwd(), '../..'),
    process.cwd(),
  ];
  for (const dir of candidates) {
    if (
      existsSync(path.join(dir, 'pnpm-workspace.yaml')) &&
      existsSync(path.join(dir, 'turbo.json'))
    ) {
      return dir;
    }
  }
  return null;
}

function applyEnvFile(filePath: string): boolean {
  if (!existsSync(filePath)) return false;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
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
  return true;
}

export function loadApiRootEnv(): { root: string | null; loaded: string[] } {
  const root = findMonorepoRoot();
  const loaded: string[] = [];
  if (!root) {
    if (applyEnvFile(path.resolve(process.cwd(), '.env'))) {
      loaded.push(path.resolve(process.cwd(), '.env'));
    }
    return { root: null, loaded };
  }
  for (const name of ['.env', '.env.local'] as const) {
    const full = path.join(root, name);
    if (applyEnvFile(full)) loaded.push(full);
  }
  return { root, loaded };
}
