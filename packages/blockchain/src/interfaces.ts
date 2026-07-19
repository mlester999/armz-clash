/**
 * Future integration interfaces only — not implemented in Phase 1.
 * No live Reown, signers, or transaction submission here.
 */

export type FutureWalletConnectorStatus = 'not_configured' | 'available' | 'connected' | 'error';

export interface FutureReownWalletConnector {
  readonly provider: 'reown-appkit';
  readonly status: FutureWalletConnectorStatus;
  /** Phase 2+: connect a Solana wallet via Reown AppKit. */
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface FutureTransactionVerificationRequest {
  readonly signature: string;
  readonly expectedMemo?: string;
  readonly minContextSlot?: number;
}

export interface FutureTransactionVerificationResult {
  readonly verified: boolean;
  readonly reason?: string;
}

export interface FutureTransactionVerifier {
  verify(
    request: FutureTransactionVerificationRequest,
  ): Promise<FutureTransactionVerificationResult>;
}
