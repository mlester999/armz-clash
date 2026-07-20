import { defineConfig, devices } from '@playwright/test';
import { apiE2eEnv, loadE2eEnv, publicE2eEnv } from './scripts/load-e2e-env';

// Load local .env so NEXT_PUBLIC_* and API secrets reach webServer children.
loadE2eEnv();
const publicEnv = publicE2eEnv();
const apiEnv = apiE2eEnv();

const webPort = 3000;
const gamePort = 3001;
const adminPort = 3002;
const apiPort = 4000;
const host = '127.0.0.1';

/**
 * E2E strategy (Phase 2.1A):
 * - Standardize on 127.0.0.1 for web, game, admin, and API (no mixed localhost).
 * - Start Fastify API and wait until it is reachable before app tests.
 * - Forward public + server env from root .env; never commit secrets.
 * - Use next dev with allowedDevOrigins for local/CI iteration speed.
 *
 * Long-term preferred approach: `pnpm build` + `next start` against production
 * builds for more realistic browser tests without dev overlays. Deferred until
 * CI budget allows a full build-before-e2e path.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // next dev compiles routes on demand; parallel projects thrash under load.
  workers: process.env.CI ? 1 : 2,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: `http://${host}:${webPort}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'chromium-tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: [
    {
      // Process-up probe: /health is always 200 when the API is listening.
      // /ready may be 503 without Supabase secrets (CI foundation jobs).
      command: 'pnpm --filter @armz-clash/api exec tsx src/index.ts',
      url: `http://${host}:${apiPort}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        ...apiEnv,
        ARMZ_API_PORT: String(apiPort),
        // Explicit memory-test mode for foundation E2E (never silent fallback).
        ARMZ_DEMO_PERSISTENCE_MODE:
          process.env.ARMZ_DEMO_PERSISTENCE_MODE ??
          (process.env.ARMZ_DEMO_FORCE_MEMORY === 'false' ? 'database' : 'memory-test'),
      },
    },
    {
      command: `pnpm --filter @armz-clash/web exec next dev -H ${host} -p ${webPort}`,
      url: `http://${host}:${webPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ...process.env,
        ...publicEnv,
      },
    },
    {
      command: `pnpm --filter @armz-clash/game exec next dev -H ${host} -p ${gamePort}`,
      url: `http://${host}:${gamePort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ...process.env,
        ...publicEnv,
      },
    },
    {
      command: `pnpm --filter @armz-clash/admin exec next dev -H ${host} -p ${adminPort}`,
      url: `http://${host}:${adminPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ...process.env,
        ...publicEnv,
      },
    },
  ],
});
