/**
 * PixiJS Phase 3 demo battle renderer.
 * Procedural arm figures + table + VFX driven by server timeline.
 * Skills applied: game-asset-core (engine anchors/layers), game-animation-frames
 * (state cues), game-character-consistency (stable palette per side),
 * game-tilesets (arena band tiling), game-ui-icons (strength bar chrome).
 */

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';

export type TimelineEvent = {
  index: number;
  type: string;
  startMs: number;
  durationMs: number;
  playerStrengthBefore: number;
  playerStrengthAfter: number;
  opponentStrengthBefore: number;
  opponentStrengthAfter: number;
  intensity: number;
  animationCue: string;
  soundCue: string;
  vfxCue: string;
  side?: string;
};

export type FighterPalette = {
  skinTone: string;
  primaryCloth: string;
  accent: string;
  glove: string;
};

export type BattleRendererOptions = {
  host: HTMLElement;
  timeline: TimelineEvent[];
  playerPalette: FighterPalette;
  opponentPalette: FighterPalette;
  playerName: string;
  opponentName: string;
  reducedMotion?: boolean;
  muted?: boolean;
  onComplete?: () => void;
  onEvent?: (ev: TimelineEvent) => void;
  onStrength?: (player: number, opponent: number) => void;
};

function hex(n: string): number {
  return parseInt(n.replace('#', ''), 16);
}

export class BattleRenderer {
  private app: Application | null = null;
  private host: HTMLElement;
  private timeline: TimelineEvent[];
  private playerPalette: FighterPalette;
  private opponentPalette: FighterPalette;
  private reducedMotion: boolean;
  private muted: boolean;
  private onComplete?: () => void;
  private onEvent?: (ev: TimelineEvent) => void;
  private onStrength?: (player: number, opponent: number) => void;
  private raf = 0;
  private startTs = 0;
  private paused = false;
  private pauseOffset = 0;
  private destroyed = false;
  private playerStr = 100;
  private opponentStr = 100;
  private layers: {
    bg: Container;
    atmosphere: Container;
    tableRear: Container;
    opponent: Container;
    player: Container;
    grip: Container;
    tableFront: Container;
    particles: Container;
    vfx: Container;
    hud: Container;
  } | null = null;
  private playerArm: Graphics | null = null;
  private opponentArm: Graphics | null = null;
  private tableG: Graphics | null = null;
  private particlesG: Graphics | null = null;
  private cue = 'idle';
  private shake = 0;
  private playerName: string;
  private opponentName: string;

  constructor(opts: BattleRendererOptions) {
    this.host = opts.host;
    this.timeline = opts.timeline;
    this.playerPalette = opts.playerPalette;
    this.opponentPalette = opts.opponentPalette;
    this.reducedMotion = Boolean(opts.reducedMotion);
    this.muted = Boolean(opts.muted);
    this.onComplete = opts.onComplete;
    this.onEvent = opts.onEvent;
    this.onStrength = opts.onStrength;
    this.playerName = opts.playerName;
    this.opponentName = opts.opponentName;
  }

