import { buildPublicConfig, formatTokenSymbol, loadClientEnv } from '@armz-clash/config';

export function getWebPublicConfig() {
  const env = loadClientEnv();
  return buildPublicConfig({
    environment: env.NEXT_PUBLIC_ARMZ_ENVIRONMENT,
    network: env.NEXT_PUBLIC_ARMZ_NETWORK,
    docsVersion: env.NEXT_PUBLIC_ARMZ_DOCS_VERSION,
    tokenName: env.NEXT_PUBLIC_ARMZ_TOKEN_NAME,
    tokenSymbol: env.NEXT_PUBLIC_ARMZ_TOKEN_SYMBOL,
    productName: env.NEXT_PUBLIC_ARMZ_PRODUCT_NAME,
    features: {
      demoModeEnabled: env.NEXT_PUBLIC_ARMZ_DEMO_MODE_ENABLED,
      realMintEnabled: env.NEXT_PUBLIC_ARMZ_REAL_MINT_ENABLED,
      realRewardsEnabled: env.NEXT_PUBLIC_ARMZ_REAL_REWARDS_ENABLED,
      claimsEnabled: env.NEXT_PUBLIC_ARMZ_CLAIMS_ENABLED,
      marketplaceEnabled: env.NEXT_PUBLIC_ARMZ_MARKETPLACE_ENABLED,
      mainnetEnabled: env.NEXT_PUBLIC_ARMZ_MAINNET_ENABLED,
    },
  });
}

export { formatTokenSymbol };
