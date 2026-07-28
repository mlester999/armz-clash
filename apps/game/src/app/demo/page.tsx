'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button } from '@armz-clash/ui';
import { demoApi, type DemoPublicPayload } from '../../features/demo/api';
import { DemoDisclosure } from '../../features/demo/components/DemoDisclosure';
import { ArmzReveal } from '../../features/demo/components/ArmzReveal';
import { AutomatonArt, RookieArt } from '../../features/demo/art/PremiumArt';

type Phase = 'landing' | 'disclosure' | 'reveal' | 'ready' | 'unavailable' | 'error';

export default function DemoEntryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('landing');
  const [payload, setPayload] = useState<DemoPublicPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    void demoApi
      .config()
      .then((config) => {
        if (!config.demoModeEnabled) setPhase('unavailable');
      })
      .catch(() => undefined);
  }, []);

  const startDemo = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await demoApi.startSession();
      setPayload(data);
      setPhase(data.isNew || !data.armz ? 'reveal' : 'ready');
    } catch (cause) {
      const apiError = cause as { message?: string; code?: string };
      if (apiError.code === 'demo_mode_disabled') setPhase('unavailable');
      else {
        setError(apiError.message || 'Could not start Demo Mode');
        setPhase('error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="phase34-page phase34-demo-entry">
      {phase !== 'reveal' ? (
        <header className="phase34-demo-entry__header">
          <div>
            <p className="phase34-eyebrow">Flagship Demo · Easy</p>
            <h1 className="armz-display">Enter the Arena</h1>
          </div>
          <p>Rookie Brawler versus Practice Automaton. One fast, truthful, simulated-only clash.</p>
        </header>
      ) : null}

      {(phase === 'landing' || phase === 'disclosure') && (
        <section className="phase34-demo-matchup" aria-label="Demo matchup preview">
          <div className="phase34-demo-matchup__fighter phase34-demo-matchup__fighter--player">
            <RookieArt
              role="versus"
              alt="Rookie Brawler versus artwork"
              priority
              showStatus
              imageClassName="phase34-demo-matchup__image"
            />
            <span>Your ARMZ</span>
            <strong>Rookie Brawler</strong>
          </div>

          <div className="phase34-demo-matchup__center">
            <Badge variant="warning">Demo Mode</Badge>
            <p className="phase34-eyebrow">Free practice</p>
            <h2 className="armz-display">Grip. Counter. Slam.</h2>
            <p>
              No wallet, transaction, or real reward. The server decides the outcome; this client
              presents it.
            </p>
            <Button
              size="lg"
              onClick={() => setPhase('disclosure')}
              loading={busy}
              disabled={!hydrated}
              data-testid="play-demo-button"
            >
              Play Demo
            </Button>
            <Link href="/" className="phase34-text-link">
              Back to game landing
            </Link>
            <ol className="phase34-demo-steps">
              <li>
                <b>01</b>
                <span>Reveal Rookie Brawler</span>
              </li>
              <li>
                <b>02</b>
                <span>Inspect the collection</span>
              </li>
              <li>
                <b>03</b>
                <span>Fight the Automaton</span>
              </li>
            </ol>
          </div>

          <div className="phase34-demo-matchup__fighter phase34-demo-matchup__fighter--opponent">
            <AutomatonArt
              role="versus"
              alt="Practice Automaton versus artwork"
              priority
              showStatus
              imageClassName="phase34-demo-matchup__image"
            />
            <span>Easy opponent</span>
            <strong>Practice Automaton</strong>
          </div>
        </section>
      )}

      {phase === 'reveal' && payload?.armz ? (
        <ArmzReveal
          armz={payload.armz}
          reducedMotion={reducedMotion}
          onContinue={() => router.push('/demo/collection')}
        />
      ) : null}

      {phase === 'ready' && payload?.armz ? (
        <section className="phase34-session-ready" data-testid="demo-session-ready">
          <div className="phase34-session-ready__art">
            <RookieArt
              role="hero"
              alt="Rookie Brawler ready for the demo arena"
              priority
              showStatus
            />
          </div>
          <div>
            <Badge variant="success">Session ready</Badge>
            <p className="phase34-eyebrow">Contender loaded</p>
            <h2 className="armz-display">{payload.armz.displayName}</h2>
            <p>
              Your temporary Common is synchronized. Inspect the collection or move directly to the
              Easy matchup.
            </p>
            <div className="phase34-session-ready__actions">
              <Button size="lg" onClick={() => router.push('/demo/fight')}>
                Fight Automaton
              </Button>
              <Button variant="secondary" onClick={() => router.push('/demo/collection')}>
                Open Collection
              </Button>
            </div>
            <small>No monetary value · not claimable · not transferable</small>
          </div>
        </section>
      ) : null}

      {phase === 'unavailable' ? (
        <section className="phase34-state-panel" data-testid="demo-unavailable">
          <p className="phase34-eyebrow">Demo unavailable</p>
          <h2 className="armz-display">The practice arena is closed.</h2>
          <p>ARMZ_DEMO_MODE_ENABLED is false. The demo fails closed and no session is created.</p>
          <Button variant="ghost" onClick={() => router.push('/')}>
            Return Home
          </Button>
        </section>
      ) : null}

      {phase === 'error' ? (
        <section className="phase34-state-panel" data-testid="demo-start-error">
          <p className="phase34-eyebrow">Connection interrupted</p>
          <h2 className="armz-display">Could not start Demo Mode</h2>
          <p className="text-[var(--armz-danger)]" data-testid="demo-start-error-message">
            {error}
          </p>
          <Button onClick={() => setPhase('landing')}>Try again</Button>
        </section>
      ) : null}

      <DemoDisclosure
        open={phase === 'disclosure'}
        onCancel={() => setPhase('landing')}
        onConfirm={() => void startDemo()}
      />
    </main>
  );
}
