import { expect, test } from '@playwright/test';

const GAME = 'http://127.0.0.1:3001';
const API = 'http://127.0.0.1:4000';

test.describe('Phase 3 Demo Mode', () => {
  test('demo config is enabled', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/demo/config`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.demoModeEnabled).toBe(true);
    expect(body.difficulty).toBe('easy');
  });

  test('demo session creates temporary Common ARMZ', async ({ request }) => {
    const res = await request.post(`${API}/api/v1/demo/session`, {
      headers: { origin: 'http://127.0.0.1:3001' },
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
      headers: { origin: 'http://127.0.0.1:3001' },
    });
    expect(session.ok()).toBeTruthy();
    const battle = await request.post(`${API}/api/v1/demo/battle`, {
      headers: {
        origin: 'http://127.0.0.1:3001',
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

  test('game shell exposes Play Demo entry', async ({ page }) => {
    await page.goto(GAME, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('play-demo-link')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/no staking/i).first()).toBeVisible();
  });

  test('demo disclosure and collection flow', async ({ page }) => {
    await page.goto(`${GAME}/demo`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Play Demo/i })).toBeVisible({
      timeout: 20_000,
    });
    const play = page.getByTestId('play-demo-button');
    await expect(play).toBeEnabled();
    await play.click();
    const disclosure = page.getByTestId('demo-disclosure');
    await expect(disclosure).toBeVisible({ timeout: 15_000 });
    await expect(disclosure.getByText(/No wallet required/i)).toBeVisible();
    await expect(disclosure.getByText(/cannot be claimed/i)).toBeVisible();
    await disclosure.getByRole('button', { name: /Enter Demo Mode/i }).click();
    await expect(
      page
        .getByTestId('demo-armz-reveal')
        .or(page.getByText(/Demo session ready|Continue to Demo/i)),
    ).toBeVisible({ timeout: 30_000 });
  });
});
