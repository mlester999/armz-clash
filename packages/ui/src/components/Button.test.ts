import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

describe('Button interaction affordances', () => {
  const source = readFileSync(path.join(dir, 'Button.tsx'), 'utf8');

  it('applies cursor-pointer to interactive buttons', () => {
    expect(source).toMatch(/cursor-pointer/);
  });

  it('applies cursor-not-allowed when disabled', () => {
    expect(source).toMatch(/disabled:cursor-not-allowed/);
  });

  it('includes hover and active feedback for primary', () => {
    expect(source).toMatch(/hover:brightness/);
    expect(source).toMatch(/active:translate-y/);
  });

  it('includes focus-visible outline', () => {
    expect(source).toMatch(/focus-visible:outline/);
  });
});
