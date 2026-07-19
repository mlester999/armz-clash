import { DEFAULT_FEATURE_FLAGS, buildPublicConfig } from '../packages/config/src/index.ts';
import { loadServerEnv } from '../packages/config/src/env/server.ts';

function main() {
  const env = loadServerEnv();
  const publicConfig = buildPublicConfig({
    environment: env.ARMZ_ENVIRONMENT,
    network: env.network,
    appVersion: env.ARMZ_APP_VERSION,
    features: env.features,
  });

  const checks = [
    ['mainnet disabled by default', env.features.mainnetEnabled === false],
    ['real mint disabled by default', env.features.realMintEnabled === false],
    ['real rewards disabled by default', env.features.realRewardsEnabled === false],
    ['claims disabled by default', env.features.claimsEnabled === false],
    ['marketplace settlement disabled', env.features.marketplaceSettlementEnabled === false],
    [
      'demo mode default true',
      env.features.demoModeEnabled === DEFAULT_FEATURE_FLAGS.demoModeEnabled,
    ],
    [
      'public config hides secrets',
      !JSON.stringify(publicConfig).toLowerCase().includes('service_role'),
    ],
  ] as const;

  let failed = 0;
  for (const [label, ok] of checks) {
    if (!ok) {
      console.error(`FAIL: ${label}`);
      failed += 1;
    } else {
      console.log(`PASS: ${label}`);
    }
  }

  if (failed > 0) {
    process.exit(1);
  }

  console.log('Environment validation passed for Phase 1 defaults.');
}

main();
