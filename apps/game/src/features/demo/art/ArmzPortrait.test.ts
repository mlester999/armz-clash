import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dir, 'ArmzPortrait.tsx'), 'utf8');

describe('ARMZ visual identity system', () => {
  it('covers all six Common demo presets', () => {
    for (const key of [
      'rookie_brawler',
      'dockhand',
      'street_challenger',
      'iron_apprentice',
      'desert_grappler',
      'arena_recruit',
    ]) {
      expect(source).toContain(key);
    }
  });

  it('defines distinct wrap styles', () => {
    for (const style of ['leather', 'work', 'athletic', 'metal', 'cloth', 'tournament']) {
      expect(source).toContain(`'${style}'`);
    }
  });

  it('includes Practice Automaton portrait', () => {
    expect(source).toContain('AutomatonPortrait');
    expect(source).toContain('Practice Automaton');
  });

  it('exposes data-testid hooks for portraits', () => {
    expect(source).toContain('armz-portrait');
    expect(source).toContain('automaton-portrait');
  });
});
