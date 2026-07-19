export type PublicProfile = {
  id: string;
  displayName: string;
  avatarPreset: string;
  primaryWalletAddress: string | null;
};

export type SessionPayload = {
  authenticated: boolean;
  profile?: PublicProfile;
  walletAddress?: string;
  session?: {
    expiresAt: string;
    absoluteExpiresAt: string;
  };
  network?: string;
  csrf?: boolean;
};

export type BalancePayload = {
  network: string;
  sol: { lamports: number; sol: number } | null;
  armz: { amount: string; decimals: number; configured: boolean } | null;
  rpcStatus: 'ok' | 'unavailable' | 'not_configured';
  queriedAt: string;
  walletAddress?: string;
};
