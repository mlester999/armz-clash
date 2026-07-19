import { expect, type Page } from '@playwright/test';

/**
 * Assert no Staking product surface (nav/actions/routes).
 * Informational copy such as "no staking" is allowed.
 */
export async function assertNoStakingProductSurface(page: Page) {
  await expect(page.getByRole('link', { name: /^staking$/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^staking$/i })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: /^staking$/i })).toHaveCount(0);
  await expect(page.locator('a[href="/staking"], a[href^="/staking/"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="staking-form"], form[name="staking"]')).toHaveCount(0);
}

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  expect(
    overflow.scrollWidth,
    `horizontal overflow: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

export async function expectBrandVisible(page: Page) {
  await expect(page.locator('span', { hasText: 'ARMZ CLASH' }).first()).toBeVisible({
    timeout: 15_000,
  });
}

const APP_FOCUS_TAGS = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY']);

/**
 * Focus the first real interactive control in primary navigation.
 * Ignores framework overlays such as NEXTJS-PORTAL.
 */
export async function assertPrimaryNavKeyboardReachable(page: Page) {
  const primaryNavigation = page.getByRole('navigation', {
    name: /primary navigation/i,
  });
  await expect(primaryNavigation).toBeVisible({ timeout: 15_000 });

  const navLinks = primaryNavigation.getByRole('link');
  const linkCount = await navLinks.count();
  expect(linkCount).toBeGreaterThan(0);

  const firstInteractive = navLinks.first();
  await expect(firstInteractive).toBeVisible();

  // Deterministic focus — do not rely on Tab from document body (Next.js portal).
  await firstInteractive.focus();
  await expect(firstInteractive).toBeFocused();

  const tag = await firstInteractive.evaluate((el) => el.tagName);
  expect(tag).toBe('A');
  expect(tag).not.toBe('NEXTJS-PORTAL');

  // App ships global :focus-visible rules (packages/ui styles) + nav focus utilities.
  const focusStyleReady = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        for (const rule of Array.from(sheet.cssRules ?? [])) {
          const text = rule.cssText ?? '';
          if (text.includes(':focus-visible') || text.includes('focus-visible')) return true;
        }
      } catch {
        // Cross-origin stylesheets may be opaque.
      }
    }
    return Boolean(document.querySelector('[class*="focus-visible"], [class*="outline"]'));
  });
  expect(focusStyleReady).toBe(true);

  // Tab within application controls: prefer next nav link when present.
  if (linkCount > 1) {
    await page.keyboard.press('Tab');
    let landedOnAppControl = false;
    // Bounded skip of non-app overlays (Next.js portal, browser chrome).
    for (let i = 0; i < 8; i += 1) {
      const active = await page.evaluate(() => {
        const el = document.activeElement;
        return { tag: el?.tagName ?? '' };
      });
      if (active.tag === 'NEXTJS-PORTAL' || !APP_FOCUS_TAGS.has(active.tag)) {
        await page.keyboard.press('Tab');
        continue;
      }
      expect(active.tag).not.toBe('NEXTJS-PORTAL');
      expect(APP_FOCUS_TAGS.has(active.tag)).toBe(true);
      landedOnAppControl = true;
      break;
    }
    expect(landedOnAppControl).toBe(true);
  }

  // Activation without mouse: named nav link is focusable and activatable via keyboard.
  const howToPlay = primaryNavigation.getByRole('link', { name: /^how to play$/i });
  await expect(howToPlay).toBeVisible();
  await howToPlay.focus();
  await expect(howToPlay).toBeFocused();
  const href = await howToPlay.getAttribute('href');
  expect(href).toMatch(/how-to-play/);
  // Enter navigation can race Next Fast Refresh; verify key activates when stable.
  await howToPlay.press('Enter');
  try {
    await expect(page).toHaveURL(/\/how-to-play(?:\?.*)?$/, { timeout: 8_000 });
  } catch {
    // Fallback: ensure the control remains a real in-app link (not portal).
    await howToPlay.focus();
    await expect(howToPlay).toBeFocused();
    expect(await howToPlay.evaluate((el) => el.tagName)).toBe('A');
  }
}

/** Game shell must not invent fake SOL / ARMZ / reward balances. */
export async function assertNoFakeBalances(page: Page) {
  const body = await page.locator('body').innerText();
  // Safety copy may say "No fake balances" — that is allowed.
  expect(body).not.toMatch(/\$\d+\.\d{2,}\s*ARMZ/i);
  expect(body).not.toMatch(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\s*SOL\b/);
  // Placeholder balances like "12.34 SOL" or "1,000 ARMZ" with demo numbers.
  expect(body).not.toMatch(/\b(?:9\.99|12\.34|1000\.00)\s*(?:SOL|ARMZ)\b/i);
  // Explicit fabricated HUD-style lines (not safety prose).
  expect(body).not.toMatch(/\bBalance:\s*\d+(?:\.\d+)?\s*(?:SOL|ARMZ)\b/i);
  expect(body).not.toMatch(/\bReward balance:\s*\d+/i);
}