  async mount(): Promise<void> {
    if (this.destroyed) return;
    const app = new Application();
    await app.init({
      resizeTo: this.host,
      background: '#0b0e14',
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    this.app = app;
    this.host.replaceChildren(app.canvas as HTMLCanvasElement);
    (app.canvas as HTMLCanvasElement).setAttribute('role', 'img');
    (app.canvas as HTMLCanvasElement).setAttribute(
      'aria-label',
      'Armz Clash demo battle animation. Strength bars update with the fight.',
    );

    const root = new Container();
    app.stage.addChild(root);
    this.layers = {
      bg: new Container(),
      atmosphere: new Container(),
      tableRear: new Container(),
      opponent: new Container(),
      player: new Container(),
      grip: new Container(),
      tableFront: new Container(),
      particles: new Container(),
      vfx: new Container(),
      hud: new Container(),
    };
    Object.values(this.layers).forEach((c) => root.addChild(c));

    this.drawBackground();
    this.tableG = new Graphics();
    this.layers.tableRear.addChild(this.tableG);
    this.playerArm = new Graphics();
    this.opponentArm = new Graphics();
    this.layers.player.addChild(this.playerArm);
    this.layers.opponent.addChild(this.opponentArm);
    this.particlesG = new Graphics();
    this.layers.particles.addChild(this.particlesG);

    const style = new TextStyle({
      fill: '#e8ecf4',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      fontWeight: '600',
    });
    const pLabel = new Text({ text: this.playerName, style });
    const oLabel = new Text({
      text: this.opponentName,
      style: new TextStyle({ ...style, fill: '#9aa4b2' }),
    });
    pLabel.x = 16;
    pLabel.y = 12;
    oLabel.x = 16;
    oLabel.y = 36;
    this.layers.hud.addChild(pLabel, oLabel);

    this.layout();
    app.renderer.on('resize', () => this.layout());

    this.startTs = performance.now();
    const tick = () => {
      if (this.destroyed || !this.app) return;
      if (!this.paused) this.update(performance.now() - this.startTs - this.pauseOffset);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    this.host.replaceChildren();
  }

  private layout(): void {
    if (!this.app) return;
    this.drawBackground();
    this.drawTable();
    this.drawArms(this.cue);
  }

  private drawBackground(): void {
    if (!this.layers || !this.app) return;
    this.layers.bg.removeChildren();
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const g = new Graphics();
    // Dark cinematic arena gradient bands (tile-like bands — game-tilesets discipline)
    g.rect(0, 0, w, h).fill(0x0b0e14);
    for (let i = 0; i < 8; i += 1) {
      const y = (h * i) / 8;
      g.rect(0, y, w, h / 8 + 1).fill({ color: i % 2 === 0 ? 0x10151f : 0x0d121a, alpha: 0.9 });
    }
    // Warm arena rim light
    g.ellipse(w / 2, h * 0.72, w * 0.42, h * 0.12).fill({ color: 0xd4af6a, alpha: 0.08 });
    g.ellipse(w / 2, h * 0.35, w * 0.35, h * 0.2).fill({ color: 0x4ecdc4, alpha: 0.05 });
    this.layers.bg.addChild(g);

    this.layers.atmosphere.removeChildren();
    const fog = new Graphics();
    fog.rect(0, h * 0.55, w, h * 0.45).fill({ color: 0x1a1420, alpha: 0.35 });
    this.layers.atmosphere.addChild(fog);
  }

  private drawTable(): void {
    if (!this.tableG || !this.app) return;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const g = this.tableG;
    g.clear();
    const shakeX = this.reducedMotion ? 0 : this.shake * (Math.random() - 0.5) * 4;
    const cy = h * 0.62 + shakeX * 0.2;
    // Metallic table
    g.roundRect(w * 0.12 + shakeX, cy, w * 0.76, h * 0.12, 12).fill(0x2a241c);
    g.roundRect(w * 0.14 + shakeX, cy + 4, w * 0.72, h * 0.06, 8).fill(0x3d3428);
    g.roundRect(w * 0.18 + shakeX, cy + 8, w * 0.64, h * 0.02, 4).fill({
      color: 0xd4af6a,
      alpha: 0.35,
    });
    // Table edge highlight
    g.moveTo(w * 0.15 + shakeX, cy + 2)
      .lineTo(w * 0.85 + shakeX, cy + 2)
      .stroke({ width: 2, color: 0x6b5a40, alpha: 0.8 });
  }

  private drawArms(cue: string): void {
    if (!this.playerArm || !this.opponentArm || !this.app) return;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const phase = (performance.now() / 180) % (Math.PI * 2);
    const strain =
      cue.includes('push') || cue.includes('strain') || cue === 'critical' || cue === 'counter'
        ? 1
        : cue === 'fatigue'
          ? 0.4
          : 0.15;
    const pushBias =
      cue.includes('push') && this.cue.includes('player')
        ? 1
        : cue === 'winning_slam'
          ? 1.2
          : cue === 'defeated'
            ? -1
            : Math.sin(phase) * strain;

    // Map strength into lean (who is winning visually)
    const lean = ((this.opponentStr - this.playerStr) / 100) * 28 + pushBias * 10;

    this.drawFighterArm(this.playerArm, {
      originX: w * 0.22,
      originY: h * 0.58,
      lean,
      side: 'player',
      palette: this.playerPalette,
      cue,
      phase,
    });
    this.drawFighterArm(this.opponentArm, {
      originX: w * 0.78,
      originY: h * 0.58,
      lean: -lean,
      side: 'opponent',
      palette: this.opponentPalette,
      cue,
      phase: phase + 0.7,
    });
  }

  private drawFighterArm(
    g: Graphics,
    opts: {
      originX: number;
      originY: number;
      lean: number;
      side: 'player' | 'opponent';
      palette: FighterPalette;
      cue: string;
      phase: number;
    },
  ): void {
    g.clear();
    const dir = opts.side === 'player' ? 1 : -1;
    const skin = hex(opts.palette.skinTone);
    const cloth = hex(opts.palette.primaryCloth);
    const accent = hex(opts.palette.accent);
    const glove = hex(opts.palette.glove);

    // Multi-segment arm (not single-pivot rotation): shoulder → elbow → wrist → fist
    const shoulderX = opts.originX;
    const shoulderY = opts.originY;
    const elbowX = shoulderX + dir * 70 + opts.lean * 0.35;
    const elbowY = shoulderY + 18 + Math.sin(opts.phase) * 3;
    const wristX = elbowX + dir * 55 + opts.lean * 0.55;
    const wristY = elbowY - 8 + Math.cos(opts.phase * 1.2) * 2;
    const fistX = wristX + dir * 28 + opts.lean * 0.2;
    const fistY = wristY - 4;

    // Upper arm
    g.moveTo(shoulderX, shoulderY)
      .lineTo(elbowX, elbowY)
      .stroke({ width: 22, color: skin, cap: 'round' });
    // Forearm
    g.moveTo(elbowX, elbowY)
      .lineTo(wristX, wristY)
      .stroke({ width: 18, color: skin, cap: 'round' });
    // Cloth / bracer
    g.roundRect(elbowX - 14, elbowY - 10, 28, 20, 4).fill(cloth);
    g.roundRect(elbowX - 12, elbowY - 4, 24, 6, 2).fill(accent);
    // Glove / fist
    g.circle(fistX, fistY, 16).fill(glove);
    g.circle(fistX + dir * 4, fistY - 2, 10).fill(skin);
    // Elbow joint marker for planted feel
    g.circle(elbowX, elbowY, 6).fill({ color: skin, alpha: 0.9 });

    // Cue accents
    if (opts.cue === 'critical' || opts.cue.includes('push_heavy')) {
      g.circle(fistX, fistY, 22).stroke({ width: 2, color: accent, alpha: 0.7 });
    }
    if (opts.cue === 'defeated') {
      g.moveTo(wristX, wristY)
        .lineTo(fistX + dir * 10, fistY + 18)
        .stroke({ width: 14, color: skin, cap: 'round' });
    }
  }

  private update(elapsedMs: number): void {
    if (!this.app) return;
    let active: TimelineEvent | null = null;
    for (const ev of this.timeline) {
      if (elapsedMs >= ev.startMs && elapsedMs < ev.startMs + ev.durationMs) {
        active = ev;
        break;
      }
    }
    if (!active) {
      const last = this.timeline[this.timeline.length - 1];
      if (last && elapsedMs >= last.startMs + last.durationMs) {
        this.onComplete?.();
        this.paused = true;
        return;
      }
    }
    if (active) {
      // Interpolate strength within event
      const u = Math.min(1, Math.max(0, (elapsedMs - active.startMs) / active.durationMs));
      const ease = this.reducedMotion ? u : u * u * (3 - 2 * u);
      this.playerStr = Math.round(
        active.playerStrengthBefore +
          (active.playerStrengthAfter - active.playerStrengthBefore) * ease,
      );
      this.opponentStr = Math.round(
        active.opponentStrengthBefore +
          (active.opponentStrengthAfter - active.opponentStrengthBefore) * ease,
      );
      this.onStrength?.(this.playerStr, this.opponentStr);
      if (active.animationCue !== this.cue) {
        this.cue = active.animationCue;
        this.onEvent?.(active);
      }
      this.shake = this.reducedMotion
        ? 0
        : active.intensity > 7000
          ? 1.2
          : active.intensity > 4000
            ? 0.5
            : 0;
      if (!this.muted && active.soundCue && active.soundCue !== 'none') {
        // Web Audio foundation — short procedural click (no external assets required)
        this.playCue(active.soundCue, active.intensity);
      }
      this.drawParticles(active);
    }
    this.drawTable();
    this.drawArms(this.cue);
  }

  private lastSoundAt = 0;
  private audioCtx: AudioContext | null = null;

  private playCue(cue: string, intensity: number): void {
    if (typeof window === 'undefined') return;
    const now = performance.now();
    if (now - this.lastSoundAt < 120) return;
    this.lastSoundAt = now;
    try {
      this.audioCtx ??= new AudioContext();
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const base =
        cue.includes('critical') || cue.includes('final')
          ? 120
          : cue.includes('impact')
            ? 90
            : cue === 'victory'
              ? 440
              : cue === 'defeat'
                ? 70
                : 160;
      osc.frequency.value = base + intensity / 100;
      gain.gain.value = 0.03;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Autoplay policy — ignore
    }
  }

  private drawParticles(ev: TimelineEvent): void {
    if (!this.particlesG || !this.app || this.reducedMotion) {
      this.particlesG?.clear();
      return;
    }
    const g = this.particlesG;
    g.clear();
    if (ev.vfxCue === 'none') return;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const n = ev.vfxCue.includes('heavy') || ev.vfxCue.includes('final') ? 14 : 8;
    for (let i = 0; i < n; i += 1) {
      const x = w * 0.5 + (Math.random() - 0.5) * w * 0.25;
      const y = h * 0.55 + (Math.random() - 0.5) * 40;
      const color = ev.vfxCue.includes('critical')
        ? 0x4ecdc4
        : ev.vfxCue.includes('victory')
          ? 0xd4af6a
          : 0x8a7a60;
      g.circle(x, y, 2 + Math.random() * 3).fill({ color, alpha: 0.5 + Math.random() * 0.4 });
    }
  }
}
