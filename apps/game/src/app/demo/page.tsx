'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Cluster,
  PageContainer,
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
          {/* Hero header */}
          <div className="space-y-2">
            <p className="armz-kicker">Demo Mode</p>
            <h1 className="armz-display text-2xl sm:text-3xl">Play Demo</h1>
            <p className="max-w-lg text-sm leading-relaxed text-[var(--armz-text-secondary)]">
              Receive a temporary Level 1 Common ARMZ and clash with the Easy Practice Automaton.
              Battles are simulated on the server. Rewards have no monetary value and cannot be claimed.
            </p>
            <Cluster gap="sm">
              <Badge variant="warning">Demo Mode</Badge>
              <Badge variant="success">No wallet required</Badge>
              <Badge variant="muted">Simulated only</Badge>
            </Cluster>
          </div>

          {(phase === 'landing' || phase === 'disclosure') && (
            <div className="relative overflow-hidden rounded-[var(--armz-radius-xl)] border border-[rgba(212,175,106,0.22)] bg-[linear-gradient(170deg,rgba(20,28,44,0.97),rgba(7,11,18,0.98))] shadow-[var(--armz-shadow-glow)]">
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute inset-0 bg-[radial-gradient(600px_320px_at_50%_20%,rgba(94,200,255,0.07),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(400px_260px_at_80%_80%,rgba(224,122,74,0.06),transparent_55%)]" />
              </div>

              <div className="relative z-10 px-5 py-6 sm:px-7 sm:py-8">
                <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
                  {/* Left: CTA + steps */}
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <h2 className="text-xl font-bold">Free practice. Zero real value.</h2>
                      <p className="text-sm leading-relaxed text-[var(--armz-text-secondary)]">
                        Demo Mode is a polished training slice of Armz Clash {'\u2014'} no blockchain
                        transaction, no real $ARMZ, no claim path.
                      </p>
                    </div>

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

                  {/* Right: Fighter preview */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-[130px] overflow-hidden rounded-[var(--armz-radius-lg)] border border-[rgba(94,200,255,0.2)] bg-[rgba(94,200,255,0.03)] p-2 sm:w-[150px]">
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
                      <p className="mt-1 text-center text-[9px] font-bold uppercase tracking-wider text-[var(--armz-text-muted)]">
                        Your ARMZ
                      </p>
                    </div>
                    <div className="w-[130px] overflow-hidden rounded-[var(--armz-radius-lg)] border border-[rgba(224,122,74,0.2)] bg-[rgba(224,122,74,0.03)] p-2 sm:w-[150px]">
                      <AutomatonPortrait size="md" />
                      <p className="mt-1 text-center text-[9px] font-bold uppercase tracking-wider text-[var(--armz-text-muted)]">
                        Easy Opponent
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase === 'unavailable' && (
            <div className="space-y-3 rounded-[var(--armz-radius-xl)] border border-[var(--armz-border)] bg-[var(--armz-surface)] p-6" data-testid="demo-unavailable">
              <h2 className="text-lg font-semibold">Demo Mode unavailable</h2>
              <p className="text-sm text-[var(--armz-text-secondary)]">
                ARMZ_DEMO_MODE_ENABLED is false. Demo Mode fails closed and will not start.
              </p>
              <Button variant="ghost" onClick={() => router.push('/')}>
                Return Home
              </Button>
            </div>
          )}

          {phase === 'error' && (
            <div className="space-y-3 rounded-[var(--armz-radius-xl)] border border-[var(--armz-border)] bg-[var(--armz-surface)] p-6" data-testid="demo-start-error">
              <h2 className="text-lg font-semibold">Could not start Demo Mode</h2>
              <p
                className="text-sm text-[var(--armz-danger)]"
                data-testid="demo-start-error-message"
              >
                {error}
              </p>
              <Button onClick={() => setPhase('landing')}>Try again</Button>
            </div>
          )}

          {phase === 'reveal' && payload?.armz && (
            <ArmzReveal
              armz={payload.armz}
              reducedMotion={reducedMotion}
              onContinue={() => router.push('/demo/collection')}
            />
          )}

          {phase === 'ready' && payload?.armz && (
            <div className="relative overflow-hidden rounded-[var(--armz-radius-xl)] border border-[rgba(94,200,255,0.2)] bg-[linear-gradient(160deg,rgba(94,200,255,0.05),rgba(7,11,18,0.97))] p-5 shadow-[var(--armz-shadow-cyan)] sm:p-6">
              <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr]">
                <div className="mx-auto w-[160px] overflow-hidden rounded-[var(--armz-radius-lg)] border border-[rgba(94,200,255,0.25)] bg-[rgba(94,200,255,0.04)] p-2">
                  <ArmzPortrait
                    presetKey={payload.armz.presetKey}
                    displayName={payload.armz.displayName}
                    palette={payload.armz.palette}
                    size="lg"
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Badge variant="success">Session ready</Badge>
                    <h2 className="text-2xl font-bold">{payload.armz.displayName}</h2>
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
                </div>
              </div>
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