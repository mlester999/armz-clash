'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, PageContainer, Section, Stack } from '@armz-clash/ui';
import { demoApi, type DemoPublicPayload } from '../../../features/demo/api';

export default function DemoCollectionPage() {
  const router = useRouter();
  const [data, setData] = useState<DemoPublicPayload | null>(null);
  const [history, setHistory] = useState<
    Array<{
      battleId: string;
      opponent: string;
      outcome: string;
      durationMs: number;
      demoRewardDisplay: string | null;
      playedAt: string;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      let session: DemoPublicPayload;
      try {
        session = await demoApi.getSession();
      } catch {
        session = await demoApi.startSession();
      }
      setData(session);
      const h = await demoApi.history();
      setHistory(h.history);
    } catch (e) {
      setError((e as Error).message || 'Failed to load demo collection');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await demoApi.resetArmz();
      setData(next);
    } catch (e) {
      setError((e as Error).message || 'Reset unavailable');
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) {
    return (
      <PageContainer>
        <Card className="mt-6 space-y-3 p-6">
          <h1 className="text-xl font-semibold">Demo Collection</h1>
          <p className="text-sm text-[var(--armz-danger)]">{error}</p>
          <Button onClick={() => router.push('/demo')}>Start Demo Mode</Button>
        </Card>
      </PageContainer>
    );
  }

  const armz = data?.armz;

  return (
    <PageContainer width="2xl">
      <Section className="pt-2">
        <Stack gap="lg">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="warning">Demo Mode</Badge>
              <Badge variant="muted">Temporary collection</Badge>
            </div>
            <h1 className="text-3xl font-semibold">Demo Collection</h1>
            <p className="text-sm text-[var(--armz-text-secondary)]">
              Temporary Common ARMZ for this demo session only. Not inventory. Not mintable. Not a
              marketplace item.
            </p>
          </div>

          {armz ? (
            <Card className="space-y-4 p-6" data-testid="demo-collection-armz">
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">Common</Badge>
                <Badge variant="muted">Level 1</Badge>
                <Badge variant="warning">Temporary</Badge>
                <Badge variant="muted">Non-transferable</Badge>
                <Badge variant="muted">No blockchain asset</Badge>
              </div>
              <h2 className="text-2xl font-semibold">{armz.displayName}</h2>
              <p className="text-sm text-[var(--armz-text-secondary)]">{armz.tagline}</p>
              <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {(
                  [
                    ['Power', armz.power],
                    ['Grip', armz.grip],
                    ['Technique', armz.technique],
                    ['Endurance', armz.endurance],
                    ['Defense', armz.defense],
                    ['Speed', armz.speed],
                    ['Luck', armz.luck],
                    ['Crit bps', armz.criticalChance],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="rounded-md border border-[var(--armz-border)] px-3 py-2">
                    <dt className="text-[var(--armz-text-muted)]">{k}</dt>
                    <dd className="font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => router.push('/demo/fight')} data-testid="demo-fight-button">
                  Fight Easy opponent
                </Button>
                <Button
                  variant="ghost"
                  loading={busy}
                  disabled={(data?.session.resetAvailableInSeconds ?? 0) > 0}
                  onClick={() => void reset()}
                >
                  {(data?.session.resetAvailableInSeconds ?? 0) > 0
                    ? `Reset in ${data?.session.resetAvailableInSeconds}s`
                    : 'Reset temporary ARMZ'}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <p className="text-sm">No active temporary ARMZ. Start Demo Mode first.</p>
              <Button className="mt-3" onClick={() => router.push('/demo')}>
                Play Demo
              </Button>
            </Card>
          )}

          {data && (
            <Card className="space-y-3 p-5">
              <h3 className="font-semibold">Demo reward summary</h3>
              <p className="text-2xl font-semibold tabular-nums">
                {data.session.demoRewardDisplay} Demo $ARMZ
              </p>
              <p className="text-xs text-[var(--armz-text-muted)]">
                Simulated · No monetary value · Not claimable · Not withdrawable
              </p>
              <p className="text-xs text-[var(--armz-text-muted)]">
                Battles {data.session.battlesPlayed}/{data.session.maxBattles} · Session expires{' '}
                {new Date(data.session.expiresAt).toLocaleString()}
              </p>
            </Card>
          )}

          <Card className="space-y-3 p-5" data-testid="demo-battle-history">
            <h3 className="font-semibold">Demo battle history</h3>
            {history.length === 0 ? (
              <p className="text-sm text-[var(--armz-text-muted)]">No battles yet this session.</p>
            ) : (
              <ul className="divide-y divide-[var(--armz-border)] text-sm">
                {history.map((h) => (
                  <li key={h.battleId} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>
                      {h.outcome === 'victory' ? 'Victory' : 'Defeat'} vs {h.opponent}
                    </span>
                    <span className="text-[var(--armz-text-muted)]">
                      {h.demoRewardDisplay ? `${h.demoRewardDisplay} Demo $ARMZ` : 'No reward'} ·{' '}
                      {(h.durationMs / 1000).toFixed(1)}s
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {error && <p className="text-sm text-[var(--armz-danger)]">{error}</p>}

          <p className="text-xs text-[var(--armz-text-muted)]">
            <Link href="/demo" className="underline">
              Demo home
            </Link>{' '}
            · No sell · No transfer · No claim
          </p>
        </Stack>
      </Section>
    </PageContainer>
  );
}
