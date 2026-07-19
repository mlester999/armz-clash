import {
  APP_PHASE,
  APP_PHASE_LABEL,
  DOCS_VERSION,
  formatTokenSymbol,
  PRODUCT_DISPLAY_NAME,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
  TOKEN_NAME,
  TOKEN_SYMBOL,
} from './product';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from './features';
import { DEFAULT_SOLANA_NETWORK, NETWORK_LABELS, type SolanaNetwork } from './network';

/** Safe public configuration exposed to browsers and public API endpoints. */
export type PublicConfig = {
  productName: string;
  productDisplayName: string;
  productTagline: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDisplay: string;
  environment: string;
  network: SolanaNetwork;
  networkLabel: string;
  docsVersion: string;
  appVersion: string;
  phase: number;
  phaseLabel: string;
  features: {
    demoModeEnabled: boolean;
    realMintEnabled: boolean;
    realRewardsEnabled: boolean;
    claimsEnabled: boolean;
    marketplaceEnabled: boolean;
    marketplaceSettlementEnabled: boolean;
    oracleEnabled: boolean;
    mainnetEnabled: boolean;
    adminEconomyWritesEnabled: boolean;
  };
  realValueSystemsDisabled: boolean;
  phaseNote: string;
};

export function buildPublicConfig(input?: {
  environment?: string;
  network?: SolanaNetwork;
  appVersion?: string;
  docsVersion?: string;
  tokenName?: string;
  tokenSymbol?: string;
  productName?: string;
  features?: Partial<FeatureFlags>;
}): PublicConfig {
  const features: FeatureFlags = {
    ...DEFAULT_FEATURE_FLAGS,
    ...input?.features,
  };

  const network = input?.network ?? DEFAULT_SOLANA_NETWORK;
  const tokenSymbol = input?.tokenSymbol ?? TOKEN_SYMBOL;

  const realValueSystemsDisabled =
    !features.realMintEnabled &&
    !features.realRewardsEnabled &&
    !features.claimsEnabled &&
    !features.marketplaceSettlementEnabled &&
    !features.mainnetEnabled;

  return {
    productName: input?.productName ?? PRODUCT_NAME,
    productDisplayName: PRODUCT_DISPLAY_NAME,
    productTagline: PRODUCT_TAGLINE,
    tokenName: input?.tokenName ?? TOKEN_NAME,
    tokenSymbol,
    tokenDisplay: formatTokenSymbol(tokenSymbol),
    environment: input?.environment ?? 'development',
    network,
    networkLabel: NETWORK_LABELS[network],
    docsVersion: input?.docsVersion ?? DOCS_VERSION,
    appVersion: input?.appVersion ?? '0.1.0',
    phase: APP_PHASE,
    phaseLabel: APP_PHASE_LABEL,
    features: {
      demoModeEnabled: features.demoModeEnabled,
      realMintEnabled: features.realMintEnabled,
      realRewardsEnabled: features.realRewardsEnabled,
      claimsEnabled: features.claimsEnabled,
      marketplaceEnabled: features.marketplaceEnabled,
      marketplaceSettlementEnabled: features.marketplaceSettlementEnabled,
      oracleEnabled: features.oracleEnabled,
      mainnetEnabled: features.mainnetEnabled,
      adminEconomyWritesEnabled: features.adminEconomyWritesEnabled,
    },
    realValueSystemsDisabled,
    phaseNote:
      'Phase 1 foundation only. Wallet auth, battles, minting, rewards, claims, and marketplace settlement are not active.',
  };
}
