'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, RarityBadge } from '@armz-clash/ui';
import { demoApi, type DemoPublicPayload } from '../../../features/demo/api';
import { AutomatonArt, RookieArt } from '../../../features/demo/art/PremiumArt';

type HistoryItem = {
  battleId: string;
  opponent: string;
  outcome: string;
  durationMs: number;
  demoRewardDisplay: string | null;
  playedAt: string;
};

const statLabels = [
  ['Power', 'power', 100],
  ['Grip', 'grip', 100],
  ['Technique', 'technique', 100],
  ['Endurance', 'endurance', 100],
  ['Defense', 'defense', 100],
  ['Speed', 'speed', 100],
  ['Luck', 'luck', 30],
  ['Critical', 'criticalChance', 2000],
] as const;

export default function DemoCollectionPage() {
  const router = useRouter();
  const [data, setData] = useState<DemoPublicPayload | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
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
      setHistory((await demoApi.history()).history);
    } catch (cause) {
      setError((cause as Error).message || 'Failed to load demo collection');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      setData(await demoApi.resetArmz());
    } catch (cause) {
      setError((cause as Error).message || 'Training roll unavailable');
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) {
    return (
      <main className="phase34-page">
        <section className="phase34-state-panel">
          <p className="phase34-eyebrow">Collection unavailable</p>
          <h1 className="armz-display">Could not load your demo contender</h1>
          <p className="text-[var(--armz-danger)]">{error}</p>
          <Button onClick={() => router.push('/demo')}>Start Demo Mode</Button>
        </section>
      </main>
    );
  }

  const armz = data?.armz;
  const loading = !data && !error;

  return (
    <main className="phase34-page phase34-collection-page">
      <header className="phase34-collection-header">
        <div>
          <p className="phase34-eyebrow">Demo Collection · Active contender</p>
          <h1 className="armz-display">Rookie Brawler</h1>
        </div>
        <div>
          <Badge variant="warning">Temporary</Badge>
          <RarityBadge rarity="common" />
          <Badge variant="muted">Level 1</Badge>
        </div>
      </header>

      {loading ? (
        <section className="phase34-state-panel" aria-busy="true" data-testid="collection-loading">
          <p className="phase34-eyebrow">Synchronizing contender</p>
          <h2 className="armz-display">Preparing Rookie Brawler…</h2>
          <p>Loading the temporary Common and its server-authoritative session record.</p>
        </section>
      ) : armz ? (
        <section className="phase34-collection-showcase" data-testid="demo-collection-armz">
          <div className="phase34-collection-art" data-testid="armz-portrait">
            <div className="phase34-collection-art__halo" aria-hidden />
            <RookieArt
              role="hero"
              alt="Rookie Brawler collection showcase art"
              priority
              showStatus
              imageClassName="phase34-collection-art__image"
            />
            <div className="phase34-collection-art__identity">
              <span>Flagship Common</span>
              <strong>{armz.displayName}</strong>
            </div>
          </div>

          <div className="phase34-collection-details">
            <div className="phase34-collection-details__intro">
              <div>
                <p className="phase34-eyebrow">Ready for the Easy table</p>
                <h2 className="armz-display">{armz.displayName}</h2>
                <p>{armz.tagline}</p>
              </div>
              <div className="phase34-collection-token">
                <span>Demo rewards</span>
                <strong>{data?.session.demoRewardDisplay ?? '0.00'}</strong>
                <small>Demo $ARMZ · no value</small>
              </div>
            </div>

            <dl className="phase34-stat-board" aria-label="Rookie Brawler stats">
              {statLabels.map(([label, key, max]) => {
                const value = armz[key];
                return (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                    <span aria-hidden>
                      <i style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
                    </span>
                  </div>
                );
              })}
            </dl>

            <div className="phase34-collection-matchup">
              <div className="phase34-collection-opponent-art">
                <AutomatonArt role="portrait" alt="Practice Automaton portrait" />
              </div>
              <div>
                <span>Next opponent · Easy</span>
                <strong>Practice Automaton</strong>
                <p>Steady pressure, clear tells, server-authoritative result.</p>
              </div>
              <div className="phase34-collection-battle-count">
                <span>Battles left</span>
                <strong>{data?.session.battlesRemaining ?? 0}</strong>
              </div>
            </div>

            <div className="phase34-collection-actions">
              <Button
                size="lg"
                onClick={() => router.push('/demo/fight')}
                data-testid="demo-fight-button"
              >
                Fight Practice Automaton
              </Button>
              <Button
                variant="ghost"
                loading={busy}
                disabled={(data?.session.resetAvailableInSeconds ?? 0) > 0}
                onClick={() => void reset()}
              >
                {(data?.session.resetAvailableInSeconds ?? 0) > 0
                  ? `Training roll in ${data?.session.resetAvailableInSeconds}s`
                  : 'Reroll training stats'}
              </Button>
            </div>
            <p className="phase34-collection-disclaimer">
              Temporary demo identity · non-transferable · not mintable · not claimable · not a
              blockchain asset
            </p>
          </div>
        </section>
      ) : (
        <section className="phase34-state-panel">
          <p>No active temporary ARMZ. Start Demo Mode first.</p>
          <Button onClick={() => router.push('/demo')}>Play Demo</Button>
        </section>
      )}

      <section
        id="history"
        className="phase34-history"
        data-testid="demo-battle-history"
        aria-labelledby="history-title"
      >
        <div className="phase34-history__heading">
          <div>
            <p className="phase34-eyebrow">Session record</p>
            <h2 id="history-title" className="armz-display">
              Battle History
            </h2>
          </div>
          <Badge variant="muted">Session only</Badge>
        </div>
        {history.length === 0 ? (
          <div className="phase34-history__empty">
            <span>00</span>
            <p>No battles yet. Your first result will appear here after the final slam.</p>
          </div>
        ) : (
          <ol className="phase34-history-list">
            {history.map((item) => (
              <li key={item.battleId}>
                <div className="phase34-history-list__portraits">
                  <RookieArt role="portrait" alt="Rookie Brawler" />
                  <AutomatonArt role="portrait" alt="Practice Automaton" />
                </div>
                <div>
                  <strong className={item.outcome === 'victory' ? 'is-victory' : 'is-defeat'}>
                    {item.outcome === 'victory' ? 'Victory' : 'Defeat'}
                  </strong>
                  <span>vs {item.opponent}</span>
                </div>
                <div>
                  <strong>{(item.durationMs / 1000).toFixed(1)}s</strong>
                  <span>
                    {item.demoRewardDisplay ? `${item.demoRewardDisplay} Demo $ARMZ` : 'No reward'}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {error ? <p className="phase34-inline-error">{error}</p> : null}
    </main>
  );
}
