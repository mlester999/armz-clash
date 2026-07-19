'use client';

import { useEffect, useState } from 'react';
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
import {
  demoApi,
  type DemoBattlePayload,
  type DemoPublicPayload,
} from '../../../features/demo/api';
import { BattleStage } from '../../../features/demo/components/BattleStage';
import { ArmzPortrait, AutomatonPortrait } from '../../../features/demo/art/ArmzPortrait';

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
      <Section className="pt-1">
        <Stack gap="md">
          {!battle && (
            <PageHero
              kicker="Opponent select · Easy"
              title="Demo Fight"
              description="Server-authoritative Easy battle against the Practice Automaton. Your browser only plays the timeline — it never chooses the winner."
              badges={
                <>
                  <Badge variant="warning">Demo Mode</Badge>
                  <Badge variant="enemy">Easy</Badge>
                  <Badge variant="muted">Simulated</Badge>
                  <Badge variant="success">Server-authoritative</Badge>
                </>
              }
            />
          )}

          {!battle && session && (
            <div
              className="grid items-stretch gap-4 lg:grid-cols-[1fr_1fr]"
              data-testid="demo-fight-confirm"
            >
              <Card premium className="space-y-3 p-4">
                <p className="armz-kicker">Your temporary ARMZ</p>
                {session.armz ? (
                  <ArmzPortrait
                    presetKey={session.armz.presetKey}
                    displayName={session.armz.displayName}
                    palette={session.armz.palette}
                    size="lg"
                  />
                ) : (
                  <p className="text-sm text-[var(--armz-text-muted)]">No ARMZ ready.</p>
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {session.armz?.displayName ?? 'Not ready'}
                  </h3>
                  <p className="text-xs text-[var(--armz-text-muted)]">
                    Level 1 · Common · Temporary
                  </p>
                </div>
              </Card>

              <Card premium className="flex flex-col gap-3 p-4">
                <p className="armz-kicker">Selected opponent</p>
                <AutomatonPortrait size="lg" />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">Practice Automaton</h2>
                    <Badge variant="enemy">Easy</Badge>
                  </div>
                  <p className="text-sm text-[var(--armz-text-secondary)]">
                    {session.opponent.tagline}
                  </p>
                  <ul className="space-y-1.5 text-sm text-[var(--armz-text-secondary)]">
                    <li>
                      <span className="text-[var(--armz-text-muted)]">Matchup · </span>
                      {session.opponent.estimatedMatchupLabel}
                    </li>
                    <li>
                      <span className="text-[var(--armz-text-muted)]">Style · </span>
                      Steady mechanical pressure — readable training cadence
                    </li>
                    <li>
                      <span className="text-[var(--armz-text-muted)]">Simulated reward · </span>
                      1.00–2.00 Demo $ARMZ on victory (no monetary value)
                    </li>
                    <li>
                      <span className="text-[var(--armz-text-muted)]">Session · </span>
                      {session.session.battlesRemaining} battles remaining
                      {session.session.replayAvailableInSeconds > 0
                        ? ` · cooldown ${session.session.replayAvailableInSeconds}s`
                        : ' · ready'}
                    </li>
                  </ul>
                </div>

                {!confirmed ? (
                  <Cluster className="mt-auto pt-2">
                    <Button
                      size="lg"
                      onClick={() => setConfirmed(true)}
                      disabled={!session.armz}
                      data-testid="demo-confirm-fight"
                    >
                      Confirm demo fight
                    </Button>
                    <Button variant="ghost" onClick={() => router.push('/demo/collection')}>
                      Back to collection
                    </Button>
                  </Cluster>
                ) : (
                  <Cluster className="mt-auto pt-2">
                    <Button
                      size="lg"
                      loading={busy}
                      onClick={() => void startFight()}
                      data-testid="demo-start-battle"
                    >
                      Start simulated battle
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmed(false)}>
                      Cancel
                    </Button>
                  </Cluster>
                )}
                {error && <p className="text-sm text-[var(--armz-danger)]">{error}</p>}
              </Card>
            </div>
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
            <Card className="p-5">
              <p className="text-sm text-[var(--armz-text-muted)]">Loading demo session…</p>
            </Card>
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
