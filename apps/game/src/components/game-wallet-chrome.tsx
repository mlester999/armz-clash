'use client';

import dynamic from 'next/dynamic';
import { loadClientEnv } from '@armz-clash/config';

const Chrome = dynamic(() => import('./game-wallet-runtime').then((m) => m.GameWalletRuntime), {
  ssr: false,
  loading: () => (
    <button
      type="button"
      className="inline-flex min-h-11 items-center rounded-[var(--armz-radius-md)] border border-[var(--armz-border)] px-3 text-sm text-[var(--armz-text-muted)]"
      disabled
    >
      Wallet…
    </button>
  ),
});

export function GameWalletChrome() {
  const env = loadClientEnv();
  return (
    <Chrome
      apiUrl={env.NEXT_PUBLIC_ARMZ_API_URL || 'http://127.0.0.1:4000'}
      projectId={env.NEXT_PUBLIC_REOWN_PROJECT_ID || ''}
      metadataUrl={env.NEXT_PUBLIC_ARMZ_GAME_URL || 'http://127.0.0.1:3001'}
    />
  );
}
