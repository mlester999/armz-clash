'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ControlBar, IconButton } from '@armz-clash/ui';
import type { DemoBattlePayload } from '../api';
import { BattleRenderer } from '../renderer/BattleRenderer';
import { AutomatonArt, PremiumArt, RookieArt } from '../art/PremiumArt';
import { GameIcon } from '../../../components/game-icons';

function formatCooldown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

const EVENT_LABELS: Record<string, { title: string; cue: string }> = {
  idle: { title: 'Contenders ready', cue: 'Hold the center' },
  approach: { title: 'Hands approaching', cue: 'Grip alignment' },
  grip: { title: 'Grip locked', cue: 'Pressure live' },
  strain_light: { title: 'Testing pressure', cue: 'Control shifting' },
  strain_heavy: { title: 'Maximum tension', cue: 'Hold the line' },
  push_light: { title: 'Forward pressure', cue: 'Momentum building' },
  push_heavy: { title: 'Heavy drive', cue: 'Table reacting' },
  counter: { title: 'Counter!', cue: 'Momentum reversed' },
  critical: { title: 'Critical surge!', cue: 'Decisive pressure' },
  recovery: { title: 'Recovery', cue: 'Form restored' },
  fatigue: { title: 'Fatigue setting in', cue: 'Grip discipline' },
  winning_slam: { title: 'Final slam!', cue: 'Pin confirmed' },
  defeated: { title: 'Final slam!', cue: 'Pin confirmed' },
};

