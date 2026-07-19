'use client';

import { useEffect, useState } from 'react';
import { Card } from '@armz-clash/ui';
import { createAuthApi } from '@armz-clash/ui';
import { loadClientEnv } from '@armz-clash/config';

/** Session panel that does not require Reown hooks — reads HttpOnly session via API. */
export function GameAuthPanel() {
  const [label, setLabel] = useState<string>('Checking session…');
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const env = loadClientEnv();
    const api = createAuthApi(env.NEXT_PUBLIC_ARMZ_API_URL || 'http://127.0.0.1:4000');
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8_000);
    void api
      .session()
      .then((session) => {
        if (controller.signal.aborted) return;
        if (session.authenticated && session.profile) {
          setAuthed(true);
          setLabel(
            `Signed in as ${session.profile.displayName} (${session.walletAddress?.slice(0, 4)}…)`,
          );
        } else {
          setAuthed(false);
          setLabel('Not signed in — connect a wallet and sign the Armz Clash challenge.');
        }
      })
      .catch(() => {
        if (controller.signal.aborted) {
          setAuthed(false);
          setLabel('Not signed in — connect a wallet and sign the Armz Clash challenge.');
          return;
        }
        setAuthed(false);
        setLabel('Session service unavailable. Start the API on port 4000.');
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <Card
      className="space-y-2 p-5"
      data-testid={authed ? 'authenticated-panel' : 'unauthenticated-panel'}
    >
      <h2 className="font-semibold">{authed ? 'Authenticated' : 'Wallet authentication'}</h2>
      <p className="text-sm text-[var(--armz-text-secondary)]">{label}</p>
    </Card>
  );
}
