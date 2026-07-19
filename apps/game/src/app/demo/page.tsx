'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, PageContainer, Section, Stack } from '@armz-clash/ui';
import { demoApi, type DemoPublicPayload } from '../../features/demo/api';
import { DemoDisclosure } from '../../features/demo/components/DemoDisclosure';
import { ArmzReveal } from '../../features/demo/components/ArmzReveal';

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
      <Section className="pt-2">
        <Stack gap="lg">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="warning">Demo Mode</Badge>
              <Badge variant="success">No wallet required</Badge>
              <Badge variant="muted">Simulated only</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Play Demo</h1>
            <p className="max-w-2xl text-[var(--armz-text-secondary)]">
              Receive a temporary Level 1 Common ARMZ and fight the Easy Practice Automaton. Battles
              are simulated on the server. Rewards have no monetary value and cannot be claimed.
            </p>
          </div>

          {phase === 'landing' && (
            <Card className="space-y-4 p-6">
              <p className="text-sm text-[var(--armz-text-secondary)]">
                Demo Mode is free practice for Armz Clash. No blockchain transaction. No real $ARMZ.
              </p>
              <Button
                onClick={() => setPhase('disclosure')}
                loading={busy}
                data-testid="play-demo-button"
              >
                Play Demo
              </Button>
              <p className="text-xs text-[var(--armz-text-muted)]">
                <Link href="/" className="underline">
                  Back to game shell
                </Link>
              </p>
            </Card>
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
            <Card className="space-y-3 p-6">
              <h2 className="text-lg font-semibold">Could not start Demo Mode</h2>
              <p className="text-sm text-[var(--armz-danger)]">{error}</p>
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
            <Card className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Demo session ready</h2>
              <p className="text-sm text-[var(--armz-text-secondary)]">
                Your temporary ARMZ is {payload.armz.displayName}. Continue to collection or fight.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => router.push('/demo/collection')}>Demo Collection</Button>
                <Button variant="ghost" onClick={() => router.push('/demo/fight')}>
                  Fight Easy
                </Button>
              </div>
            </Card>
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
