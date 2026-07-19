export type WalletAuthState =
  | 'unavailable'
  | 'disconnected'
  | 'opening_connector'
  | 'connecting'
  | 'connected_unauthenticated'
  | 'requesting_challenge'
  | 'awaiting_signature'
  | 'verifying_signature'
  | 'authenticated'
  | 'session_renewing'
  | 'wrong_network'
  | 'signature_rejected'
  | 'challenge_expired'
  | 'session_expired'
  | 'rpc_unavailable'
  | 'disconnecting'
  | 'error';

const ALLOWED: Record<WalletAuthState, WalletAuthState[]> = {
  unavailable: ['disconnected', 'error'],
  disconnected: ['opening_connector', 'connecting', 'unavailable', 'error'],
  opening_connector: ['connecting', 'disconnected', 'error'],
  connecting: ['connected_unauthenticated', 'disconnected', 'error', 'wrong_network'],
  connected_unauthenticated: [
    'requesting_challenge',
    'disconnecting',
    'disconnected',
    'wrong_network',
    'error',
    'authenticated',
  ],
  requesting_challenge: [
    'awaiting_signature',
    'connected_unauthenticated',
    'challenge_expired',
    'error',
    'disconnecting',
  ],
  awaiting_signature: [
    'verifying_signature',
    'signature_rejected',
    'challenge_expired',
    'connected_unauthenticated',
    'error',
    'disconnecting',
  ],
  verifying_signature: [
    'authenticated',
    'signature_rejected',
    'challenge_expired',
    'connected_unauthenticated',
    'error',
  ],
  authenticated: [
    'session_renewing',
    'session_expired',
    'disconnecting',
    'disconnected',
    'wrong_network',
    'error',
  ],
  session_renewing: ['authenticated', 'session_expired', 'error', 'disconnecting'],
  wrong_network: ['connected_unauthenticated', 'disconnecting', 'disconnected', 'error'],
  signature_rejected: ['connected_unauthenticated', 'requesting_challenge', 'disconnecting'],
  challenge_expired: ['connected_unauthenticated', 'requesting_challenge', 'disconnecting'],
  session_expired: [
    'connected_unauthenticated',
    'requesting_challenge',
    'disconnecting',
    'disconnected',
  ],
  rpc_unavailable: ['disconnected', 'connected_unauthenticated', 'error'],
  disconnecting: ['disconnected', 'error'],
  error: ['disconnected', 'connected_unauthenticated', 'unavailable'],
};

export function canTransition(from: WalletAuthState, to: WalletAuthState): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

export function transitionWalletState(from: WalletAuthState, to: WalletAuthState): WalletAuthState {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid wallet state transition: ${from} -> ${to}`);
  }
  return to;
}
