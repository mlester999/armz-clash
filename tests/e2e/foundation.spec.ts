import { expect, test } from '@playwright/test';
import {
  assertNoFakeBalances,
  assertNoHorizontalOverflow,
  assertNoStakingProductSurface,
  assertPrimaryNavKeyboardReachable,
  expectBrandVisible,
} from './helpers';

const WEB = 'http://127.0.0.1:3000';
const GAME = 'http://127.0.0.1:3001';
const ADMIN = 'http://127.0.0.1:3002';
const API = 'http://127.0.0.1:4000';

const reownConfigured = Boolean(process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim());

test.describe('Armz Clash Phase 2 foundation', () => {
  test('api readiness is available', async ({ request }) => {
    const health = await request.get(`${API}/health`);
    expect(health.ok(), await health.text()).toBeTruthy();
    const healthBody = await health.json();
    expect(healthBody.status).toBe('ok');

    const ready = await request.get(`${API}/ready`);
    // 200 when secrets+DB configured; 503 when foundation-only (status still present).
    expect([200, 503]).toContain(ready.status());
    const body = (await ready.json()) as { status?: string };
    expect(['ready', 'not_ready']).toContain(body.status);

    const version = await request.get(`${API}/version`);
    expect(version.ok()).toBeTruthy();

    const publicConfig = await request.get(`${API}/api/v1/config/public`);
    expect(publicConfig.ok()).toBeTruthy();
    const cfg = await publicConfig.json();
    expect(cfg.network).toBe('devnet');
    expect(cfg.features.mainnetEnabled).toBe(false);
    expect(cfg.features.realMintEnabled).toBe(false);
    expect(cfg.features.realRewardsEnabled).toBe(false);
    expect(cfg.features.claimsEnabled).toBe(false);
    expect(cfg.features.marketplaceEnabled).toBe(false);
    expect(cfg.features.marketplaceSettlementEnabled).toBe(false);
    expect(cfg.features.oracleEnabled).toBe(false);
    expect(cfg.features.adminEconomyWritesEnabled).toBe(false);
    expect(cfg.features.demoModeEnabled).toBe(true);
  });

  test('web home loads with branding and disabled real-value messaging', async ({
    page,
  }, testInfo) => {
    await page.goto(WEB, { waitUntil: 'domcontentloaded' });
    await expectBrandVisible(page);
    await expect(page.getByText(/Premium Solana/i).first()).toBeVisible();
    await expect(page.getByText(/Real-value disabled/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Connect Wallet|Wallet/i }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Marketplace/i).first()).toBeVisible();
    await assertNoStakingProductSurface(page);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/web-home-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test('risk disclosure page loads', async ({ page }) => {
    await page.goto(`${WEB}/risk-disclosure`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Risk disclosure/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/not guaranteed/i).first()).toBeVisible();
    await assertNoStakingProductSurface(page);
    await assertNoHorizontalOverflow(page);
  });

  test('primary navigation is keyboard reachable', async ({ page }) => {
    await page.goto(WEB, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation', { name: /primary navigation/i })).toBeVisible();
    await assertPrimaryNavKeyboardReachable(page);
  });

  test('game shell loads without fake balances', async ({ page }, testInfo) => {
    await page.goto(GAME, { waitUntil: 'domcontentloaded' });
    await expectBrandVisible(page);
    await expect(page.getByRole('heading', { name: /Game shell/i })).toBeVisible();
    await expect(page.getByText(/Gameplay is not available yet/i)).toBeVisible();
    await expect(page.getByText(/Real-value disabled/i).first()).toBeVisible();

    // API is started by Playwright: session panel must settle without API-down copy.
    await expect(page.getByText(/Not signed in|Signed in/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Session service unavailable/i)).toHaveCount(0);

    await assertNoFakeBalances(page);
    // Informational "no staking" copy is allowed; product surface is not.
    await assertNoStakingProductSurface(page);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/game-shell-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test('admin shell loads without fake treasury numbers', async ({ page }, testInfo) => {
    await page.goto(ADMIN, { waitUntil: 'domcontentloaded' });
    await expectBrandVisible(page);
    await expect(page.getByRole('heading', { name: /Armz Clash Admin/i })).toBeVisible();
    await expect(page.getByText(/Internal development notice/i)).toBeVisible();
    await expect(page.getByText(/Real-value systems disabled/i).first()).toBeVisible();
    await assertNoStakingProductSurface(page);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `test-results/admin-shell-${testInfo.project.name}.png`,
      fullPage: true,
    });
  });

  test('feature unavailable states are visible on web', async ({ page }) => {
    await page.goto(WEB, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Connect Wallet' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: 'Demo Mode' })).toBeVisible();
    await expect(page.getByText(/Phase 2|Phase 3|Phase 9/i).first()).toBeVisible();
  });

  test('informational no-staking copy is allowed on game shell', async ({ page }) => {
    await page.goto(GAME, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/no staking/i).first()).toBeVisible();
    await assertNoStakingProductSurface(page);
  });

  test('staking product routes are absent', async ({ page, request }) => {
    test.setTimeout(90_000);
    await page.goto(WEB, { waitUntil: 'domcontentloaded' });
    await assertNoStakingProductSurface(page);

    // Probe each origin once. Next may soft-404 (200) or hard-404; never a Staking product.
    for (const origin of [WEB, GAME, ADMIN]) {
      const res = await request.get(`${origin}/staking`, { timeout: 45_000 });
      expect([404, 200]).toContain(res.status());
      const html = await res.text();
      // Reject an intentional staking product page (nav/form), not incidental safety copy.
      expect(html).not.toMatch(/<a[^>]+href=["']\/staking["']/i);
      expect(html).not.toMatch(/data-testid=["']staking-form["']/i);
      expect(html).not.toMatch(/name=["']staking["']/i);
      expect(html.toLowerCase()).not.toMatch(/<h1[^>]*>\s*staking\s*<\/h1>/);
    }
  });

  test('reown configuration surface matches environment', async ({ page }) => {
    await page.goto(WEB, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Connect Wallet|Wallet/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    if (reownConfigured) {
      // Foundation: Project ID present → do not show permanent unconfigured error.
      await expect(page.getByText(/Reown project ID is not configured/i)).toHaveCount(0);
    } else {
      // CI / foundation without secrets: safe unavailable messaging is required.
      await expect(page.getByText(/Reown project ID is not configured/i).first()).toBeVisible({
        timeout: 15_000,
      });
    }
  });
});
