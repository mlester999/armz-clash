/**
 * PixiJS Phase 3.1 demo battle renderer — premium hybrid presentation.
 * Procedural arena + stylized multi-segment fighters driven by server timeline.
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
  playerPresetKey?: string;
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
  private vfxG: Graphics | null = null;
  private cue = 'idle';
  private shake = 0;
  private playerName: string;
  private opponentName: string;
  private playerPresetKey: string;
  private lastSoundAt = 0;
  private audioCtx: AudioContext | null = null;
  private completed = false;

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
    this.playerPresetKey = opts.playerPresetKey ?? 'rookie_brawler';
  }

  async mount(): Promise<void> {
    if (this.destroyed) return;
    const app = new Application();
    await app.init({
      resizeTo: this.host,
      background: '#070b12',
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
    this.vfxG = new Graphics();
    this.layers.vfx.addChild(this.vfxG);

    const style = new TextStyle({
      fill: '#f0d9a0',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
    });
    const pLabel = new Text({ text: this.playerName, style });
    const oLabel = new Text({
      text: this.opponentName,
      style: new TextStyle({ ...style, fill: '#c5ced9' }),
    });
    pLabel.x = 14;
    pLabel.y = 10;
    oLabel.x = 14;
    oLabel.y = 30;
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

    // Deep cinematic base
    g.rect(0, 0, w, h).fill(0x070b12);
    // Vertical arena pillars / panels
    for (let i = 0; i < 6; i += 1) {
      const x = (w * (i + 0.5)) / 6;
      g.rect(x - w * 0.04, 0, w * 0.08, h).fill({ color: 0x0e1420, alpha: 0.55 });
    }
    // Floor band
    g.rect(0, h * 0.62, w, h * 0.38).fill({ color: 0x0a0e16, alpha: 1 });
    g.rect(0, h * 0.62, w, 3).fill({ color: 0xd4af6a, alpha: 0.18 });
    // Warm rim + cyan top light
    g.ellipse(w / 2, h * 0.7, w * 0.48, h * 0.14).fill({ color: 0xd4af6a, alpha: 0.1 });
    g.ellipse(w / 2, h * 0.22, w * 0.4, h * 0.18).fill({ color: 0x5ec8ff, alpha: 0.07 });
    // Spotlight cone over table
    g.moveTo(w * 0.35, 0)
      .lineTo(w * 0.65, 0)
      .lineTo(w * 0.78, h * 0.7)
      .lineTo(w * 0.22, h * 0.7)
      .fill({ color: 0xffffff, alpha: 0.03 });
    this.layers.bg.addChild(g);

    this.layers.atmosphere.removeChildren();
    const fog = new Graphics();
    fog.rect(0, h * 0.5, w, h * 0.5).fill({ color: 0x1a1424, alpha: 0.28 });
    // Side vignettes
    fog.rect(0, 0, w * 0.12, h).fill({ color: 0x000000, alpha: 0.35 });
    fog.rect(w * 0.88, 0, w * 0.12, h).fill({ color: 0x000000, alpha: 0.35 });
    this.layers.atmosphere.addChild(fog);
  }

  private drawTable(): void {
    if (!this.tableG || !this.app) return;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const g = this.tableG;
    g.clear();
    const shakeX = this.reducedMotion ? 0 : this.shake * (Math.random() - 0.5) * 6;
    const cy = h * 0.6 + shakeX * 0.15;

    // Platform shadow
    g.ellipse(w / 2 + shakeX, cy + h * 0.1, w * 0.4, h * 0.04).fill({
      color: 0x000000,
      alpha: 0.45,
    });
    // Table body — layered metal
    g.roundRect(w * 0.1 + shakeX, cy, w * 0.8, h * 0.13, 14).fill(0x1c1812);
    g.roundRect(w * 0.12 + shakeX, cy + 4, w * 0.76, h * 0.08, 10).fill(0x2e2820);
    g.roundRect(w * 0.14 + shakeX, cy + 8, w * 0.72, h * 0.035, 6).fill(0x3d3428);
    // Gold inlay
    g.roundRect(w * 0.18 + shakeX, cy + 12, w * 0.64, h * 0.012, 3).fill({
      color: 0xd4af6a,
      alpha: 0.45,
    });
    // Edge highlight
    g.moveTo(w * 0.12 + shakeX, cy + 3)
      .lineTo(w * 0.88 + shakeX, cy + 3)
      .stroke({ width: 2, color: 0x6b5a40, alpha: 0.85 });
    // Grip pad center
    g.ellipse(w / 2 + shakeX, cy + h * 0.02, w * 0.06, h * 0.018).fill({
      color: 0x5ec8ff,
      alpha: 0.12,
    });
  }

  private drawArms(cue: string): void {
    if (!this.playerArm || !this.opponentArm || !this.app) return;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const phase = (performance.now() / 160) % (Math.PI * 2);
    const strain =
      cue.includes('push') || cue.includes('strain') || cue === 'critical' || cue === 'counter'
        ? 1
        : cue === 'fatigue' || cue === 'recovery'
          ? 0.45
          : 0.18;
    const pushBias =
      cue.includes('push') || cue === 'decisive'
        ? 1
        : cue === 'winning_slam'
          ? 1.35
          : cue === 'defeated'
            ? -1.1
            : Math.sin(phase) * strain;

    const lean = ((this.opponentStr - this.playerStr) / 100) * 32 + pushBias * 12;

    this.drawFighterArm(this.playerArm, {
      originX: w * 0.2,
      originY: h * 0.56,
      lean,
      side: 'player',
      palette: this.playerPalette,
      cue,
      phase,
      mechanical: false,
    });
    this.drawFighterArm(this.opponentArm, {
      originX: w * 0.8,
      originY: h * 0.56,
      lean: -lean,
      side: 'opponent',
      palette: this.opponentPalette,
      cue,
      phase: phase + 0.8,
      mechanical: true,
    });

    // Connected grip glow at center
    if (this.layers) {
      this.layers.grip.removeChildren();
      const grip = new Graphics();
      const gx = w / 2 + lean * 0.4;
      const gy = h * 0.54;
      grip.circle(gx, gy, 10 + Math.sin(phase) * 2).fill({ color: 0x5ec8ff, alpha: 0.15 });
      grip.circle(gx, gy, 5).fill({ color: 0xf0d9a0, alpha: 0.35 });
      this.layers.grip.addChild(grip);
    }
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
      mechanical: boolean;
    },
  ): void {
    g.clear();
    const dir = opts.side === 'player' ? 1 : -1;
    const skin = hex(opts.palette.skinTone);
    const cloth = hex(opts.palette.primaryCloth);
    const accent = hex(opts.palette.accent);
    const glove = hex(opts.palette.glove);

    const shoulderX = opts.originX;
    const shoulderY = opts.originY;
    const elbowX = shoulderX + dir * 78 + opts.lean * 0.4;
    const elbowY = shoulderY + 20 + Math.sin(opts.phase) * 4;
    const wristX = elbowX + dir * 62 + opts.lean * 0.6;
    const wristY = elbowY - 10 + Math.cos(opts.phase * 1.15) * 3;
    const fistX = wristX + dir * 32 + opts.lean * 0.25;
    const fistY = wristY - 5;

    // Soft arm shadow
    g.moveTo(shoulderX + 4, shoulderY + 6)
      .lineTo(elbowX + 4, elbowY + 6)
      .lineTo(wristX + 3, wristY + 6)
      .stroke({ width: 26, color: 0x000000, alpha: 0.25, cap: 'round', join: 'round' });

    // Upper arm mass
    g.moveTo(shoulderX, shoulderY)
      .lineTo(elbowX, elbowY)
      .stroke({ width: 26, color: skin, cap: 'round' });
    // Muscle highlight
    g.moveTo(shoulderX + dir * 2, shoulderY - 4)
      .lineTo(elbowX + dir * 2, elbowY - 3)
      .stroke({ width: 8, color: 0xffffff, alpha: 0.12, cap: 'round' });

    // Forearm
    g.moveTo(elbowX, elbowY)
      .lineTo(wristX, wristY)
      .stroke({ width: 20, color: skin, cap: 'round' });

    // Cloth / bracer / wrap — thicker for premium silhouette
    if (opts.mechanical) {
      g.roundRect(elbowX - 18, elbowY - 14, 36, 28, 5).fill(cloth);
      g.roundRect(elbowX - 14, elbowY - 6, 28, 8, 2).fill(accent);
      g.roundRect(elbowX - 12, elbowY + 4, 24, 4, 1).fill({ color: accent, alpha: 0.45 });
    } else {
      g.roundRect(elbowX - 16, elbowY - 12, 32, 24, 6).fill(cloth);
      // Wrap stripes by preset family
      const isAthletic =
        this.playerPresetKey.includes('street') || this.playerPresetKey.includes('arena');
      const isMetal = this.playerPresetKey.includes('iron');
      if (isMetal) {
        g.roundRect(elbowX - 14, elbowY - 4, 28, 10, 2).fill({ color: glove, alpha: 0.9 });
        g.roundRect(elbowX - 12, elbowY - 2, 24, 3, 1).fill(accent);
      } else if (isAthletic) {
        g.moveTo(elbowX - 10, elbowY - 6)
          .lineTo(elbowX + 10, elbowY + 8)
          .stroke({ width: 4, color: accent, cap: 'round' });
        g.moveTo(elbowX - 6, elbowY - 8)
          .lineTo(elbowX + 12, elbowY + 4)
          .stroke({ width: 3, color: accent, alpha: 0.7, cap: 'round' });
      } else {
        g.roundRect(elbowX - 12, elbowY - 2, 24, 6, 2).fill(accent);
      }
    }

    // Wrist cuff
    g.roundRect(wristX - 10, wristY - 8, 20, 12, 3).fill(accent);

    // Glove / fist
    g.circle(fistX, fistY, 18).fill(glove);
    g.circle(fistX + dir * 5, fistY - 3, 11).fill({
      color: skin,
      alpha: opts.mechanical ? 0.25 : 0.45,
    });
    // Knuckles
    for (let i = 0; i < 4; i += 1) {
      g.circle(fistX + dir * (i * 5 - 6), fistY - 6 + (i % 2), 3.2).fill({
        color: skin,
        alpha: 0.35,
      });
    }
    g.circle(elbowX, elbowY, 7).fill({ color: skin, alpha: 0.95 });

    // Impact ring
    if (opts.cue === 'critical' || opts.cue.includes('push_heavy') || opts.cue === 'decisive') {
      g.circle(fistX, fistY, 26).stroke({ width: 2.5, color: accent, alpha: 0.75 });
      g.circle(fistX, fistY, 34).stroke({ width: 1.5, color: 0x5ec8ff, alpha: 0.35 });
    }
    if (opts.cue === 'winning_slam') {
      g.circle(fistX, fistY, 40).stroke({ width: 3, color: 0xd4af6a, alpha: 0.6 });
    }
    if (opts.cue === 'defeated') {
      g.moveTo(wristX, wristY)
        .lineTo(fistX + dir * 12, fistY + 22)
        .stroke({ width: 16, color: skin, cap: 'round' });
    }
  }

  private update(elapsedMs: number): void {
    if (!this.app || this.completed) return;
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
        this.completed = true;
        this.onComplete?.();
        this.paused = true;
        return;
      }
    }
    if (active) {
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
          ? 1.4
          : active.intensity > 4000
            ? 0.65
            : 0.15;
      if (!this.muted && active.soundCue && active.soundCue !== 'none') {
        this.playCue(active.soundCue, active.intensity);
      }
      this.drawParticles(active);
      this.drawImpactFlash(active);
    }
    this.drawTable();
    this.drawArms(this.cue);
  }

  private playCue(cue: string, intensity: number): void {
    if (typeof window === 'undefined') return;
    const now = performance.now();
    if (now - this.lastSoundAt < 110) return;
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
      gain.gain.value = 0.028;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Autoplay policy
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
    const n = ev.vfxCue.includes('heavy') || ev.vfxCue.includes('final') ? 18 : 10;
    for (let i = 0; i < n; i += 1) {
      const x = w * 0.5 + (Math.random() - 0.5) * w * 0.28;
      const y = h * 0.52 + (Math.random() - 0.5) * 50;
      const color = ev.vfxCue.includes('critical')
        ? 0x5ec8ff
        : ev.vfxCue.includes('victory')
          ? 0xd4af6a
          : 0x8a7a60;
      g.circle(x, y, 2 + Math.random() * 3.5).fill({ color, alpha: 0.45 + Math.random() * 0.45 });
    }
  }

  private drawImpactFlash(ev: TimelineEvent): void {
    if (!this.vfxG || !this.app) return;
    this.vfxG.clear();
    if (this.reducedMotion) return;
    if (!(ev.intensity > 5500 || ev.vfxCue.includes('heavy') || ev.vfxCue.includes('critical'))) {
      return;
    }
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.vfxG.ellipse(w / 2, h * 0.54, w * 0.12, h * 0.05).fill({
      color: 0xffffff,
      alpha: 0.06 + (ev.intensity / 100000) * 0.08,
    });
  }
}
