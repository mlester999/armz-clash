'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card } from '@armz-clash/ui';
import type { DemoBattlePayload } from '../api';
import { BattleRenderer } from '../renderer/BattleRenderer';

function formatCooldown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
  const [eventLabel, setEventLabel] = useState('Preparing…');
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
      reducedMotion,
      muted,
      onComplete: () => setDone(true),
      onStrength: (p, o) => {
        setPlayerStr(p);
        setOpponentStr(o);
      },
      onEvent: (ev) => setEventLabel(ev.type.replace(/_/g, ' ')),
    });
    rendererRef.current = renderer;
    void renderer.mount();
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
    // Mount once per battle id
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
    // Result is already server-finalized — skip only after battle payload exists
    setDone(true);
    setPlayerStr(battle.playerFinalStrength);
    setOpponentStr(battle.opponentFinalStrength);
    rendererRef.current?.pause();
  };

  return (
    <div className="space-y-4" data-testid="demo-battle-stage">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">Demo Mode</Badge>
        <Badge variant="muted">Simulated battle</Badge>
        <Badge variant="info">Easy</Badge>
        <Badge variant="success">Server-authoritative</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StrengthBar label={battle.armz.displayName} value={playerStr} tone="player" />
        <StrengthBar label={battle.opponent.displayName} value={opponentStr} tone="opponent" />
      </div>

      <p className="text-sm capitalize text-[var(--armz-text-secondary)]" aria-live="polite">
        {eventLabel}
      </p>

      <div
        ref={hostRef}
        className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--armz-radius-lg)] border border-[var(--armz-border)] bg-[#0b0e14]"
        data-testid="demo-battle-canvas-host"
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => setMuted((m) => !m)} aria-pressed={!muted}>
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
          <Button variant="ghost" size="sm" onClick={skipToResult}>
            Skip to result
          </Button>
        )}
      </div>

      {done && (
        <Card className="space-y-4 p-5" data-testid="demo-battle-result">
          {battle.outcome === 'victory' ? (
            <>
              <h2 className="text-2xl font-semibold text-[var(--armz-cyan)]">Victory</h2>
              <p className="text-sm text-[var(--armz-text-secondary)]">
                {battle.armz.displayName} pinned the Practice Automaton in a simulated Easy clash.
              </p>
              {battle.reward && (
                <div className="rounded-md border border-[var(--armz-border)] bg-[rgba(78,205,196,0.08)] p-4">
                  <p className="font-semibold">{battle.reward.display}</p>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--armz-text-muted)]">
                    <li>Simulated</li>
                    <li>No monetary value</li>
                    <li>Not claimable</li>
                    <li>Not withdrawable</li>
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold">Defeat</h2>
              <p className="text-sm text-[var(--armz-text-secondary)]">
                The Practice Automaton held the line. No simulated reward this round — try again
                after the cooldown.
              </p>
            </>
          )}
          <p className="text-xs text-[var(--armz-text-muted)]">
            Battle ID {battle.battleId.slice(0, 8)}… · duration{' '}
            {(battle.durationMs / 1000).toFixed(1)}s
          </p>
          <div className="flex flex-wrap gap-3">
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
            <Button variant="ghost" onClick={onCollection}>
              Demo Collection
            </Button>
            <Button variant="ghost" onClick={onHome}>
              Return Home
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function StrengthBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'player' | 'opponent';
}) {
  const color = tone === 'player' ? 'var(--armz-cyan)' : 'var(--armz-accent)';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="tabular-nums" aria-live="polite">
          Strength {value}/100
        </span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} strength`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-200"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}
