'use client';

import { createAppKit } from '@reown/appkit/react';
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react';
import { solanaDevnet } from '@reown/appkit/networks';

let initialized = false;

/**
 * Official Reown AppKit Solana setup — Devnet only.
 * Source: https://docs.reown.com/appkit/next/core/installation (Solana tab)
 * Call once on the client before useAppKit hooks.
 */
export function initArmzReownAppKit(input: {
  projectId: string;
  metadataUrl: string;
  iconUrl?: string;
}): boolean {
  if (initialized) return true;
  if (typeof window === 'undefined') return false;
  if (!input.projectId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Armz Clash] Reown configuration: missing');
    }
    return false;
  }

  const solanaAdapter = new SolanaAdapter();

  createAppKit({
    adapters: [solanaAdapter],
    networks: [solanaDevnet],
    defaultNetwork: solanaDevnet,
    projectId: input.projectId,
    metadata: {
      name: 'Armz Clash',
      description: 'Premium Solana arm-wrestling game built testnet-first.',
      url: input.metadataUrl,
      icons: [input.iconUrl ?? `${input.metadataUrl}/icon.svg`],
    },
    features: {
      analytics: false,
      email: false,
      socials: false,
    },
  });

  initialized = true;
  if (process.env.NODE_ENV === 'development') {
    // Never print the Project ID. Use warn so lint allows the dev-only status line.
    console.warn('[Armz Clash] Reown configuration: configured');
  }
  return true;
}

export function isArmzReownReady(): boolean {
  return initialized;
}
