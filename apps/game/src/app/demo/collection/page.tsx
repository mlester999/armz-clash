'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Cluster,
  PageContainer,
  RarityBadge,
  Section,
  Stack,
  StatGrid,
} from '@armz-clash/ui';
import { demoApi, type DemoPublicPayload } from '../../../features/demo/api';
import { ArmzPortrait, AutomatonPortrait } from '../../../features/demo/art/ArmzPortrait';

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
        <div className="mt-4 space-y-3 rounded-[var(--armz-radius-xl)] border border-[var(--armz-border)] bg-[var(--armz-surface)] p-6">
          <h1 className="text-xl font-semibold">Demo Collection</h1>
          <p className="text-sm text-[var(--armz-danger)]">{error}</p>
          <Button onClick={() => router.push('/demo')}>Start Demo Mode</Button>
        </div>
      </PageContainer>
    );
  }

  const armz = data?.armz;

  return (
    <PageContainer width="2xl">
      <Section className="pt-1">
        <Stack gap="md">
          {/* Header */}
          <div className="space-y-2">
            <p className="armz-kicker">Demo Collection</p>
            <h1 className="armz-display text-2xl sm:text-3xl">Temporary Common ARMZ</h1>
            <p className="max-w-lg text-sm text-[var(--armz-text-secondary)]">
              Collectible presentation for this demo session only {'\u2014'} not inventory, not
              mintable, not a marketplace item.
            </p>
            <Cluster gap="sm">
              <Badge variant="warning">Demo Mode</Badge>
              <Badge variant="muted">Temporary collection</Badge>
            </Cluster>
          </div>

          {armz ? (
            <div
              className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
              data-testid="demo-collection-armz"
            >
              {/* Character showcase */}
              <div className="relative overflow-hidden rounded-[var(--armz-radius-xl)] border border-[rgba(212,175,106,0.25)] bg-[linear-gradient(170deg,rgba(20,28,44,0.97),rgba(7,11,18,0.98))] p-4 shadow-[var(--armz-shadow-glow)]">
                <div className="pointer-events-none absolute inset-0" aria-hidden>
                  <div className="absolute inset-0 bg-[radial-gradient(400px_280px_at_50%_30%,rgba(94,200,255,0.06),transparent_60%)]" />
                </div>
                <div className="relative z-10 space-y-3">
                  <ArmzPortrait
                    presetKey={armz.presetKey}
                    displayName={armz.displayName}
                    palette={armz.palette}
                    size="hero"
                  />
                  <Cluster gap="sm">
                    <RarityBadge rarity="common" />
                    <Badge variant="muted">Level {armz.level}</Badge>
                    <Badge variant="warning">Temporary</Badge>
                    <Badge variant="muted">Non-transferable</Badge>
                    <Badge variant="muted">No blockchain asset</Badge>
                  </Cluster>
                </div>
              </div>

              {/* Stats + actions */}
              <div className="grid gap-3">
                <div className="space-y-4 rounded-[var(--armz-radius-xl)] border border-[var(--armz-border)] bg-[var(--armz-surface)] p-5 shadow-[var(--armz-shadow-md)]">
                  <div className="space-y-1">
                    <p className="armz-kicker">Active loadout</p>
                    <h2 className="armz-display text-2xl sm:text-3xl">{armz.displayName}</h2>
                    <p className="text-sm text-[var(--armz-text-secondary)]">{armz.tagline}</p>
                  </div>

                  <StatGrid
                    stats={[
                      { label: 'Power', value: armz.power, primary: true },
                      { label: 'Grip', value: armz.grip, primary: true },
                      { label: 'Technique', value: armz.technique },
                      { label: 'Endurance', value: armz.endurance },
                      { label: 'Defense', value: armz.defense },
                      { label: 'Speed', value: armz.speed },
                      { label: 'Luck', value: armz.luck, max: 30 },
                      {
                        label: 'Crit bps',
                        value: armz.criticalChance,
                        max: 2000,
                        format: 'bps',
                      },
                    ]}
                  />

                  <Cluster>
                    <Button
                      size="lg"
                      onClick={() => router.push('/demo/fight')}
                      data-testid="demo-fight-button"
                    >
                      Fight Easy opponent
                    </Button>
                    <Button
                      variant="secondary"
                      loading={busy}
                      disabled={(data?.session.resetAvailableInSeconds ?? 0) > 0}
                      onClick={() => void reset()}
                    >
                      {(data?.session.resetAvailableInSeconds ?? 0) > 0
                        ? `Reset in ${data?.session.resetAvailableInSeconds}s`
                        : 'Reset temporary ARMZ'}
                    </Button>
                  </Cluster>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Reward summary */}
                  <div className="space-y-2 rounded-[var(--armz-radius-lg)] border border-[rgba(212,175,106,0.2)] bg-[linear-gradient(160deg,rgba(212,175,106,0.05),rgba(7,11,18,0.95))] p-4">
                    <p className="armz-kicker">Demo reward summary</p>
                    <p className="text-3xl font-bold tabular-nums text-[var(--armz-accent)]">
                      {data?.session.demoRewardDisplay ?? '0.00'}
                    </p>
                    <p className="text-sm font-medium">Demo $ARMZ</p>
                    <ul className="space-y-0.5 text-xs text-[var(--armz-text-muted)]">
                      <li>Simulated {'\u00b7'} No monetary value</li>
                      <li>Not claimable {'\u00b7'} Not withdrawable</li>
                    </ul>
                    <p className="text-xs text-[var(--armz-text-muted)]">
                      Battles {data?.session.battlesPlayed}/{data?.session.maxBattles}
                    </p>
                  </div>

                  {/* Opponent preview */}
                  <div className="space-y-2 rounded-[var(--armz-radius-lg)] border border-[rgba(224,122,74,0.2)] bg-[linear-gradient(160deg,rgba(224,122,74,0.04),rgba(7,11,18,0.95))] p-3">
                    <p className="armz-kicker">Next opponent</p>
                    <AutomatonPortrait size="sm" />
                    <p className="text-sm font-semibold">Practice Automaton</p>
                    <p className="text-xs text-[var(--armz-text-muted)]">
                      Easy {'\u00b7'} Simulated reward range 1.00{'\u2013'}2.00 Demo $ARMZ on
                      victory
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-[var(--armz-radius-xl)] border border-[var(--armz-border)] bg-[var(--armz-surface)] p-6">
              <p className="text-sm">No active temporary ARMZ. Start Demo Mode first.</p>
              <Button onClick={() => router.push('/demo')}>Play Demo</Button>
            </div>
          )}

          {/* Battle history */}
          <div
            className="space-y-3 rounded-[var(--armz-radius-xl)] border border-[var(--armz-border)] bg-[var(--armz-surface)] p-5 shadow-[var(--armz-shadow-sm)]"
            data-testid="demo-battle-history"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Demo battle history</h3>
              <Badge variant="muted">Session only</Badge>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-[var(--armz-text-muted)]">No battles yet this session.</p>
            ) : (
              <ul className="divide-y divide-[var(--armz-border)] text-sm">
                {history.map((h) => (
                  <li
                    key={h.battleId}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <span className="font-medium">
                      <span
                        className={
                          h.outcome === 'victory'
                            ? 'text-[var(--armz-cyan)]'
                            : 'text-[var(--armz-danger)]'
                        }
                      >
                        {h.outcome === 'victory' ? 'Victory' : 'Defeat'}
                      </span>{' '}
                      vs {h.opponent}
                    </span>
                    <span className="text-[var(--armz-text-muted)]">
                      {h.demoRewardDisplay ? `${h.demoRewardDisplay} Demo $ARMZ` : 'No reward'}{' '}
                      {'\u00b7'} {(h.durationMs / 1000).toFixed(1)}s
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-[var(--armz-danger)]">{error}</p>}

          <p className="text-xs text-[var(--armz-text-muted)]">
            <Link
              href="/demo"
              className="cursor-pointer font-medium text-[var(--armz-cyan)] hover:underline"
            >
              Demo home
            </Link>{' '}
            {'\u00b7'} No sell {'\u00b7'} No transfer {'\u00b7'} No claim
          </p>
        </Stack>
      </Section>
    </PageContainer>
  );
}
