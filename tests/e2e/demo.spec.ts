import { expect, test } from '@playwright/test';

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
    await expect(page.getByText(/no staking|real-value systems disabled/i).first()).toBeVisible();
    await expect(page.getByTestId('nav-demo')).toBeVisible();
    await expect(page.getByTestId('nav-demo-collection')).toBeVisible();
    // Future tabs remain intentional (disabled), not broken links.
    await expect(page.getByTestId('nav-future-marketplace')).toBeVisible();
  });

  test('collection shows ARMZ portrait and fight CTA', async ({ page }) => {
    test.setTimeout(90_000);
    // Collection page creates/restores a demo session client-side.
    await page.goto(`${GAME}/demo/collection`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('demo-collection-armz')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('armz-portrait').first()).toBeVisible();
    await expect(page.getByTestId('demo-fight-button')).toBeVisible();
  });

  test('demo disclosure and collection flow without Failed to fetch', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(`${GAME}/demo`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Play Demo/i })).toBeVisible({
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
    await expect(disabledNav).toBeVisible();
    await expect
      .poll(() => disabledNav.evaluate((el) => getComputedStyle(el).cursor), { timeout: 15_000 })
      .toBe('not-allowed');
  });
});
