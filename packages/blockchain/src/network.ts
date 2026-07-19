export type SolanaNetworkId = 'devnet' | 'testnet' | 'mainnet-beta';

export const DEFAULT_NETWORK: SolanaNetworkId = 'devnet';

export class MainnetSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MainnetSafetyError';
  }
}

/**
 * Mainnet requires explicit later owner approval via feature flag.
 * This helper never enables mainnet by default.
 */
export function assertMainnetAllowed(network: SolanaNetworkId, mainnetEnabled: boolean): void {
  if (network === 'mainnet-beta' && !mainnetEnabled) {
    throw new MainnetSafetyError(
      'Mainnet is disabled. ARMZ_MAINNET_ENABLED must be explicitly true after owner approval.',
    );
  }
}

export function resolveActiveNetwork(
  requested: SolanaNetworkId | undefined,
  mainnetEnabled: boolean,
): SolanaNetworkId {
  const network = requested ?? DEFAULT_NETWORK;
  assertMainnetAllowed(network, mainnetEnabled);
  return network;
}
