'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useArmzWallet } from './WalletProvider';
import { truncateWalletAddress } from './api';

export function ConnectWalletButton({ className }: { className?: string }) {
  const { state, connect, isConnected } = useArmzWallet();
  if (isConnected) return null;
  const loading = state === 'opening_connector' || state === 'connecting';
  return (
    <Button
      className={className}
      onClick={() => void connect()}
      loading={loading}
      aria-label="Connect Solana wallet"
    >
      Connect Wallet
    </Button>
  );
}

export function WalletNetworkBadge() {
  const { networkLabel } = useArmzWallet();
  return <Badge variant="info">{networkLabel}</Badge>;
}

export function SessionStatus() {
  const { isAuthenticated, state } = useArmzWallet();
  if (isAuthenticated) return <Badge variant="success">Signed in</Badge>;
  if (state === 'connected_unauthenticated')
    return <Badge variant="warning">Sign in required</Badge>;
  return <Badge variant="muted">Not connected</Badge>;
}

export function WalletErrorPanel() {
  const { error, state } = useArmzWallet();
  if (!error && state !== 'wrong_network' && state !== 'rpc_unavailable') return null;
  return (
    <div
      role="alert"
      className="rounded-[var(--armz-radius-md)] border border-[rgba(240,113,120,0.35)] bg-[rgba(240,113,120,0.08)] px-3 py-2 text-sm text-[var(--armz-danger)]"
    >
      {state === 'wrong_network'
        ? 'Armz Clash accepts Solana Devnet only. Mainnet is disabled.'
        : state === 'rpc_unavailable'
          ? 'Solana Devnet RPC is temporarily unavailable.'
          : error}
    </div>
  );
}

export function SignInPrompt() {
  const { isConnected, isAuthenticated, signIn, state } = useArmzWallet();
  if (!isConnected || isAuthenticated) return null;
  const loading =
    state === 'requesting_challenge' ||
    state === 'awaiting_signature' ||
    state === 'verifying_signature';
  return (
    <div className="armz-card space-y-3 p-4">
      <p className="text-sm text-[var(--armz-text-secondary)]">
        Prove control of your wallet to create a secure Armz Clash session. This signature does not
        spend SOL and does not open real-value gameplay.
      </p>
      <Button onClick={() => void signIn()} loading={loading}>
        Sign in with wallet
      </Button>
    </div>
  );
}

export function WalletAccountMenu() {
  const {
    address,
    truncatedAddress,
    isConnected,
    isAuthenticated,
    profile,
    balances,
    networkLabel,
    signIn,
    logout,
    disconnect,
    refreshBalances,
    state,
  } = useArmzWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!isConnected || !address) return null;

  const solLabel = balances?.sol != null ? `${balances.sol.sol.toFixed(4)} SOL` : 'SOL —';
  const armzLabel =
    balances?.armz == null
      ? 'Token —'
      : !balances.armz.configured
        ? 'Token not configured'
        : balances.armz.amount === ''
          ? 'Token —'
          : `${formatTokenAmount(balances.armz.amount, balances.armz.decimals)} $ARMZ`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-[var(--armz-radius-md)] border border-[var(--armz-border)] bg-[rgba(36,48,74,0.85)] px-3 py-2 text-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-mono">{truncatedAddress ?? truncateWalletAddress(address)}</span>
        {isAuthenticated ? (
          <Badge variant="success">Auth</Badge>
        ) : (
          <Badge variant="warning">Guest</Badge>
        )}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[50] mt-2 w-[min(100vw-2rem,20rem)] rounded-[var(--armz-radius-lg)] border border-[var(--armz-border)] bg-[var(--armz-bg-panel)] p-3 shadow-[var(--armz-shadow-md)]"
        >
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--armz-text-muted)]">Address</span>
              <button
                type="button"
                className="font-mono text-xs underline-offset-2 hover:underline"
                onClick={() => void navigator.clipboard.writeText(address)}
              >
                Copy
              </button>
            </div>
            <p className="break-all font-mono text-xs">{address}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{networkLabel}</Badge>
              <SessionStatusChip authenticated={isAuthenticated} />
            </div>
            {profile ? (
              <p className="text-[var(--armz-text-secondary)]">Player: {profile.displayName}</p>
            ) : null}
            <div className="grid gap-1 rounded-md border border-[var(--armz-border)] p-2 text-xs">
              <div className="flex justify-between gap-2">
                <span>SOL (Devnet)</span>
                <span>{solLabel}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>$ARMZ</span>
                <span>{armzLabel}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              {!isAuthenticated ? (
                <Button
                  size="sm"
                  onClick={() => void signIn()}
                  loading={
                    state === 'requesting_challenge' ||
                    state === 'awaiting_signature' ||
                    state === 'verifying_signature'
                  }
                >
                  Sign in
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="secondary" onClick={() => void refreshBalances()}>
                    Refresh balances
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void logout()}>
                    Log out
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => void disconnect()}>
                Disconnect wallet
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SessionStatusChip({ authenticated }: { authenticated: boolean }) {
  return authenticated ? (
    <Badge variant="success">Signed in</Badge>
  ) : (
    <Badge variant="warning">Not signed in</Badge>
  );
}

function formatTokenAmount(amount: string, decimals: number): string {
  if (!amount) return '0';
  if (decimals <= 0) return amount;
  const padded = amount.padStart(decimals + 1, '0');
  const whole = padded.slice(0, -decimals) || '0';
  const frac = padded.slice(-decimals).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}

export function WalletStatusButton() {
  const { isConnected } = useArmzWallet();
  if (!isConnected) return <ConnectWalletButton />;
  return <WalletAccountMenu />;
}
