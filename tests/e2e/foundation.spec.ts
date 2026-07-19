import { expect, test, type Page } from '@playwright/test';

const WEB = 'http://127.0.0.1:3000';
const GAME = 'http://127.0.0.1:3001';
const ADMIN = 'http://127.0.0.1:3002';

async function assertNoHorizontalOverflow(page: Page) {
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

async function assertNoStaking(page: Page) {
  const body = (await page.locator('body').innerText()).toLowerCase();
  expect(body).not.toContain('staking');
}

async function expectBrandVisible(page: Page) {
  // Prefer visible wordmark span, not SVG <title> nodes.
  await expect(page.locator('span', { hasText: 'ARMZ CLASH' }).first()).toBeVisible({
    timeout: 15_000,
  });
}

test.describe('Armz Clash Phase 2 foundation', () => {
  test('web home loads with branding and disabled real-value messaging', async ({
    page,
  }, testInfo) => {
    await page.goto(WEB, { waitUntil: 'networkidle' });
    await expectBrandVisible(page);
    await expect(page.getByText(/Premium Solana/i).first()).toBeVisible();
    await expect(page.getByText(/Real-value disabled/i).first()).toBeVisible();
    // Wallet chrome hydrates client-side (Connect Wallet or loading placeholder)
    await expect(page.getByRole('button', { name: /Connect Wallet|Wallet/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Marketplace/i).first()).toBeVisible();
    await assertNoStaking(page);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/web-home-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test('risk disclosure page loads', async ({ page }) => {
    await page.goto(`${WEB}/risk-disclosure`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Risk disclosure/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/not guaranteed/i).first()).toBeVisible();
    await assertNoStaking(page);
    await assertNoHorizontalOverflow(page);
  });

  test('primary navigation is keyboard reachable', async ({ page }) => {
    await page.goto(WEB, { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(activeTag);
  });

  test('game shell loads without fake balances', async ({ page }, testInfo) => {
    await page.goto(GAME, { waitUntil: 'networkidle' });
    await expectBrandVisible(page);
    await expect(page.getByRole('heading', { name: /Game shell/i })).toBeVisible();
    await expect(page.getByText(/Gameplay is not available yet/i)).toBeVisible();
    await expect(page.getByText(/Real-value disabled/i).first()).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/\$\d+\.\d{2,}\s*ARMZ/);
    await assertNoStaking(page);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/game-shell-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test('admin shell loads without fake treasury numbers', async ({ page }, testInfo) => {
    await page.goto(ADMIN, { waitUntil: 'networkidle' });
    await expectBrandVisible(page);
    await expect(page.getByRole('heading', { name: /Armz Clash Admin/i })).toBeVisible();
    await expect(page.getByText(/Internal development notice/i)).toBeVisible();
    await expect(page.getByText(/Real-value systems disabled/i).first()).toBeVisible();
    await assertNoStaking(page);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/admin-shell-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test('feature unavailable states are visible on web', async ({ page }) => {
    await page.goto(WEB, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Connect Wallet' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: 'Demo Mode' })).toBeVisible();
    await expect(page.getByText(/Phase 2|Phase 3|Phase 9/i).first()).toBeVisible();
  });
});
