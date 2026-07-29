import { expect, test } from '@playwright/test';
import { assertNoHorizontalOverflow } from './helpers';

const GAME = 'http://127.0.0.1:3001';
const WEB = 'http://127.0.0.1:3000';
const API = 'http://127.0.0.1:4000';
const GAME_ORIGIN = 'http://127.0.0.1:3001';
const WEB_ORIGIN = 'http://127.0.0.1:3000';
const reownConfigured = Boolean(process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim());

test.describe('Phase 3 Demo Mode', () => {
  test('demo config is enabled', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/demo/config`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.demoModeEnabled).toBe(true);
    expect(body.difficulty).toBe('easy');
  });

  test('API health and readiness respond', async ({ request }) => {
    const health = await request.get(`${API}/health`);
    expect(health.ok()).toBeTruthy();
    const ready = await request.get(`${API}/ready`);
    // 200 ready or 503 degraded (missing optional hosted secrets) are both acceptable.
    expect([200, 503]).toContain(ready.status());
  });

  test('CORS allows game and web origins; rejects unknown', async ({ request }) => {
    const game = await request.get(`${API}/api/v1/config/public`, {
      headers: { origin: GAME_ORIGIN },
    });
    expect(game.ok()).toBeTruthy();
    expect(game.headers()['access-control-allow-origin']).toBe(GAME_ORIGIN);

    const web = await request.get(`${API}/api/v1/config/public`, {
      headers: { origin: WEB_ORIGIN },
    });
    expect(web.ok()).toBeTruthy();
    expect(web.headers()['access-control-allow-origin']).toBe(WEB_ORIGIN);

    const evil = await request.get(`${API}/api/v1/config/public`, {
      headers: { origin: 'https://evil.example' },
    });
    // Fastify CORS rejects with error (non-2xx) or omits allow-origin.
    const evilAllow = evil.headers()['access-control-allow-origin'];
    expect(evilAllow === undefined || evilAllow !== 'https://evil.example').toBeTruthy();
    if (evil.ok()) {
      expect(evilAllow).not.toBe('https://evil.example');
      expect(evilAllow).not.toBe('*');
    }
  });

  test('demo session creates temporary Common ARMZ', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/demo/session`, {
      headers: { origin: GAME_ORIGIN },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.armz.rarity).toBe('common');
    expect(body.armz.presetKey).toBe('rookie_brawler');
    expect(body.armz.displayName).toBe('Rookie Brawler');
    expect(body.armz.level).toBe(1);
    expect(body.armz.temporary).toBe(true);
    expect(body.armz.claimable).toBe(false);
    expect(body.armz.blockchainAsset).toBe(false);
    expect(body.labels.noMonetaryValue).toMatch(/monetary/i);
    const cookies = res.headers()['set-cookie'] ?? '';
    expect(cookies.toLowerCase()).toContain('armz_clash_demo_session');
  });

  test('server-authoritative battle returns timeline and simulated labels', async ({ request }) => {
    const session = await request.post(`${API}/api/v1/demo/session`, {
      headers: { origin: GAME_ORIGIN },
    });
    expect(session.ok()).toBeTruthy();
    const battle = await request.post(`${API}/api/v1/demo/battle`, {
      headers: {
        origin: GAME_ORIGIN,
        'content-type': 'application/json',
        'idempotency-key': `e2e-${Date.now()}`,
      },
      data: { idempotencyKey: `e2e-body-${Date.now()}`, reducedMotion: true },
    });
    expect(battle.ok()).toBeTruthy();
    const body = await battle.json();
    expect(['victory', 'defeat']).toContain(body.outcome);
    expect(Array.isArray(body.timeline)).toBeTruthy();
    expect(body.timeline.length).toBeGreaterThan(8);
    if (body.outcome === 'victory') {
      expect(body.reward.simulated).toBe(true);
      expect(body.reward.notClaimable).toBe(true);
      expect(body.reward.noMonetaryValue).toBe(true);
    } else {
      expect(body.reward).toBeNull();
    }
  });

  test('game shell exposes Play Demo entry and premium nav', async ({ page }) => {
    await page.goto(GAME, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('play-demo-link')).toBeVisible({ timeout: 15_000 });
    await expect(
      page
        .locator('main')
        .getByText(/no staking/i)
        .first(),
    ).toBeVisible();
    await expect(page.getByTestId('nav-demo')).toBeVisible();
    await expect(page.getByTestId('nav-demo-collection')).toBeVisible();
    // Future tabs remain intentional (disabled), not broken links.
    await expect(page.getByTestId('nav-future-marketplace')).toHaveCount(1);
    await expect(page.getByTestId('nav-future-marketplace')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await assertNoHorizontalOverflow(page);
  });

  test('collection shows ARMZ portrait and fight CTA', async ({ page }) => {
    test.setTimeout(120_000);
    // Collection page creates/restores a demo session client-side. GitHub's
    // cold Next.js route + first API hydration can exceed the default expect
    // window, so keep the loading assertion explicit and allow it to resolve.
    await page.goto(`${GAME}/demo/collection`, { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByTestId('collection-loading').or(page.getByTestId('demo-collection-armz')),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('demo-collection-armz')).toBeVisible({ timeout: 75_000 });
    await expect(page.getByTestId('armz-portrait').first()).toBeVisible();
    await expect(page.getByTestId('demo-fight-button')).toBeVisible();
  });

  test('demo disclosure and collection flow without Failed to fetch', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(`${GAME}/demo`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Enter the Arena/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Failed to fetch/i)).toHaveCount(0);
    const play = page.getByTestId('play-demo-button');
    await expect(play).toBeVisible({ timeout: 15_000 });
    await expect(play).toBeEnabled();
    // Click with retry to survive React re-renders that detach the element.
    await play.click({ timeout: 10_000 });
    const disclosure = page.getByTestId('demo-disclosure');
    try {
      await expect(disclosure).toBeVisible({ timeout: 5_000 });
    } catch {
      await play.dispatchEvent('click');
      await expect(disclosure).toBeVisible({ timeout: 10_000 });
    }
    await expect(disclosure.getByText(/No wallet required/i)).toBeVisible();
    await expect(disclosure.getByText(/claim|Cannot claim|not claimable/i)).toBeVisible();
    await disclosure.getByRole('button', { name: /Enter Demo Mode/i }).click();
    await expect(
      page
        .getByTestId('demo-armz-reveal')
        .or(page.getByText(/Demo session ready|Continue to Demo|session ready/i)),
    ).toBeVisible({ timeout: 35_000 });
    await expect(page.getByText(/Failed to fetch/i)).toHaveCount(0);
    await expect(page.getByTestId('demo-start-error')).toHaveCount(0);
  });

  test('flagship flow stays contained and restores a truthful final result', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await page.goto(`${GAME}/demo`, { waitUntil: 'domcontentloaded' });

    const play = page.getByTestId('play-demo-button');
    await expect(play).toBeEnabled({ timeout: 15_000 });
    await play.click();
    const disclosure = page.getByTestId('demo-disclosure');
    await expect(disclosure).toBeVisible({ timeout: 15_000 });
    await expect(disclosure.getByRole('button', { name: 'Enter Demo Mode' })).toBeVisible();
    await disclosure.getByRole('button', { name: 'Enter Demo Mode' }).click();

    const reveal = page.getByTestId('demo-armz-reveal');
    const ready = page.getByTestId('demo-session-ready');
    await expect(reveal.or(ready)).toBeVisible({ timeout: 35_000 });
    await expect(page.getByText('Rookie Brawler').first()).toBeVisible();

    if (await reveal.isVisible()) {
      const continueButton = reveal.getByRole('button', { name: 'Continue to Collection' });
      await expect(continueButton).toBeEnabled({ timeout: 10_000 });
      await continueButton.click();
      try {
        await expect(page).toHaveURL(/\/demo\/collection/, { timeout: 5_000 });
      } catch {
        await expect(continueButton).toBeEnabled();
        await continueButton.click();
      }
    } else {
      await ready.getByRole('button', { name: 'Open Collection' }).click();
    }

    await expect(page).toHaveURL(/\/demo\/collection/);
    const collection = page.getByTestId('demo-collection-armz');
    await expect(collection).toBeVisible({ timeout: 35_000 });
    await expect(collection.getByText('Rookie Brawler').first()).toBeVisible();
    await assertNoHorizontalOverflow(page);

    const fight = page.getByTestId('demo-fight-button');
    await expect(fight).toBeVisible();
    await fight.click();
    await expect(page.getByTestId('demo-fight-confirm')).toBeVisible({ timeout: 35_000 });

    const start = page.getByTestId('demo-start-battle');
    await expect(start).toHaveText('Start Battle');
    await expect(start).toBeEnabled();
    await start.click();

    const battleStage = page.getByTestId('demo-battle-stage');
    await expect(battleStage).toBeVisible({ timeout: 35_000 });
    await expect(battleStage).toHaveAttribute('data-battle-asset-mode', 'legacy-fallback');
    await expect(page.getByText(/Temporary Phase 3\.3B layered rig/i)).toBeVisible();
    await assertNoHorizontalOverflow(page);
    const skip = page.getByTestId('battle-skip');
    await expect(skip).toBeVisible({ timeout: 20_000 });
    await skip.click();

    const result = page.getByTestId('demo-battle-result');
    await expect(result).toBeVisible({ timeout: 20_000 });
    await expect(result.getByText(/final state synchronized/i)).toBeVisible();
    await expect(result.getByRole('button', { name: /Collection/i })).toBeVisible();
    await expect(result.getByRole('button', { name: /Return to Arena/i })).toBeVisible();

    const resultBox = await result.boundingBox();
    const viewport = page.viewportSize();
    expect(resultBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(resultBox!.x).toBeGreaterThanOrEqual(0);
    expect(resultBox!.y).toBeGreaterThanOrEqual(0);
    expect(resultBox!.x + resultBox!.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(resultBox!.y + resultBox!.height).toBeLessThanOrEqual(viewport!.height + 1);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('demo-battle-result')).toBeVisible({ timeout: 35_000 });
    await expect(page.getByRole('status')).toContainText(/Final Control:/i);
    await assertNoHorizontalOverflow(page);

    if (testInfo.project.name === 'chromium-desktop') {
      const requiredMatrix = [
        { width: 1280, height: 720 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 },
        { width: 1920, height: 1080 },
        { width: 768, height: 1024 },
        { width: 820, height: 1180 },
        { width: 1024, height: 1366 },
        { width: 360, height: 800 },
        { width: 375, height: 812 },
        { width: 390, height: 844 },
        { width: 393, height: 852 },
        { width: 430, height: 932 },
      ];

      for (const viewportSize of requiredMatrix) {
        await page.setViewportSize(viewportSize);
        const matrixResult = page.getByTestId('demo-battle-result');
        await expect(matrixResult).toBeVisible();
        await expect(matrixResult.getByRole('button', { name: /Collection/i })).toBeVisible();
        await expect(matrixResult.getByRole('button', { name: /Return to Arena/i })).toBeVisible();
        await assertNoHorizontalOverflow(page);

        const box = await matrixResult.boundingBox();
        expect(
          box,
          `missing result box at ${viewportSize.width}x${viewportSize.height}`,
        ).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewportSize.width + 1);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewportSize.height + 1);
      }
    }
  });

  test('real-value flags and mainnet remain disabled on public config', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/config/public`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const features = body.features ?? body;
    expect(features.mainnetEnabled ?? features.mainnet).toBeFalsy();
    expect(features.realMintEnabled).toBeFalsy();
    expect(features.realRewardsEnabled).toBeFalsy();
    expect(features.claimsEnabled).toBeFalsy();
  });

  test('game uses 127.0.0.1 consistently and has no staking surface', async ({ page }) => {
    await page.goto(`${GAME}/demo`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('127.0.0.1');
    await expect(page.getByText(/staking form|stake \$ARMZ/i)).toHaveCount(0);
  });

  test('Reown configuration surface on game', async ({ page }) => {
    await page.goto(GAME, { waitUntil: 'domcontentloaded' });
    if (reownConfigured) {
      await expect(page.getByText(/Reown project ID is not configured/i)).toHaveCount(0);
    } else {
      // Foundation without secrets: safe unavailable messaging is required.
      await expect(page.getByText(/Reown project ID is not configured/i).first()).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test('Connect Wallet chrome is present (Reown modal requires Project ID)', async ({ page }) => {
    test.skip(!reownConfigured, 'Requires NEXT_PUBLIC_REOWN_PROJECT_ID');
    await page.goto(WEB, { waitUntil: 'domcontentloaded' });
    const connect = page.getByRole('button', { name: /Connect Wallet|Wallet/i }).first();
    await expect(connect).toBeVisible({ timeout: 15_000 });
    await connect.click();
    // AppKit modal host or dialog should appear when Project ID is configured.
    await expect(
      page.locator('w3m-modal, wcm-modal, [data-testid="w3m-modal"], #w3m-modal').first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('demo config reports explicit persistence label', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/demo/config`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.demoModeEnabled).toBe(true);
    expect(typeof body.demoPersistence).toBe('string');
    expect(body.demoPersistence.length).toBeGreaterThan(0);
    // Must not leak connection strings
    expect(JSON.stringify(body).toLowerCase()).not.toContain('service_role');
    expect(JSON.stringify(body).toLowerCase()).not.toContain('postgresql://');
  });

  test('interactive controls expose pointer cursor', async ({ page }) => {
    await page.goto(`${GAME}/demo`, { waitUntil: 'domcontentloaded' });
    const play = page.getByTestId('play-demo-button');
    await expect(play).toBeVisible({ timeout: 15_000 });
    // Poll: under parallel load the stylesheet may apply slightly after visibility.
    await expect
      .poll(() => play.evaluate((el) => getComputedStyle(el).cursor), { timeout: 15_000 })
      .toBe('pointer');
    const disabledNav = page.getByTestId('nav-future-marketplace');
    await expect(disabledNav).toHaveCount(1);
    if (await disabledNav.isVisible()) {
      await expect
        .poll(() => disabledNav.evaluate((el) => getComputedStyle(el).cursor), {
          timeout: 15_000,
        })
        .toBe('not-allowed');
    } else {
      await expect(disabledNav).toHaveAttribute('aria-disabled', 'true');
    }
  });
});
