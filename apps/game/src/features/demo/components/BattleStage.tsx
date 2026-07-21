'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button, Cluster, ControlBar } from '@armz-clash/ui';
import type { DemoBattlePayload } from '../api';
import { BattleRenderer } from '../renderer/BattleRenderer';
import { ArmzPortrait, AutomatonPortrait } from '../art/ArmzPortrait';

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
  const [finalSynced, setFinalSynced] = useState(false);
  const [muted, setMuted] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [eventLabel, setEventLabel] = useState('Preparing arena\u2026');
  const [cooldown, setCooldown] = useState(battle.session.replayAvailableInSeconds);
  const [resultAnnounced, setResultAnnounced] = useState(false);

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
      opponentKey: battle.opponent.opponentKey ?? 'practice_automaton',
      reducedMotion,
      muted,
      sfxEnabled: !muted,
      musicEnabled: musicOn,
      onComplete: () => {
        setPlayerStr(battle.playerFinalStrength);
        setOpponentStr(battle.opponentFinalStrength);
        setFinalSynced(true);
        setDone(true);
      },
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
    rendererRef.current?.setMuted(muted);
    rendererRef.current?.setSfxEnabled(!muted);
  }, [muted]);

  useEffect(() => {
    rendererRef.current?.setMusicEnabled(musicOn);
  }, [musicOn]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const skipToResult = useCallback(() => {
    rendererRef.current?.pause();
    setPlayerStr(battle.playerFinalStrength);
    setOpponentStr(battle.opponentFinalStrength);
    setFinalSynced(true);
    setDone(true);
  }, [battle.playerFinalStrength, battle.opponentFinalStrength]);

  const isVictory = battle.outcome === 'victory';

  // Result integrity: victory requires opponentFinalControl===0 && playerFinalControl>0
  // Defeat requires playerFinalControl===0 && opponentFinalControl>0
  const integrityValid = isVictory
    ? battle.opponentFinalStrength === 0 && battle.playerFinalStrength > 0
    : battle.playerFinalStrength === 0 && battle.opponentFinalStrength > 0;
  const showResult = done && finalSynced && integrityValid;

  // Screen-reader announcement: once when finalSynced completes.
  useEffect(() => {
    if (finalSynced && !resultAnnounced) {
      setResultAnnounced(true);
    }
  }, [finalSynced, resultAnnounced]);

  return (
    <div className="space-y-3" data-testid="demo-battle-stage">
      {/* Screen-reader result announcement (once) */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only" role="status">
        {resultAnnounced && showResult
          ? isVictory
            ? `Victory! ${battle.armz.displayName} defeated the ${battle.opponent.displayName}. Final Control: ${battle.playerFinalStrength} to ${battle.opponentFinalStrength}.`
            : `Defeat. The ${battle.opponent.displayName} won. Final Control: ${battle.playerFinalStrength} to ${battle.opponentFinalStrength}.`
          : ''}
      </div>

      {/* Fighter HUD Headers */}
      <div className="grid gap-2 sm:grid-cols-2">
        {/* Player panel */}
        <div className="flex items-center gap-3 rounded-[var(--armz-radius-lg)] border border-[rgba(94,200,255,0.25)] bg-[linear-gradient(135deg,rgba(94,200,255,0.06),rgba(7,11,18,0.9))] p-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--armz-radius-md)] border border-[rgba(94,200,255,0.3)]">
            <ArmzPortrait
              presetKey={battle.armz.presetKey}
              displayName={battle.armz.displayName}
              palette={battle.armz.palette}
              size="sm"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-bold">{battle.armz.displayName}</h3>
              <span className="shrink-0 rounded-full border border-[rgba(94,200,255,0.3)] bg-[rgba(94,200,255,0.08)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--armz-cyan)]">
                Common
              </span>
            </div>
            <ControlBar label="" value={playerStr} tone="player" />
          </div>
          <span className="shrink-0 text-lg font-bold tabular-nums text-[var(--armz-cyan)]">
            {playerStr}
          </span>
        </div>

        {/* Opponent panel */}
        <div className="flex items-center gap-3 rounded-[var(--armz-radius-lg)] border border-[rgba(224,122,74,0.25)] bg-[linear-gradient(135deg,rgba(224,122,74,0.06),rgba(7,11,18,0.9))] p-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--armz-radius-md)] border border-[rgba(224,122,74,0.3)]">
            <AutomatonPortrait size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-bold">{battle.opponent.displayName}</h3>
              <span className="shrink-0 rounded-full border border-[rgba(224,122,74,0.3)] bg-[rgba(224,122,74,0.08)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--armz-enemy)]">
                Easy
              </span>
            </div>
            <ControlBar label="" value={opponentStr} tone="opponent" />
          </div>
          <span className="shrink-0 text-lg font-bold tabular-nums text-[var(--armz-enemy)]">
            {opponentStr}
          </span>
        </div>
      </div>

      {/* Event indicator + controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className="rounded-full border border-[var(--armz-border)] bg-[rgba(0,0,0,0.4)] px-3.5 py-1 text-sm font-semibold capitalize tracking-wide text-[var(--armz-text-secondary)]"
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
            aria-label={`Sound effects ${muted ? 'off' : 'on'}`}
          >
            SFX {muted ? 'Off' : 'On'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMusicOn((m) => !m)}
            aria-pressed={musicOn}
            aria-label={`Music ${musicOn ? 'on' : 'off'}`}
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

      {/* Battle Arena + In-Viewport Result Overlay */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--armz-radius-xl)] border border-[rgba(212,175,106,0.28)] bg-[#070b12] shadow-[var(--armz-shadow-glow)]"
        data-testid="demo-battle-canvas-host"
      >
        <div ref={hostRef} className="absolute inset-0" />

        {/* Cinematic Result Overlay: fills the arena viewport, no scrolling needed */}
        {showResult && (
          <div
            className="absolute inset-0 z-20 flex flex-col overflow-hidden p-4 sm:p-6 bg-[rgba(7,11,18,0.92)] backdrop-blur-sm"
            data-testid="demo-battle-result"
            role="dialog"
            aria-modal="true"
            aria-label={isVictory ? 'Victory result' : 'Defeat result'}
          >
            {/* Cinematic background accents */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              {isVictory ? (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(600px_360px_at_50%_0%,rgba(94,200,255,0.18),transparent_60%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(400px_200px_at_50%_100%,rgba(212,175,106,0.1),transparent_60%)]" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(600px_360px_at_50%_0%,rgba(240,113,120,0.14),transparent_60%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(400px_200px_at_50%_100%,rgba(100,100,120,0.08),transparent_60%)]" />
                </>
              )}
            </div>

            <div className="relative z-10 m-auto flex w-full max-w-md flex-col items-center text-center">
              <p className="armz-kicker">Simulated Result</p>

              {/* Animated title */}
              <h2
                className={`armz-display text-4xl sm:text-5xl animate-[fadeInUp_0.4s_ease-out] ${isVictory ? 'text-[var(--armz-cyan)]' : 'text-[var(--armz-danger)]'}`}
              >
                {isVictory ? 'VICTORY' : 'DEFEAT'}
              </h2>

              {/* Fighter result art references */}
              <div className="mt-3 flex items-center justify-center gap-4">
                <div
                  className={`flex flex-col items-center gap-1 ${isVictory ? '' : 'opacity-60'}`}
                >
                  <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-[rgba(94,200,255,0.4)]">
                    <ArmzPortrait
                      presetKey={battle.armz.presetKey}
                      displayName={battle.armz.displayName}
                      palette={battle.armz.palette}
                      size="sm"
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--armz-cyan)]">
                    {isVictory ? 'Winner' : ''}
                  </span>
                </div>
                <span className="text-lg font-bold text-[var(--armz-text-muted)]">vs</span>
                <div
                  className={`flex flex-col items-center gap-1 ${!isVictory ? '' : 'opacity-60'}`}
                >
                  <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-[rgba(224,122,74,0.4)]">
                    <AutomatonPortrait size="sm" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--armz-enemy)]">
                    {!isVictory ? 'Winner' : ''}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm text-[var(--armz-text-secondary)]">
                {isVictory
                  ? `${battle.armz.displayName} pinned the Practice Automaton in a simulated Easy clash.`
                  : 'The Practice Automaton held the line. Train again after the cooldown.'}
              </p>

              {/* Final Control snapshot */}
              <div className="mt-3 flex w-full justify-center gap-3">
                <div className="rounded-[var(--armz-radius-md)] border border-[rgba(94,200,255,0.25)] bg-[rgba(94,200,255,0.06)] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--armz-text-muted)]">
                    Your Control
                  </p>
                  <p className="text-lg font-bold tabular-nums text-[var(--armz-cyan)]">
                    {battle.playerFinalStrength}
                  </p>
                </div>
                <div className="rounded-[var(--armz-radius-md)] border border-[rgba(224,122,74,0.25)] bg-[rgba(224,122,74,0.06)] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--armz-text-muted)]">
                    Opponent Control
                  </p>
                  <p className="text-lg font-bold tabular-nums text-[var(--armz-enemy)]">
                    {battle.opponentFinalStrength}
                  </p>
                </div>
              </div>

              {/* Reward card (victory only) */}
              {isVictory && battle.reward && (
                <div className="mt-3 w-full rounded-[var(--armz-radius-md)] border border-[rgba(212,175,106,0.3)] bg-[rgba(212,175,106,0.06)] p-3 text-left">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--armz-accent)]">
                    Simulated Reward
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

              {/* Defeat: respectful training feedback, no fake reward */}
              {!isVictory && (
                <div className="mt-3 w-full rounded-[var(--armz-radius-md)] border border-[rgba(100,120,140,0.25)] bg-[rgba(100,120,140,0.06)] p-3 text-left">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--armz-text-secondary)]">
                    Training Feedback
                  </p>
                  <p className="mt-1 text-sm text-[var(--armz-text-muted)]">
                    The Practice Automaton is designed to test your grip strength. Return after the
                    cooldown to try again.
                  </p>
                </div>
              )}

              <p className="mt-2 text-xs text-[var(--armz-text-muted)]">
                Battle ID {battle.battleId.slice(0, 8)}
                {'\u2026'} {'\u00b7'} duration {(battle.durationMs / 1000).toFixed(1)}s {'\u00b7'}{' '}
                server-authoritative
              </p>

              {/* Action buttons - primary action immediately visible */}
              <Cluster className="mt-3 justify-center">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
