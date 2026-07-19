import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Pure regression for staking product-surface detection rules used by E2E.
 * Mirrors assertNoStakingProductSurface policy without a browser.
 */
function isStakingProductLink(name: string, href?: string): boolean {
  if (/^staking$/i.test(name.trim())) return true;
  if (href === '/staking' || href?.startsWith('/staking/')) return true;
  return false;
}

function allowsInformationalCopy(bodyText: string): boolean {
  // Informational phrases must not be treated as product surface by themselves.
  return /\bno staking\b|\bstaking is not\b|\bstaking remains absent\b/i.test(bodyText);
}

describe('staking product surface policy', () => {
  it('allows informational no-staking copy', () => {
    expect(allowsInformationalCopy('Phase 2 foundation · no staking · real-value disabled')).toBe(
      true,
    );
    expect(isStakingProductLink('No staking')).toBe(false);
  });

  it('flags a real Staking navigation link', () => {
    expect(isStakingProductLink('Staking')).toBe(true);
    expect(isStakingProductLink('staking', '/staking')).toBe(true);
    expect(isStakingProductLink('Home', '/')).toBe(false);
  });

  it('does not ship a /staking app route directory', () => {
    const root = path.resolve(__dirname, '../..');
    for (const app of ['web', 'game', 'admin']) {
      expect(existsSync(path.join(root, 'apps', app, 'src', 'app', 'staking'))).toBe(false);
    }
  });
});
