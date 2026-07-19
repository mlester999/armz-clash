import { z } from 'zod';

export const SolanaNetworkSchema = z.enum(['devnet', 'testnet', 'mainnet-beta']);
export type SolanaNetwork = z.infer<typeof SolanaNetworkSchema>;

/** Default network for all Phase 1 environments. Mainnet is never the default. */
export const DEFAULT_SOLANA_NETWORK: SolanaNetwork = 'devnet';

export const NETWORK_LABELS: Record<SolanaNetwork, string> = {
  devnet: 'Solana Devnet',
  testnet: 'Solana Testnet',
  'mainnet-beta': 'Solana Mainnet',
};

export function isMainnetNetwork(network: SolanaNetwork): boolean {
  return network === 'mainnet-beta';
}

export function assertNetworkAllowed(network: SolanaNetwork, mainnetEnabled: boolean): void {
  if (isMainnetNetwork(network) && !mainnetEnabled) {
    throw new Error(
      'Mainnet network selected while ARMZ_MAINNET_ENABLED is false. Mainnet requires explicit owner approval.',
    );
  }
}
