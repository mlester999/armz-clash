'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Cluster, PageContainer, Section, Stack } from '@armz-clash/ui';
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
          {/* ── Cinematic Versus Screen ── */}
          {!battle && (
            <div className="relative overflow-hidden rounded-[var(--armz-radius-xl)] border border-[rgba(212,175,106,0.22)] bg-[linear-gradient(170deg,rgba(20,28,44,0.97),rgba(7,11,18,0.98))] shadow-[var(--armz-shadow-glow)]">
              {/* Arena atmosphere */}
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute inset-0 bg-[radial-gradient(600px_320px_at_50%_20%,rgba(94,200,255,0.07),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(400px_260px_at_20%_80%,rgba(212,175,106,0.06),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(400px_260px_at_80%_80%,rgba(224,122,74,0.06),transparent_55%)]" />
              </div>

              <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="armz-kicker">Opponent Select · Easy</p>
                    <h1 className="armz-display mt-1 text-2xl sm:text-3xl">Demo Fight</h1>
                  </div>
                  <Cluster gap="sm">
                    <Badge variant="warning">Demo Mode</Badge>
                    <Badge variant="enemy">Easy</Badge>
                    <Badge variant="success">Server-authoritative</Badge>
                  </Cluster>
                </div>

                {session && (
                  <div data-testid="demo-fight-confirm">
                    {/* Versus composition */}
                    <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
                      {/* Player side */}
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="relative w-full max-w-[220px] overflow-hidden rounded-[var(--armz-radius-lg)] border border-[rgba(94,200,255,0.25)] bg-[rgba(94,200,255,0.04)] p-3 shadow-[var(--armz-shadow-cyan)]">
                          {session.armz ? (
                            <ArmzPortrait
                              presetKey={session.armz.presetKey}
                              displayName={session.armz.displayName}
                              palette={session.armz.palette}
                              size="lg"
                            />
                          ) : (
                            <div className="flex h-40 items-center justify-center text-sm text-[var(--armz-text-muted)]">
                              No ARMZ ready
                            </div>
                          )}
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">
                            {session.armz?.displayName ?? 'Not ready'}
                          </h2>
                          <p className="text-xs text-[var(--armz-text-muted)]">
                            Level 1 · Common · Temporary
                          </p>
                        </div>
                        {session.armz && (
                          <div className="flex flex-wrap justify-center gap-1.5">
                            <span className="rounded-full border border-[rgba(94,200,255,0.3)] bg-[rgba(94,200,255,0.08)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--armz-cyan)]">
                              PWR {session.armz.power}
                            </span>
                            <span className="rounded-full border border-[rgba(94,200,255,0.3)] bg-[rgba(94,200,255,0.08)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--armz-cyan)]">
                              GRP {session.armz.grip}
                            </span>
                            <span className="rounded-full border border-[rgba(94,200,255,0.3)] bg-[rgba(94,200,255,0.08)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--armz-cyan)]">
                              SPD {session.armz.speed}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* VS emblem */}
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[rgba(212,175,106,0.5)] bg-[radial-gradient(circle,rgba(212,175,106,0.15),transparent_70%)] shadow-[0_0_24px_rgba(212,175,106,0.2)]">
                          <span className="armz-display text-xl text-[var(--armz-accent)]">VS</span>
                        </div>
                        <Badge variant="enemy">Easy</Badge>
                        <p className="max-w-[120px] text-center text-[10px] leading-tight text-[var(--armz-text-muted)]">
                          {session.opponent.estimatedMatchupLabel}
                        </p>
                      </div>

                      {/* Opponent side */}
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="relative w-full max-w-[220px] overflow-hidden rounded-[var(--armz-radius-lg)] border border-[rgba(224,122,74,0.3)] bg-[rgba(224,122,74,0.04)] p-3 shadow-[0_0_0_1px_rgba(224,122,74,0.2),0_12px_40px_rgba(0,0,0,0.45)]">
                          <AutomatonPortrait size="lg" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">Practice Automaton</h2>
                          <p className="text-xs text-[var(--armz-text-muted)]">
                            Training machine · Steady pressure
                          </p>
                        </div>
                        <p className="max-w-[200px] text-xs text-[var(--armz-text-secondary)]">
                          {session.opponent.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Matchup details */}
                    <div className="mx-auto mt-5 grid max-w-lg gap-2 sm:grid-cols-3">
                      <div className="rounded-[var(--armz-radius-md)] border border-[var(--armz-border)] bg-[rgba(0,0,0,0.3)] px-3 py-2 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--armz-text-muted)]">
                          Simulated Reward
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[var(--armz-accent)]">
                          1.00–2.00
                        </p>
                        <p className="text-[10px] text-[var(--armz-text-muted)]">
                          Demo $ARMZ · no value
                        </p>
                      </div>
                      <div className="rounded-[var(--armz-radius-md)] border border-[var(--armz-border)] bg-[rgba(0,0,0,0.3)] px-3 py-2 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--armz-text-muted)]">
                          Battles Left
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[var(--armz-text)]">
                          {session.session.battlesRemaining}
                        </p>
                        <p className="text-[10px] text-[var(--armz-text-muted)]">this session</p>
                      </div>
                      <div className="rounded-[var(--armz-radius-md)] border border-[var(--armz-border)] bg-[rgba(0,0,0,0.3)] px-3 py-2 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--armz-text-muted)]">
                          Status
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[var(--armz-success)]">
                          {session.session.replayAvailableInSeconds > 0
                            ? `Cooldown ${session.session.replayAvailableInSeconds}s`
                            : 'Ready'}
                        </p>
                        <p className="text-[10px] text-[var(--armz-text-muted)]">
                          server-authoritative
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 flex flex-col items-center gap-3">
                      {!confirmed ? (
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <Button
                            size="lg"
                            onClick={() => setConfirmed(true)}
                            disabled={!session.armz}
                            data-testid="demo-confirm-fight"
                          >
                            Confirm Battle
                          </Button>
                          <Button variant="ghost" onClick={() => router.push('/demo/collection')}>
                            Back to Collection
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <Button
                            size="lg"
                            loading={busy}
                            onClick={() => void startFight()}
                            data-testid="demo-start-battle"
                          >
                            Start Simulated Battle
                          </Button>
                          <Button variant="ghost" onClick={() => setConfirmed(false)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                      {error && <p className="text-sm text-[var(--armz-danger)]">{error}</p>}
                      <p className="text-[10px] text-[var(--armz-text-muted)]">
                        Server rolls the outcome · your browser only plays the timeline · no real
                        value
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
            <div className="flex items-center justify-center rounded-[var(--armz-radius-xl)] border border-[var(--armz-border)] bg-[rgba(0,0,0,0.3)] p-8">
              <p className="text-sm text-[var(--armz-text-muted)]">Preparing arena…</p>
            </div>
          )}
          {error && !session && (
            <div className="space-y-3 rounded-[var(--armz-radius-xl)] border border-[var(--armz-border)] bg-[rgba(0,0,0,0.3)] p-6">
              <p className="text-sm text-[var(--armz-danger)]">{error}</p>
              <Button onClick={() => router.push('/demo')}>Open Demo Mode</Button>
            </div>
          )}
        </Stack>
      </Section>
    </PageContainer>
  );
}
