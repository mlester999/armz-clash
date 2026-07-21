/**
 * Phase 3.3B - SVG asset source validation tests.
 * Validates structural correctness of all authored SVG sources.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SOURCE_ROOT = path.resolve(process.cwd(), 'apps/game/assets/source');

function collectSvgFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSvgFiles(full));
    } else if (entry.name.endsWith('.svg')) {
      results.push(full);
    }
  }
  return results.sort();
}

const allSvgs = collectSvgFiles(SOURCE_ROOT);

describe('Phase 3.3B SVG asset source validation', () => {
  it('has at least 50 SVG source files', () => {
    expect(allSvgs.length).toBeGreaterThanOrEqual(50);
  });

  it('every SVG contains a viewBox attribute', () => {
    for (const file of allSvgs) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content, `${path.relative(SOURCE_ROOT, file)} missing viewBox`).toContain('viewBox');
    }
  });

  it('no SVG contains <script> tags', () => {
    for (const file of allSvgs) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content, `${path.relative(SOURCE_ROOT, file)} contains <script>`).not.toMatch(
        /<script[\s>]/i,
      );
    }
  });

  it('no SVG contains external URLs (http/https) beyond xmlns namespaces', () => {
    for (const file of allSvgs) {
      const content = fs.readFileSync(file, 'utf-8');
      // Remove standard xmlns declarations before checking for external URLs
      const stripped = content.replace(/xmlns(?::\w+)?="http:\/\/www\.w3\.org\/[^"]*"/gi, '');
      expect(stripped, `${path.relative(SOURCE_ROOT, file)} contains external URL`).not.toMatch(
        /https?:\/\//i,
      );
    }
  });

  it('no SVG contains duplicate IDs', () => {
    for (const file of allSvgs) {
      const content = fs.readFileSync(file, 'utf-8');
      const idMatches = content.match(/id="([^"]+)"/g) ?? [];
      const ids = idMatches.map((m) => m.replace(/id="([^"]+)"/, '$1'));
      const seen = new Set<string>();
      for (const id of ids) {
        expect(seen.has(id), `${path.relative(SOURCE_ROOT, file)} duplicate id="${id}"`).toBe(
          false,
        );
        seen.add(id);
      }
    }
  });

  it('no SVG references external images (xlink:href or href to external)', () => {
    for (const file of allSvgs) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content, `${path.relative(SOURCE_ROOT, file)} has external image ref`).not.toMatch(
        /xlink:href\s*=\s*["']http/i,
      );
      expect(content, `${path.relative(SOURCE_ROOT, file)} has external href`).not.toMatch(
        /href\s*=\s*["']http/i,
      );
    }
  });

  it('fighter rig SVGs exist for rookie-brawler', () => {
    const rigDir = path.join(SOURCE_ROOT, 'fighters/rookie-brawler/rig');
    expect(fs.existsSync(rigDir)).toBe(true);
    const files = fs.readdirSync(rigDir).filter((f) => f.endsWith('.svg'));
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  it('fighter rig SVGs exist for practice-automaton', () => {
    const rigDir = path.join(SOURCE_ROOT, 'fighters/practice-automaton/rig');
    expect(fs.existsSync(rigDir)).toBe(true);
    const files = fs.readdirSync(rigDir).filter((f) => f.endsWith('.svg'));
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  it('arena SVGs exist', () => {
    const arenaDir = path.join(SOURCE_ROOT, 'arena');
    expect(fs.existsSync(arenaDir)).toBe(true);
    const files = fs.readdirSync(arenaDir).filter((f) => f.endsWith('.svg'));
    expect(files.length).toBeGreaterThanOrEqual(6);
  });

  it('effect SVGs exist', () => {
    const fxDir = path.join(SOURCE_ROOT, 'effects');
    expect(fs.existsSync(fxDir)).toBe(true);
    const files = fs.readdirSync(fxDir).filter((f) => f.endsWith('.svg'));
    expect(files.length).toBeGreaterThanOrEqual(6);
  });
});
