'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  Cluster,
  PageContainer,
  PageHero,
  Section,
  Stack,
} from '@armz-clash/ui';
import { demoApi, type DemoPublicPayload } from '../../features/demo/api';
import { DemoDisclosure } from '../../features/demo/components/DemoDisclosure';
import { ArmzReveal } from '../../features/demo/components/ArmzReveal';
import { ArmzPortrait, AutomatonPortrait } from '../../features/demo/art/ArmzPortrait';

type Phase = 'landing' | 'disclosure' | 'reveal' | 'ready' | 'unavailable' | 'error';

export default function DemoEntryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('landing');
  const [payload, setPayload] = useState<DemoPublicPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    void demoApi
      .config()
      .then((c) => {
        if (!c.demoModeEnabled) setPhase('unavailable');
      })
      .catch(() => {
        /* config optional */
      });
  }, []);

  const startDemo = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await demoApi.startSession();
      setPayload(data);
      setPhase(data.isNew || !data.armz ? 'reveal' : 'ready');
    } catch (e) {
      const err = e as { message?: string; code?: string };
      if (err.code === 'demo_mode_disabled') setPhase('unavailable');
      else {
        setError(err.message || 'Could not start Demo Mode');
        setPhase('error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer width="2xl">
      <Section className="pt-1">
        <Stack gap="md">
          <PageHero
            kicker="Demo Mode"
            title="Play Demo"
            description="Receive a temporary Level 1 Common ARMZ and clash with the Easy Practice Automaton. Battles are simulated on the server. Rewards have no monetary value and cannot be claimed."
            badges={
              <>
                <Badge variant="warning">Demo Mode</Badge>
                <Badge variant="success">No wallet required</Badge>
                <Badge variant="muted">Simulated only</Badge>
              </>
            }
          />

          {(phase === 'landing' || phase === 'disclosure') && (
            <div className="grid items-stretch gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <Card premium className="flex flex-col gap-5 p-5 sm:p-6">
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">Free practice. Zero real value.</h2>
                  <p className="text-sm leading-relaxed text-[var(--armz-text-secondary)]">
                    Demo Mode is a polished training slice of Armz Clash — no blockchain
                    transaction, no real $ARMZ, no claim path.
                  </p>
                  <Cluster>
                    <Button
                      size="lg"
                      type="button"
                      onClick={() => setPhase('disclosure')}
                      loading={busy}
                      data-testid="play-demo-button"
                    >
                      Play Demo
                    </Button>
                    <Link
                      href="/"
                      className="cursor-pointer text-sm font-medium text-[var(--armz-cyan)] underline-offset-4 hover:underline"
                    >
                      Back to game shell
                    </Link>
                  </Cluster>
                  <ol className="grid gap-2 sm:grid-cols-2">
                    {[
                      'Receive a temporary Common ARMZ',
                      'Inspect collection & stats',
                      'Fight Practice Automaton',
                      'See simulated outcome',
                    ].map((step, i) => (
                      <li
                        key={step}
                        className="flex gap-2 rounded-[var(--armz-radius-md)] border border-[var(--armz-border)] bg-[rgba(0,0,0,0.25)] px-3 py-2 text-sm"
                      >
                        <span className="font-bold text-[var(--armz-accent)]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[var(--armz-text-secondary)]">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Card className="space-y-2 p-3">
                  <p className="armz-kicker">Your temporary ARMZ</p>
                  <ArmzPortrait
                    presetKey="street_challenger"
                    displayName="Street Challenger"
                    palette={{
                      skinTone: 'a86b4a',
                      primaryCloth: '1a1f2a',
                      accent: '4ecdc4',
                      glove: '2c3344',
                    }}
                    size="md"
                  />
                  <p className="text-xs text-[var(--armz-text-muted)]">
                    One of six Common visual identities — rolled per session.
                  </p>
                </Card>
                <Card className="space-y-2 p-3">
                  <p className="armz-kicker">Easy opponent</p>
                  <AutomatonPortrait size="md" />
                </Card>
              </div>
            </div>
          )}

          {phase === 'unavailable' && (
            <Card className="space-y-3 p-6" data-testid="demo-unavailable">
              <h2 className="text-lg font-semibold">Demo Mode unavailable</h2>
              <p className="text-sm text-[var(--armz-text-secondary)]">
                ARMZ_DEMO_MODE_ENABLED is false. Demo Mode fails closed and will not start.
              </p>
              <Button variant="ghost" onClick={() => router.push('/')}>
                Return Home
              </Button>
            </Card>
          )}

          {phase === 'error' && (
            <Card className="space-y-3 p-6" data-testid="demo-start-error">
              <h2 className="text-lg font-semibold">Could not start Demo Mode</h2>
              <p
                className="text-sm text-[var(--armz-danger)]"
                data-testid="demo-start-error-message"
              >
                {error}
              </p>
              <Button onClick={() => setPhase('landing')}>Try again</Button>
            </Card>
          )}

          {phase === 'reveal' && payload?.armz && (
            <ArmzReveal
              armz={payload.armz}
              reducedMotion={reducedMotion}
              onContinue={() => router.push('/demo/collection')}
            />
          )}

          {phase === 'ready' && payload?.armz && (
            <div className="grid items-stretch gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <ArmzPortrait
                presetKey={payload.armz.presetKey}
                displayName={payload.armz.displayName}
                palette={payload.armz.palette}
                size="lg"
              />
              <Card premium className="flex flex-col justify-center space-y-4 p-6">
                <div className="space-y-2">
                  <Badge variant="success">Session ready</Badge>
                  <h2 className="text-2xl font-semibold">{payload.armz.displayName}</h2>
                  <p className="text-sm text-[var(--armz-text-secondary)]">
                    Your temporary Common is loaded. Inspect the collection or challenge the
                    Practice Automaton.
                  </p>
                </div>
                <Cluster>
                  <Button onClick={() => router.push('/demo/collection')}>Demo Collection</Button>
                  <Button variant="secondary" onClick={() => router.push('/demo/fight')}>
                    Fight Easy
                  </Button>
                </Cluster>
              </Card>
            </div>
          )}
        </Stack>
      </Section>

      <DemoDisclosure
        open={phase === 'disclosure'}
        onCancel={() => setPhase('landing')}
        onConfirm={() => void startDemo()}
      />
    </PageContainer>
  );
}
