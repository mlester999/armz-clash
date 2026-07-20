'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, Cluster, StrengthBar } from '@armz-clash/ui';
import type { DemoBattlePayload } from '../api';
import { BattleRenderer } from '../renderer/BattleRenderer';

function formatCooldown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const EVENT_LABELS: Record<string, string> = {
  intro: 'Arena intro',
  lock: 'Locking grip',
  grip: 'Grip locked',
  first_pressure: 'First pressure',
  pressure: 'Pressure building',
  momentum: 'Momentum swing',
  strain: 'Strain phase',
  critical: 'Critical force',
  recovery: 'Second wind recovery',
  counter: 'Counter',
  push: 'Pushing',
  push_heavy: 'Heavy push',
  decisive: 'Decisive push',
  winning_slam: 'Victory slam',
  defeated: 'Pinned',
  victory: 'Victory',
  defeat: 'Defeat',
};

export function BattleStage({
  battle,
  reducedMotion,
  onReplay,
  onCollection,
  onHome,
}: {
  battle: DemoBattlePayload;
  reducedMotion: boolean;
  onReplay: () => void;
  onCollection: () => void;
  onHome: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<BattleRenderer | null>(null);
  const [playerStr, setPlayerStr] = useState(100);
  const [opponentStr, setOpponentStr] = useState(100);
  const [done, setDone] = useState(false);
  const [muted, setMuted] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [eventLabel, setEventLabel] = useState('Preparing arena…');
  const [cooldown, setCooldown] = useState(battle.session.replayAvailableInSeconds);

  useEffect(() => {
    if (!hostRef.current) return;
    const palette = battle.armz.palette ?? {
      skinTone: 'c48a6a',
      primaryCloth: '3d2b22',
      accent: 'd4af6a',
      glove: '2a221c',
    };
    const renderer = new BattleRenderer({
      host: hostRef.current,
      timeline: battle.timeline,
      playerPalette: palette,
      opponentPalette: battle.opponent.palette,
      playerName: battle.armz.displayName,
      opponentName: battle.opponent.displayName,
      playerPresetKey: battle.armz.presetKey,
      reducedMotion,
      muted,
      onComplete: () => setDone(true),
      onStrength: (p, o) => {
        setPlayerStr(p);
        setOpponentStr(o);
      },
      onEvent: (ev) => {
        const key = ev.animationCue || ev.type;
        setEventLabel(EVENT_LABELS[key] ?? key.replace(/_/g, ' '));
      },
    });
    rendererRef.current = renderer;
    void renderer.mount();
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle.battleId]);

  useEffect(() => {
    rendererRef.current?.setMuted(muted || !musicOn);
  }, [muted, musicOn]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const skipToResult = () => {
    setDone(true);
    setPlayerStr(battle.playerFinalStrength);
    setOpponentStr(battle.opponentFinalStrength);
    rendererRef.current?.pause();
  };

  return (
    <div className="space-y-3" data-testid="demo-battle-stage">
      <Cluster gap="sm">
        <Badge variant="warning">Demo Mode</Badge>
        <Badge variant="muted">Simulated battle</Badge>
        <Badge variant="enemy">Easy</Badge>
        <Badge variant="success">Server-authoritative</Badge>
      </Cluster>

      <div className="grid gap-3 sm:grid-cols-2">
        <StrengthBar label={battle.armz.displayName} value={playerStr} tone="player" />
        <StrengthBar label={battle.opponent.displayName} value={opponentStr} tone="opponent" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className="rounded-full border border-[var(--armz-border)] bg-[rgba(0,0,0,0.35)] px-3 py-1 text-sm font-semibold capitalize tracking-wide text-[var(--armz-text-secondary)]"
          aria-live="polite"
        >
          {eventLabel}
        </p>
        <Cluster gap="sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMuted((m) => !m)}
            aria-pressed={!muted}
          >
            SFX {muted ? 'Off' : 'On'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMusicOn((m) => !m)}
            aria-pressed={musicOn}
          >
            Music {musicOn ? 'On' : 'Off'}
          </Button>
          {!done && (
            <Button variant="secondary" size="sm" onClick={skipToResult}>
              Skip to result
            </Button>
          )}
        </Cluster>
      </div>

      <div
        ref={hostRef}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--armz-radius-xl)] border border-[rgba(212,175,106,0.28)] bg-[#070b12] shadow-[var(--armz-shadow-glow)]"
        data-testid="demo-battle-canvas-host"
      />

      {done && (
        <Card
          className={
            battle.outcome === 'victory'
              ? 'armz-result-victory space-y-4 p-5 sm:p-6'
              : 'armz-result-defeat space-y-4 p-5 sm:p-6'
          }
          data-testid="demo-battle-result"
        >
          {battle.outcome === 'victory' ? (
            <>
              <div className="space-y-2">
                <p className="armz-kicker">Simulated result</p>
                <h2 className="armz-display text-3xl text-[var(--armz-cyan)] sm:text-4xl">
                  Victory
                </h2>
                <p className="text-sm text-[var(--armz-text-secondary)]">
                  {battle.armz.displayName} pinned the Practice Automaton in a simulated Easy clash.
                </p>
              </div>
              {battle.reward && (
                <div className="rounded-[var(--armz-radius-md)] border border-[rgba(94,200,255,0.35)] bg-[rgba(94,200,255,0.08)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--armz-cyan)]">
                    Simulated reward
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[var(--armz-accent)]">
                    {battle.reward.display}
                  </p>
                  <ul className="mt-2 grid gap-1 text-xs text-[var(--armz-text-muted)] sm:grid-cols-2">
                    <li>Simulated only</li>
                    <li>No monetary value</li>
                    <li>Not claimable</li>
                    <li>Not withdrawable</li>
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="armz-kicker">Simulated result</p>
                <h2 className="armz-display text-3xl text-[var(--armz-danger)] sm:text-4xl">
                  Defeat
                </h2>
                <p className="text-sm text-[var(--armz-text-secondary)]">
                  The Practice Automaton held the line. No simulated reward this round — train again
                  after the cooldown.
                </p>
              </div>
            </>
          )}
          <p className="text-xs text-[var(--armz-text-muted)]">
            Battle ID {battle.battleId.slice(0, 8)}… · duration{' '}
            {(battle.durationMs / 1000).toFixed(1)}s
          </p>
          <Cluster>
            <Button
              onClick={onReplay}
              disabled={cooldown > 0 || battle.session.battlesRemaining <= 0}
              data-testid="demo-replay"
            >
              {cooldown > 0
                ? `Replay in ${formatCooldown(cooldown)}`
                : battle.session.battlesRemaining <= 0
                  ? 'Battle limit reached'
                  : 'Replay Easy fight'}
            </Button>
            <Button variant="secondary" onClick={onCollection}>
              Demo Collection
            </Button>
            <Button variant="ghost" onClick={onHome}>
              Return Home
            </Button>
          </Cluster>
        </Card>
      )}
    </div>
  );
}
