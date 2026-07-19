import type { SolanaNetworkId } from './network';

const EXPLORER_BASE = 'https://explorer.solana.com';

function clusterQuery(network: SolanaNetworkId): string {
  if (network === 'mainnet-beta') return '';
  return `?cluster=${network}`;
}

export function buildTransactionExplorerUrl(
  signature: string,
  network: SolanaNetworkId = 'devnet',
): string {
  return `${EXPLORER_BASE}/tx/${encodeURIComponent(signature)}${clusterQuery(network)}`;
}

export function buildAddressExplorerUrl(
  address: string,
  network: SolanaNetworkId = 'devnet',
): string {
  return `${EXPLORER_BASE}/address/${encodeURIComponent(address)}${clusterQuery(network)}`;
}
