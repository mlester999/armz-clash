'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import { canTransition, type WalletAuthState } from '@armz-clash/blockchain/auth/wallet-state';
import { initArmzReownAppKit } from '@armz-clash/blockchain/client/reown';
import bs58 from 'bs58';
import { createAuthApi, readCsrfCookie, truncateWalletAddress } from './api';
import type { BalancePayload, PublicProfile } from './types';

type WalletContextValue = {
  state: WalletAuthState;
  address?: string;
  truncatedAddress?: string;
  isConnected: boolean;
  isAuthenticated: boolean;
  profile?: PublicProfile;
  balances?: BalancePayload;
  error?: string;
  networkLabel: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function WalletRuntime({
  children,
  apiUrl,
  metadataUrl,
}: {
  children: ReactNode;
  apiUrl: string;
  metadataUrl: string;
}) {
  const api = useMemo(() => createAuthApi(apiUrl), [apiUrl]);
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const { disconnect: appKitDisconnect } = useDisconnect();

  const [state, setState] = useState<WalletAuthState>('disconnected');
  const [profile, setProfile] = useState<PublicProfile | undefined>();
  const [balances, setBalances] = useState<BalancePayload | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [boundWallet, setBoundWallet] = useState<string | undefined>();

  const setWalletState = useCallback((next: WalletAuthState) => {
    setState((prev) => {
      if (!canTransition(prev, next)) return prev;
      return next;
    });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await api.session();
      if (session.authenticated && session.profile) {
        setProfile(session.profile);
        setBoundWallet(session.walletAddress);
        setWalletState('authenticated');
      } else if (isConnected && address) {
        setProfile(undefined);
        setWalletState('connected_unauthenticated');
      } else {
        setProfile(undefined);
        setWalletState('disconnected');
      }
    } catch {
      if (isConnected && address) setWalletState('connected_unauthenticated');
      else setWalletState('disconnected');
    }
  }, [api, address, isConnected, setWalletState]);

  const refreshBalances = useCallback(async () => {
    try {
      const data = await api.balances();
      setBalances(data);
      if (data.rpcStatus === 'unavailable') setWalletState('rpc_unavailable');
    } catch {
      // ignore when unauthenticated
    }
  }, [api, setWalletState]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!isConnected || !address) {
      if (state === 'authenticated' || state === 'connected_unauthenticated') {
        setWalletState('disconnected');
        setProfile(undefined);
        setBalances(undefined);
      }
      return;
    }
    if (boundWallet && boundWallet !== address && state === 'authenticated') {
      void api.logout().finally(() => {
        setProfile(undefined);
        setBoundWallet(undefined);
        setBalances(undefined);
        setWalletState('connected_unauthenticated');
      });
      return;
    }
    if (state === 'disconnected' || state === 'connecting' || state === 'opening_connector') {
      setWalletState('connected_unauthenticated');
    }
  }, [address, isConnected, boundWallet, state, api, setWalletState]);

  const connect = useCallback(async () => {
    setError(undefined);
    setWalletState('opening_connector');
    try {
      setWalletState('connecting');
      await open({ view: 'Connect' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open wallet');
      setWalletState('error');
    }
  }, [open, setWalletState]);

  const disconnect = useCallback(async () => {
    setWalletState('disconnecting');
    try {
      await api.logout();
    } catch {
      // ignore
    }
    try {
      await appKitDisconnect();
    } catch {
      // ignore
    }
    setProfile(undefined);
    setBalances(undefined);
    setBoundWallet(undefined);
    setWalletState('disconnected');
  }, [api, appKitDisconnect, setWalletState]);

  const signIn = useCallback(async () => {
    if (!address || !walletProvider) {
      setError('Connect a Solana wallet first');
      return;
    }
    setError(undefined);
    try {
      setWalletState('requesting_challenge');
      const challenge = await api.challenge(address, metadataUrl);
      setWalletState('awaiting_signature');
      const encoded = new TextEncoder().encode(challenge.message);
      const rawSig = await walletProvider.signMessage(encoded);
      const signature = typeof rawSig === 'string' ? rawSig : bs58.encode(rawSig as Uint8Array);
      setWalletState('verifying_signature');
      const verified = await api.verify({
        challengeId: challenge.challengeId,
        walletAddress: address,
        message: challenge.message,
        signature,
        signatureEncoding: 'base58',
      });
      setProfile(verified.profile);
      setBoundWallet(address);
      setWalletState('authenticated');
      await refreshBalances();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign-in failed';
      setError(message);
      if (/reject|denied|cancel/i.test(message)) setWalletState('signature_rejected');
      else if (/expired/i.test(message)) setWalletState('challenge_expired');
      else setWalletState('connected_unauthenticated');
    }
  }, [address, walletProvider, api, metadataUrl, refreshBalances, setWalletState]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setProfile(undefined);
      setBalances(undefined);
      setBoundWallet(undefined);
      if (isConnected) setWalletState('connected_unauthenticated');
      else setWalletState('disconnected');
    }
  }, [api, isConnected, setWalletState]);

  const updateDisplayName = useCallback(
    async (name: string) => {
      const csrf = readCsrfCookie();
      if (!csrf) throw new Error('Missing CSRF token');
      const res = await api.updateProfile(csrf, { displayName: name });
      setProfile(res.profile);
    },
    [api],
  );

  const value: WalletContextValue = {
    state,
    address,
    truncatedAddress: address ? truncateWalletAddress(address) : undefined,
    isConnected: Boolean(isConnected && address),
    isAuthenticated: state === 'authenticated' && Boolean(profile),
    profile,
    balances,
    error,
    networkLabel: 'Solana Devnet',
    connect,
    disconnect,
    signIn,
    logout,
    refreshSession,
    refreshBalances,
    updateDisplayName,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function ArmzWalletProvider({
  children,
  apiUrl,
  projectId,
  metadataUrl,
  iconUrl,
}: {
  children: ReactNode;
  apiUrl: string;
  projectId: string;
  metadataUrl: string;
  iconUrl?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ok = initArmzReownAppKit({ projectId, metadataUrl, iconUrl });
    setReady(ok || !projectId);
  }, [projectId, metadataUrl, iconUrl]);

  if (!ready) {
    return (
      <WalletContext.Provider
        value={{
          state: projectId ? 'connecting' : 'unavailable',
          isConnected: false,
          isAuthenticated: false,
          networkLabel: 'Solana Devnet',
          connect: async () => undefined,
          disconnect: async () => undefined,
          signIn: async () => undefined,
          logout: async () => undefined,
          refreshSession: async () => undefined,
          refreshBalances: async () => undefined,
          updateDisplayName: async () => undefined,
        }}
      >
        {children}
      </WalletContext.Provider>
    );
  }

  if (!projectId) {
    return (
      <WalletContext.Provider
        value={{
          state: 'unavailable',
          isConnected: false,
          isAuthenticated: false,
          networkLabel: 'Solana Devnet',
          error: 'Reown project ID is not configured',
          connect: async () => undefined,
          disconnect: async () => undefined,
          signIn: async () => undefined,
          logout: async () => undefined,
          refreshSession: async () => undefined,
          refreshBalances: async () => undefined,
          updateDisplayName: async () => undefined,
        }}
      >
        {children}
      </WalletContext.Provider>
    );
  }

  return (
    <WalletRuntime apiUrl={apiUrl} metadataUrl={metadataUrl}>
      {children}
    </WalletRuntime>
  );
}

export function useArmzWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useArmzWallet must be used within ArmzWalletProvider');
  }
  return ctx;
}

export function useOptionalArmzWallet(): WalletContextValue | null {
  return useContext(WalletContext);
}
