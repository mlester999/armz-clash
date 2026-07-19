import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

describe('global interaction styles', () => {
  const css = readFileSync(path.join(dir, 'styles.css'), 'utf8');

  it('sets pointer cursor for buttons and links', () => {
    expect(css).toMatch(/button:not\(:disabled\)[\s\S]*cursor:\s*pointer/);
    expect(css).toMatch(/a\[href\][\s\S]*cursor:\s*pointer/);
  });

  it('sets not-allowed for disabled controls', () => {
    expect(css).toMatch(/button:disabled[\s\S]*cursor:\s*not-allowed/);
  });

  it('defines premium nav tab styles with active state', () => {
    expect(css).toMatch(/\.armz-nav-tab/);
    expect(css).toMatch(/\[data-active='true'\]/);
  });

  it('defines stat and portrait systems', () => {
    expect(css).toMatch(/\.armz-stat/);
    expect(css).toMatch(/\.armz-portrait/);
    expect(css).toMatch(/\.armz-result-victory/);
  });
});