export function BattleStage({
  battle,
  reducedMotion,
  initialResult = false,
  onReducedMotionChange,
  onResultReady,
  onReplay,
  onCollection,
  onHome,
}: {
  battle: DemoBattlePayload;
  reducedMotion: boolean;
  initialResult?: boolean;
  onReducedMotionChange: (next: boolean) => void;
  onResultReady: () => void;
  onReplay: () => void;
  onCollection: () => void;
  onHome: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const resultTitleRef = useRef<HTMLHeadingElement>(null);
  const rendererRef = useRef<BattleRenderer | null>(null);
  const [playerControl, setPlayerControl] = useState(
    initialResult ? battle.playerFinalStrength : 100,
  );
  const [opponentControl, setOpponentControl] = useState(
    initialResult ? battle.opponentFinalStrength : 100,
  );
  const [done, setDone] = useState(initialResult);
  const [finalSynced, setFinalSynced] = useState(initialResult);
  const [muted, setMuted] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [event, setEvent] = useState(EVENT_LABELS.idle!);
  const [cooldown, setCooldown] = useState(battle.session.replayAvailableInSeconds);
  const [resultAnnounced, setResultAnnounced] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [battle.battleId]);

  useEffect(() => {
    const storedMuted = window.localStorage.getItem('armz-clash:sfx-muted');
    const storedMusic = window.localStorage.getItem('armz-clash:music-on');
    if (storedMuted !== null) setMuted(storedMuted === 'true');
    if (storedMusic !== null) setMusicOn(storedMusic === 'true');
  }, []);

  useEffect(() => {
    if (initialResult || !hostRef.current) return;
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
        setPlayerControl(battle.playerFinalStrength);
        setOpponentControl(battle.opponentFinalStrength);
        setFinalSynced(true);
        setDone(true);
        onResultReady();
      },
      onStrength: (player, opponent) => {
        setPlayerControl(player);
        setOpponentControl(opponent);
      },
      onEvent: (timelineEvent) => {
        const key = timelineEvent.animationCue || timelineEvent.type;
        setEvent(
          EVENT_LABELS[key] ?? {
            title: key.replaceAll('_', ' '),
            cue: timelineEvent.side ? `${timelineEvent.side} momentum` : 'Control shifting',
          },
        );
      },
    });
    rendererRef.current = renderer;
    void renderer.mount();
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
    // Battle identity intentionally owns the renderer lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle.battleId, initialResult]);

  useEffect(() => {
    rendererRef.current?.setMuted(muted);
    rendererRef.current?.setSfxEnabled(!muted);
  }, [muted]);

  useEffect(() => {
    rendererRef.current?.setMusicEnabled(musicOn);
  }, [musicOn]);

  useEffect(() => {
    rendererRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const isVictory = battle.outcome === 'victory';
  const integrityValid = isVictory
    ? battle.opponentFinalStrength === 0 && battle.playerFinalStrength > 0
    : battle.playerFinalStrength === 0 && battle.opponentFinalStrength > 0;
  const showResult = done && finalSynced && integrityValid;

  useEffect(() => {
    if (!showResult) return;
    if (!resultAnnounced) setResultAnnounced(true);
    window.requestAnimationFrame(() => resultTitleRef.current?.focus({ preventScroll: true }));
  }, [showResult, resultAnnounced]);

  const skipToResult = useCallback(() => {
    rendererRef.current?.pause();
    setPlayerControl(battle.playerFinalStrength);
    setOpponentControl(battle.opponentFinalStrength);
    setFinalSynced(true);
    setDone(true);
    onResultReady();
  }, [battle.opponentFinalStrength, battle.playerFinalStrength, onResultReady]);

  const toggleMuted = () => {
    setMuted((current) => {
      const next = !current;
      window.localStorage.setItem('armz-clash:sfx-muted', String(next));
      return next;
    });
  };

  const toggleMusic = () => {
    setMusicOn((current) => {
      const next = !current;
      window.localStorage.setItem('armz-clash:music-on', String(next));
      return next;
    });
  };

  return (
    <section className="phase34-battle-stage" data-testid="demo-battle-stage">
      <div aria-live="assertive" aria-atomic="true" className="sr-only" role="status">
        {resultAnnounced && showResult
          ? isVictory
            ? `Victory! ${battle.armz.displayName} defeated the ${battle.opponent.displayName}. Final Control: ${battle.playerFinalStrength} to ${battle.opponentFinalStrength}.`
            : `Defeat. The ${battle.opponent.displayName} won. Final Control: ${battle.playerFinalStrength} to ${battle.opponentFinalStrength}.`
          : ''}
      </div>

      <div className="phase34-battle-arena" data-testid="demo-battle-canvas-host">
        <div ref={hostRef} className="phase34-battle-canvas" />
        {initialResult ? <div className="phase34-battle-restored-bg" aria-hidden /> : null}

        <div className="phase34-battle-hud" aria-label="Battle Control HUD">
          <article className="phase34-hud-fighter phase34-hud-fighter--player">
            <div className="phase34-hud-portrait">
              <RookieArt role="portrait" alt="Rookie Brawler portrait" />
            </div>
            <div className="phase34-hud-fighter__body">
              <header>
                <div>
                  <span>Your ARMZ</span>
                  <strong>{battle.armz.displayName}</strong>
                </div>
                <b>{playerControl}</b>
              </header>
              <ControlBar label="Control" value={playerControl} tone="player" />
            </div>
          </article>

          <div className="phase34-battle-event" aria-live="polite" aria-atomic="true">
            <span>{event.cue}</span>
            <strong>{event.title}</strong>
            <i aria-hidden />
          </div>

          <article className="phase34-hud-fighter phase34-hud-fighter--opponent">
            <div className="phase34-hud-portrait">
              <AutomatonArt role="portrait" alt="Practice Automaton portrait" />
            </div>
            <div className="phase34-hud-fighter__body">
              <header>
                <div>
                  <span>Easy</span>
                  <strong>{battle.opponent.displayName}</strong>
                </div>
                <b>{opponentControl}</b>
              </header>
              <ControlBar label="Control" value={opponentControl} tone="opponent" />
            </div>
          </article>
        </div>

        <div className="phase34-battle-controls" aria-label="Battle presentation controls">
          <IconButton
            label={`Sound effects ${muted ? 'off' : 'on'}`}
            onClick={toggleMuted}
            aria-pressed={!muted}
            data-testid="battle-sfx-toggle"
          >
            <GameIcon name="sound" />
          </IconButton>
          <IconButton
            label={`Music ${musicOn ? 'on' : 'off'}`}
            onClick={toggleMusic}
            aria-pressed={musicOn}
            data-testid="battle-music-toggle"
          >
            <GameIcon name="music" />
          </IconButton>
          <IconButton
            label={`Reduced motion ${reducedMotion ? 'on' : 'off'}`}
            onClick={() => onReducedMotionChange(!reducedMotion)}
            aria-pressed={reducedMotion}
            data-testid="battle-motion-toggle"
          >
            <GameIcon name="motion" />
          </IconButton>
          {!done ? (
            <IconButton label="Skip to result" onClick={skipToResult} data-testid="battle-skip">
              <GameIcon name="skip" />
            </IconButton>
          ) : null}
        </div>

        {!showResult ? (
          <p className="phase34-battle-art-note">Temporary battle rig · final owner art pending</p>
        ) : null}

        {showResult ? (
          <div
            className={`phase34-result phase34-result--${isVictory ? 'victory' : 'defeat'}`}
            data-testid="demo-battle-result"
            role="dialog"
            aria-modal="true"
            aria-labelledby="battle-result-title"
          >
            <div className="phase34-result__accent" aria-hidden>
              <PremiumArt
                assetId={isVictory ? 'result/victory-accent' : 'result/defeat-accent'}
                alt=""
              />
            </div>

            <header className="phase34-result__header">
              <p>Simulated result · final state synchronized</p>
              <h2
                id="battle-result-title"
                ref={resultTitleRef}
                tabIndex={-1}
                className="armz-display"
              >
                {isVictory ? 'Victory' : 'Defeat'}
              </h2>
              <span>
                {isVictory
                  ? 'Rookie Brawler owns the table.'
                  : 'The Automaton held the line. Reset and return.'}
              </span>
            </header>

            <div className="phase34-result__body">
              <div className={`phase34-result-fighter ${isVictory ? 'is-winner' : 'is-loser'}`}>
                <RookieArt
                  role={isVictory ? 'result-victory' : 'result-defeat'}
                  alt={`Rookie Brawler ${isVictory ? 'victory' : 'defeat'} art`}
                  showStatus
                  imageClassName="phase34-result-fighter__image"
                />
                <strong>Rookie Brawler</strong>
                <span>{isVictory ? 'Winner' : 'Pinned'}</span>
              </div>

              <div className="phase34-result-summary">
                <div className="phase34-result-control">
                  <div>
                    <span>Your Control</span>
                    <strong>{battle.playerFinalStrength}</strong>
                  </div>
                  <b>–</b>
                  <div>
                    <span>Opponent</span>
                    <strong>{battle.opponentFinalStrength}</strong>
                  </div>
                </div>

                {isVictory && battle.reward ? (
                  <div className="phase34-reward-card">
                    <span>Simulated reward</span>
                    <strong>{battle.reward.display}</strong>
                    <ul>
                      <li>No monetary value</li>
                      <li>Not claimable</li>
                      <li>Not withdrawable</li>
                      <li>Not transferable</li>
                    </ul>
                  </div>
                ) : (
                  <div className="phase34-training-card">
                    <span>Training feedback</span>
                    <strong>Protect the center grip.</strong>
                    <p>
                      Watch the reversal cue and keep your Control above zero through the final
                      drive.
                    </p>
                  </div>
                )}

                <p className="phase34-result-meta">
                  Battle {battle.battleId.slice(0, 8)}… · {(battle.durationMs / 1000).toFixed(1)}s ·
                  server-authoritative
                </p>
              </div>

              <div className={`phase34-result-fighter ${isVictory ? 'is-loser' : 'is-winner'}`}>
                <AutomatonArt
                  role={isVictory ? 'result-defeat' : 'result-victory'}
                  alt={`Practice Automaton ${isVictory ? 'defeat' : 'victory'} art`}
                  showStatus
                  imageClassName="phase34-result-fighter__image"
                />
                <strong>Practice Automaton</strong>
                <span>{isVictory ? 'Defeated' : 'Winner'}</span>
              </div>
            </div>

            <div className="phase34-result-actions">
              <Button
                onClick={onReplay}
                disabled={cooldown > 0 || battle.session.battlesRemaining <= 0}
                data-testid="demo-replay"
              >
                <GameIcon name="replay" />
                {cooldown > 0
                  ? `Replay ${formatCooldown(cooldown)}`
                  : battle.session.battlesRemaining <= 0
                    ? 'Battle limit reached'
                    : 'Replay'}
              </Button>
              <Button variant="secondary" onClick={onCollection}>
                <GameIcon name="collection" /> Collection
              </Button>
              <Button variant="ghost" onClick={onHome}>
                <GameIcon name="arena" /> Return to Arena
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
