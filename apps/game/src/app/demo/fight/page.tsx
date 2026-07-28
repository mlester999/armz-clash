'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button } from '@armz-clash/ui';
import {
  demoApi,
  type DemoBattlePayload,
  type DemoPublicPayload,
} from '../../../features/demo/api';
import { BattleStage } from '../../../features/demo/components/BattleStage';
import { AutomatonArt, RookieArt } from '../../../features/demo/art/PremiumArt';
import {
  clearStoredBattle,
  markStoredBattleResultReady,
  readStoredBattle,
  saveStoredBattle,
} from '../../../features/demo/battlePersistence';

export default function DemoFightPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoPublicPayload | null>(null);
  const [battle, setBattle] = useState<DemoBattlePayload | null>(null);
  const [restoredResult, setRestoredResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stored = window.localStorage.getItem('armz-clash:reduced-motion');
    setReducedMotion(stored === null ? media.matches : stored === 'true');
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        let current: DemoPublicPayload;
        try {
          current = await demoApi.getSession();
        } catch {
          current = await demoApi.startSession();
        }
        setSession(current);
        const stored = readStoredBattle(current.session.demoSessionId);
        if (stored) {
          setBattle(stored.battle);
          setRestoredResult(stored.resultReady);
        }
      } catch (cause) {
        setError((cause as Error).message);
      }
    })();
  }, []);

  const startFight = async () => {
    setBusy(true);
    setError(null);
    setRestoredResult(false);
    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `demo-${Date.now()}`;
      const result = await demoApi.startBattle({ idempotencyKey, reducedMotion });
      saveStoredBattle(result, false);
      setBattle(result);
      setSession((current) =>
        current ? { ...current, session: result.session, armz: result.armz } : current,
      );
    } catch (cause) {
      const apiError = cause as { message?: string; data?: { retryAfterSeconds?: number } };
      setError(
        apiError.message ||
          (apiError.data?.retryAfterSeconds
            ? `Cooldown ${apiError.data.retryAfterSeconds}s`
            : 'Could not start battle'),
      );
    } finally {
      setBusy(false);
    }
  };

  if (battle) {
    return (
      <main className="phase34-battle-page">
        <BattleStage
          battle={battle}
          reducedMotion={reducedMotion}
          initialResult={restoredResult}
          onReducedMotionChange={(next) => {
            setReducedMotion(next);
            window.localStorage.setItem('armz-clash:reduced-motion', String(next));
          }}
          onResultReady={() => markStoredBattleResultReady(battle)}
          onReplay={() => {
            clearStoredBattle();
            setBattle(null);
            void startFight();
          }}
          onCollection={() => {
            clearStoredBattle();
            router.push('/demo/collection');
          }}
          onHome={() => {
            clearStoredBattle();
            router.push('/demo');
          }}
        />
      </main>
    );
  }

  return (
    <main className="phase34-page phase34-versus-page">
      <header className="phase34-versus-header">
        <div>
          <p className="phase34-eyebrow">Opponent selected · Easy</p>
          <h1 className="armz-display">The Training Table</h1>
        </div>
        <div>
          <Badge variant="warning">Demo Mode</Badge>
          <Badge variant="success">Server-authoritative</Badge>
        </div>
      </header>

      {session ? (
        <section className="phase34-versus" data-testid="demo-fight-confirm">
          <div className="phase34-versus__fighter phase34-versus__fighter--player">
            <RookieArt
              role="versus"
              alt="Rookie Brawler ready for the matchup"
              priority
              showStatus
              imageClassName="phase34-versus__fighter-image"
            />
            <div className="phase34-versus__nameplate">
              <span>Your contender · Common</span>
              <strong>{session.armz?.displayName ?? 'Rookie Brawler'}</strong>
              <small>
                Power {session.armz?.power ?? 0} · Grip {session.armz?.grip ?? 0} · Speed{' '}
                {session.armz?.speed ?? 0}
              </small>
            </div>
          </div>

          <div className="phase34-versus__center">
            <div className="phase34-versus-mark" aria-label="versus">
              VS
            </div>
            <Badge variant="enemy">Easy</Badge>
            <p>{session.opponent.estimatedMatchupLabel}</p>
            <dl className="phase34-versus-facts">
              <div>
                <dt>Duration</dt>
                <dd>≈ 11 sec</dd>
              </div>
              <div>
                <dt>Reward</dt>
                <dd>1.00–2.00</dd>
              </div>
              <div>
                <dt>Battles left</dt>
                <dd>{session.session.battlesRemaining}</dd>
              </div>
            </dl>
            <Button
              size="lg"
              loading={busy}
              disabled={!session.armz || session.session.replayAvailableInSeconds > 0}
              onClick={() => void startFight()}
              data-testid="demo-start-battle"
            >
              {session.session.replayAvailableInSeconds > 0
                ? `Ready in ${session.session.replayAvailableInSeconds}s`
                : 'Start Battle'}
            </Button>
            <Button variant="ghost" onClick={() => router.push('/demo/collection')}>
              Back to Collection
            </Button>
            <small>Simulated Demo $ARMZ · no monetary value · not claimable</small>
          </div>

          <div className="phase34-versus__fighter phase34-versus__fighter--opponent">
            <AutomatonArt
              role="versus"
              alt="Practice Automaton ready for the matchup"
              priority
              showStatus
              imageClassName="phase34-versus__fighter-image"
            />
            <div className="phase34-versus__nameplate">
              <span>Training opponent · Easy</span>
              <strong>Practice Automaton</strong>
              <small>Steady pressure · readable counters · fair training</small>
            </div>
          </div>
        </section>
      ) : (
        <section className="phase34-state-panel">
          <p>{error ?? 'Preparing the training arena…'}</p>
          {error ? <Button onClick={() => router.push('/demo')}>Open Demo Mode</Button> : null}
        </section>
      )}

      {error && session ? <p className="phase34-inline-error">{error}</p> : null}
    </main>
  );
}
