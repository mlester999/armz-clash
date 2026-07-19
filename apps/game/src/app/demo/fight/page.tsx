'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, PageContainer, Section, Stack } from '@armz-clash/ui';
import {
  demoApi,
  type DemoBattlePayload,
  type DemoPublicPayload,
} from '../../../features/demo/api';
import { BattleStage } from '../../../features/demo/components/BattleStage';

export default function DemoFightPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoPublicPayload | null>(null);
  const [battle, setBattle] = useState<DemoBattlePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        let s: DemoPublicPayload;
        try {
          s = await demoApi.getSession();
        } catch {
          s = await demoApi.startSession();
        }
        setSession(s);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  const startFight = async () => {
    setBusy(true);
    setError(null);
    try {
      const key =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `demo-${Date.now()}`;
      const result = await demoApi.startBattle({
        idempotencyKey: key,
        reducedMotion,
      });
      setBattle(result);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              session: result.session,
              armz: result.armz,
            }
          : prev,
      );
    } catch (e) {
      const err = e as { message?: string; data?: { retryAfterSeconds?: number } };
      setError(
        err.message ||
          (err.data?.retryAfterSeconds
            ? `Cooldown ${err.data.retryAfterSeconds}s`
            : 'Could not start battle'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer width="2xl">
      <Section className="pt-2">
        <Stack gap="lg">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="warning">Demo Mode</Badge>
              <Badge variant="info">Easy opponent</Badge>
              <Badge variant="muted">Simulated</Badge>
            </div>
            <h1 className="text-3xl font-semibold">Demo Fight</h1>
            <p className="text-sm text-[var(--armz-text-secondary)]">
              Server-authoritative Easy battle against the Practice Automaton. Your browser only
              plays the timeline — it never chooses the winner.
            </p>
          </div>

          {!battle && session && (
            <Card className="space-y-4 p-6" data-testid="demo-fight-confirm">
              <h2 className="text-xl font-semibold">Practice Automaton</h2>
              <p className="text-sm text-[var(--armz-text-secondary)]">
                {session.opponent.tagline}
              </p>
              <p className="text-xs text-[var(--armz-text-muted)]">
                {session.opponent.estimatedMatchupLabel}
              </p>
              <p className="text-sm">
                Your temporary ARMZ: <strong>{session.armz?.displayName ?? 'Not ready'}</strong>
              </p>
              <p className="text-xs text-[var(--armz-text-muted)]">
                Battles remaining {session.session.battlesRemaining} · Replay cooldown{' '}
                {session.session.replayAvailableInSeconds > 0
                  ? `${session.session.replayAvailableInSeconds}s`
                  : 'ready'}
              </p>
              {!confirmed ? (
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => setConfirmed(true)}
                    disabled={!session.armz}
                    data-testid="demo-confirm-fight"
                  >
                    Confirm demo fight
                  </Button>
                  <Button variant="ghost" onClick={() => router.push('/demo/collection')}>
                    Back to collection
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Button
                    loading={busy}
                    onClick={() => void startFight()}
                    data-testid="demo-start-battle"
                  >
                    Start simulated battle
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmed(false)}>
                    Cancel
                  </Button>
                </div>
              )}
              {error && <p className="text-sm text-[var(--armz-danger)]">{error}</p>}
            </Card>
          )}

          {battle && (
            <BattleStage
              battle={battle}
              reducedMotion={reducedMotion}
              onReplay={() => {
                setBattle(null);
                setConfirmed(true);
                void startFight();
              }}
              onCollection={() => router.push('/demo/collection')}
              onHome={() => router.push('/')}
            />
          )}

          {!session && !error && (
            <p className="text-sm text-[var(--armz-text-muted)]">Loading demo session…</p>
          )}
          {error && !session && (
            <Card className="space-y-3 p-6">
              <p className="text-sm text-[var(--armz-danger)]">{error}</p>
              <Button onClick={() => router.push('/demo')}>Open Demo Mode</Button>
            </Card>
          )}
        </Stack>
      </Section>
    </PageContainer>
  );
}
