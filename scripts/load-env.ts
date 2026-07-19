import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/** Load `.env` into process.env without printing values. Does not override existing vars. */
export function loadDotEnv(fileName = '.env'): void {
  const full = path.resolve(process.cwd(), fileName);
  if (!existsSync(full)) return;
  const text = readFileSync(full, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function redactSecrets(text: string): string {
  return text
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT]')
    .replace(/postgresql:\/\/[^\s]+/gi, '[REDACTED_DB_URL]');
}
