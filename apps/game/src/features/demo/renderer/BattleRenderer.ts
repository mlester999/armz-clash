/**
 * PixiJS Phase 3.3A battle renderer — premium vertical arm-wrestling rig.
 * Close camera, layered anatomical arms, cinematic VFX, arena spectacle.
 */

import { Application, Container, Graphics } from 'pixi.js';

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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t * t * (3 - 2 * t);
}

type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: number; alpha: number;
};

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
    bg: Container; crowd: Container; table: Container;
    playerArm: Container; opponentArm: Container; grip: Container;
    tableFront: Container; particles: Container; vfx: Container; overlay: Container;
  } | null = null;
  private playerG: Graphics | null = null;
  private opponentG: Graphics | null = null;
  private tableG: Graphics | null = null;
  private bgG: Graphics | null = null;
  private crowdG: Graphics | null = null;
  private particlesG: Graphics | null = null;
  private vfxG: Graphics | null = null;
  private gripG: Graphics | null = null;
  private tableFrontG: Graphics | null = null;
  private overlayG: Graphics | null = null;
  private cue = 'idle';
  private shake = 0;
  private playerName: string;
  private opponentName: string;
  private playerPresetKey: string;
  private lastSoundAt = 0;
  private audioCtx: AudioContext | null = null;
  private completed = false;
  private gripAngle = 0;
  private targetGripAngle = 0;
  private strainPhase = 0;
  private particles: Particle[] = [];
  private flashIntensity = 0;
  private slamFlash = 0;
  private momentumDir = 0;
  private prevDiff = 0;
  private recoveryGlow = 0;
  private ambientPhase = 0;

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
      background: '#04070d',
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    this.app = app;
    this.host.replaceChildren(app.canvas as HTMLCanvasElement);
    (app.canvas as HTMLCanvasElement).setAttribute('role', 'img');
    (app.canvas as HTMLCanvasElement).setAttribute(
      'aria-label',
      'Armz Clash demo battle \\u2014 arm wrestling animation',
    );

    const root = new Container();
    app.stage.addChild(root);
    this.layers = {
      bg: new Container(), crowd: new Container(), table: new Container(),
      playerArm: new Container(), opponentArm: new Container(), grip: new Container(),
      tableFront: new Container(), particles: new Container(), vfx: new Container(),
      overlay: new Container(),
    };
    Object.values(this.layers).forEach((c) => root.addChild(c));

    this.bgG = new Graphics();
    this.crowdG = new Graphics();
    this.tableG = new Graphics();
    this.playerG = new Graphics();
    this.opponentG = new Graphics();
    this.gripG = new Graphics();
    this.tableFrontG = new Graphics();
    this.particlesG = new Graphics();
    this.vfxG = new Graphics();
    this.overlayG = new Graphics();

    this.layers.bg.addChild(this.bgG);
    this.layers.crowd.addChild(this.crowdG);
    this.layers.table.addChild(this.tableG);
    this.layers.playerArm.addChild(this.playerG);
    this.layers.opponentArm.addChild(this.opponentG);
    this.layers.grip.addChild(this.gripG);
    this.layers.tableFront.addChild(this.tableFrontG);
    this.layers.particles.addChild(this.particlesG);
    this.layers.vfx.addChild(this.vfxG);
    this.layers.overlay.addChild(this.overlayG);

    this.drawStaticScene();

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
    if (this.audioCtx) {
      void this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    this.host.replaceChildren();
  }

  // === SCENE GEOMETRY (closer camera) ===
  private get scene() {
    const w = this.app!.screen.width;
    const h = this.app!.screen.height;
    const cx = w / 2;
    const tableY = h * 0.72;
    const tableW = Math.min(w * 0.88, 720);
    const tableH = h * 0.1;
    const elbowPadW = tableW * 0.13;
    const elbowPadH = tableH * 0.4;
    const playerElbowX = cx - tableW * 0.3;
    const opponentElbowX = cx + tableW * 0.3;
    const elbowY = tableY - tableH * 0.2;
    const forearmLen = Math.min(h * 0.36, 220);
    const gripCenterX = cx;
    const gripCenterY = elbowY - forearmLen * 0.8;
    const pinPadW = tableW * 0.09;
    const pinPadH = tableH * 0.55;
    const playerPinX = cx - tableW * 0.42;
    const opponentPinX = cx + tableW * 0.42;
    const shoulderY = elbowY + h * 0.08;
    return {
      w, h, cx, tableY, tableW, tableH, elbowPadW, elbowPadH,
      playerElbowX, opponentElbowX, elbowY, forearmLen,
      gripCenterX, gripCenterY, pinPadW, pinPadH,
      playerPinX, opponentPinX, shoulderY,
    };
  }

  // === STATIC SCENE (cinematic arena) ===
  private drawStaticScene(): void {
    if (!this.app) return;
    const { w, h, cx, tableY, tableW, tableH, elbowPadW, elbowPadH, playerElbowX, opponentElbowX, elbowY, playerPinX, opponentPinX, pinPadW, pinPadH } = this.scene;

    const bg = this.bgG!;
    bg.clear();
    bg.rect(0, 0, w, h).fill(0x04070d);
    bg.rect(0, 0, w, h * 0.4).fill({ color: 0x080e18, alpha: 1 });
    bg.rect(0, h * 0.4, w, h * 0.15).fill({ color: 0x0a1020, alpha: 0.8 });
    bg.rect(0, h * 0.55, w, h * 0.15).fill({ color: 0x0c1225, alpha: 0.6 });

    // Arena pillars with accent lighting
    for (let i = 0; i < 6; i++) {
      const px = (w * (i + 0.5)) / 6;
      bg.roundRect(px - 8, 0, 16, h * 0.55, 4).fill({ color: 0x121a2a, alpha: 0.7 });
      bg.roundRect(px - 2, h * 0.05, 4, h * 0.4, 2).fill({ color: 0xd4af6a, alpha: 0.06 });
    }

    // Arena banners
    bg.roundRect(w * 0.06, h * 0.03, w * 0.07, h * 0.25, 5).fill({ color: 0x1a2438, alpha: 0.8 });
    bg.roundRect(w * 0.87, h * 0.03, w * 0.07, h * 0.25, 5).fill({ color: 0x1a2438, alpha: 0.8 });
    bg.roundRect(w * 0.075, h * 0.05, w * 0.025, h * 0.2, 3).fill({ color: 0x5ec8ff, alpha: 0.12 });
    bg.roundRect(w * 0.885, h * 0.05, w * 0.025, h * 0.2, 3).fill({ color: 0xe07a4a, alpha: 0.12 });

    // Spotlight cones focused on fighters
    bg.moveTo(cx - w * 0.12, 0).lineTo(cx + w * 0.12, 0)
      .lineTo(cx + w * 0.38, tableY).lineTo(cx - w * 0.38, tableY)
      .fill({ color: 0xffffff, alpha: 0.035 });
    bg.moveTo(cx - w * 0.06, 0).lineTo(cx + w * 0.06, 0)
      .lineTo(cx + w * 0.22, tableY).lineTo(cx - w * 0.22, tableY)
      .fill({ color: 0xfff8e0, alpha: 0.025 });
    bg.ellipse(cx, tableY - h * 0.08, w * 0.32, h * 0.1).fill({ color: 0xd4af6a, alpha: 0.07 });
    bg.ellipse(cx, tableY - h * 0.05, w * 0.2, h * 0.06).fill({ color: 0xffffff, alpha: 0.03 });

    // Floor
    bg.rect(0, tableY + tableH, w, h - tableY - tableH).fill(0x060a10);
    bg.rect(0, tableY + tableH, w, 2).fill({ color: 0xd4af6a, alpha: 0.15 });

    // Crowd silhouettes
    const crowd = this.crowdG!;
    crowd.clear();
    for (let row = 0; row < 3; row++) {
      const count = 24 - row * 4;
      const baseY = h * 0.28 + row * h * 0.06;
      for (let i = 0; i < count; i++) {
        const cxp = (w * (i + 0.5)) / count + Math.sin(i * 3.7 + row) * 10;
        const cyp = baseY + Math.sin(i * 2.3 + row * 1.5) * 8;
        const r = 9 - row * 1.5 + (i % 3) * 1.5;
        const shade = 0x0c1018 + row * 0x020204;
        crowd.circle(cxp, cyp, r).fill({ color: shade, alpha: 0.8 - row * 0.1 });
        crowd.roundRect(cxp - r * 0.7, cyp + r * 0.5, r * 1.4, r * 2, 3).fill({ color: shade - 0x010102, alpha: 0.75 - row * 0.1 });
      }
    }

    // Table
    const tbl = this.tableG!;
    tbl.clear();
    tbl.ellipse(cx, tableY + tableH + 14, tableW * 0.5, 16).fill({ color: 0x000000, alpha: 0.6 });
    tbl.roundRect(cx - tableW / 2, tableY, tableW, tableH, 10).fill(0x1a1510);
    tbl.roundRect(cx - tableW / 2 + 5, tableY + 4, tableW - 10, tableH - 8, 7).fill(0x282018);
    tbl.roundRect(cx - tableW / 2 + 10, tableY + 7, tableW - 20, tableH * 0.28, 5).fill(0x3a3020);
    tbl.roundRect(cx - tableW * 0.36, tableY + tableH * 0.5, tableW * 0.72, 3, 1.5).fill({ color: 0xd4af6a, alpha: 0.55 });
    tbl.moveTo(cx - tableW / 2 + 8, tableY + 3).lineTo(cx + tableW / 2 - 8, tableY + 3).stroke({ width: 2, color: 0x7a6a4a, alpha: 0.6 });
    // Elbow pads
    tbl.roundRect(playerElbowX - elbowPadW / 2, elbowY - elbowPadH / 2, elbowPadW, elbowPadH, 5).fill({ color: 0x2a3a4a, alpha: 0.95 });
    tbl.roundRect(playerElbowX - elbowPadW / 2 + 3, elbowY - elbowPadH / 2 + 3, elbowPadW - 6, elbowPadH - 6, 4).fill({ color: 0x3a4a5a, alpha: 0.7 });
    tbl.roundRect(opponentElbowX - elbowPadW / 2, elbowY - elbowPadH / 2, elbowPadW, elbowPadH, 5).fill({ color: 0x4a3a2a, alpha: 0.95 });
    tbl.roundRect(opponentElbowX - elbowPadW / 2 + 3, elbowY - elbowPadH / 2 + 3, elbowPadW - 6, elbowPadH - 6, 4).fill({ color: 0x5a4a3a, alpha: 0.7 });
    // Pin pads
    tbl.roundRect(playerPinX - pinPadW / 2, tableY - pinPadH, pinPadW, pinPadH, 4).fill({ color: 0x5ec8ff, alpha: 0.25 });
    tbl.roundRect(opponentPinX - pinPadW / 2, tableY - pinPadH, pinPadW, pinPadH, 4).fill({ color: 0xe07a4a, alpha: 0.25 });

    // Table front edge
    const tf = this.tableFrontG!;
    tf.clear();
    tf.roundRect(cx - tableW / 2, tableY + tableH - 5, tableW, 10, 4).fill(0x181210);
    tf.roundRect(cx - tableW / 2 + 3, tableY + tableH - 3, tableW - 6, 4, 2).fill({ color: 0xd4af6a, alpha: 0.2 });
  }

  // === PREMIUM ARM DRAWING ===
  private drawArms(): void {
    if (!this.app || !this.playerG || !this.opponentG || !this.gripG) return;
    const s = this.scene;
    const shakeX = this.reducedMotion ? 0 : this.shake * (Math.random() - 0.5) * 5;
    const shakeY = this.reducedMotion ? 0 : this.shake * (Math.random() - 0.5) * 2;

    const angle = this.gripAngle;
    const strain = Math.abs(angle) / 0.55;

    const pivotX = s.cx + shakeX;
    const pivotY = s.elbowY;
    const handDist = s.forearmLen * 0.85;
    const handX = pivotX + Math.sin(angle) * handDist * 0.6;
    const handY = pivotY - handDist + Math.abs(angle) * handDist * 0.12 + shakeY;

    this.drawPremiumArm(this.playerG, {
      elbowX: s.playerElbowX + shakeX, elbowY: s.elbowY, handX, handY,
      shoulderX: s.playerElbowX - s.tableW * 0.2 + shakeX, shoulderY: s.shoulderY,
      palette: this.playerPalette, side: 'player', strain, mechanical: false,
    });

    this.drawPremiumArm(this.opponentG, {
      elbowX: s.opponentElbowX + shakeX, elbowY: s.elbowY, handX, handY,
      shoulderX: s.opponentElbowX + s.tableW * 0.2 + shakeX, shoulderY: s.shoulderY,
      palette: this.opponentPalette, side: 'opponent', strain, mechanical: true,
    });

    this.drawGrip(handX, handY, angle, strain);
  }

  private drawPremiumArm(
    g: Graphics,
    opts: {
      elbowX: number; elbowY: number; handX: number; handY: number;
      shoulderX: number; shoulderY: number; palette: FighterPalette;
      side: 'player' | 'opponent'; strain: number; mechanical: boolean;
    },
  ): void {
    g.clear();
    const skin = hex(opts.palette.skinTone);
    const cloth = hex(opts.palette.primaryCloth);
    const accent = hex(opts.palette.accent);
    const glove = hex(opts.palette.glove);
    const { elbowX, elbowY, handX, handY, shoulderX, shoulderY, strain } = opts;

    const faMidX = (elbowX + handX) / 2 + (opts.side === 'player' ? -10 : 10);
    const faMidY = (elbowY + handY) / 2;
    const uaMidX = (shoulderX + elbowX) / 2;
    const uaMidY = (shoulderY + elbowY) / 2 - 8;

    // Shadow layer
    g.moveTo(shoulderX + 4, shoulderY + 6)
      .quadraticCurveTo(uaMidX + 4, uaMidY + 6, elbowX + 4, elbowY + 5)
      .stroke({ width: 36, color: 0x000000, alpha: 0.35, cap: 'round' });
    g.moveTo(elbowX + 3, elbowY + 4)
      .quadraticCurveTo(faMidX + 3, faMidY + 4, handX + 3, handY + 3)
      .stroke({ width: 30, color: 0x000000, alpha: 0.3, cap: 'round' });

    if (opts.mechanical) {
      // === MECHANICAL ARM (Practice Automaton) ===
      // Upper arm: segmented metal
      g.moveTo(shoulderX, shoulderY)
        .quadraticCurveTo(uaMidX, uaMidY, elbowX, elbowY)
        .stroke({ width: 32, color: 0x3a4048, cap: 'round' });
      g.moveTo(shoulderX, shoulderY)
        .quadraticCurveTo(uaMidX, uaMidY, elbowX, elbowY)
        .stroke({ width: 24, color: 0x4a5058, cap: 'round' });
      // Plate separation lines
      for (let i = 1; i <= 3; i++) {
        const t = i / 4;
        const px = lerp(shoulderX, elbowX, t);
        const py = lerp(shoulderY, elbowY, t) - 4;
        g.moveTo(px - 10, py).lineTo(px + 10, py).stroke({ width: 2, color: 0x2a3038, alpha: 0.8 });
      }
      // Hydraulic pistons
      g.moveTo(shoulderX + 8, shoulderY + 4)
        .quadraticCurveTo(uaMidX + 10, uaMidY + 4, elbowX + 8, elbowY + 2)
        .stroke({ width: 5, color: accent, alpha: 0.5, cap: 'round' });
      g.moveTo(shoulderX - 6, shoulderY + 6)
        .quadraticCurveTo(uaMidX - 8, uaMidY + 6, elbowX - 6, elbowY + 4)
        .stroke({ width: 4, color: 0x6a7a8a, alpha: 0.6, cap: 'round' });

      // Elbow: mechanical bearing
      g.circle(elbowX, elbowY, 18).fill(0x3a4048);
      g.circle(elbowX, elbowY, 14).fill(0x4a5560);
      g.circle(elbowX, elbowY, 8).fill(accent);
      g.circle(elbowX, elbowY, 4).fill(0x2a3038);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        g.circle(elbowX + Math.cos(a) * 12, elbowY + Math.sin(a) * 12, 2.5).fill(0x6a7a8a);
      }

      // Forearm: industrial metal
      const faW = 26 + strain * 5;
      g.moveTo(elbowX, elbowY)
        .quadraticCurveTo(faMidX, faMidY, handX, handY)
        .stroke({ width: faW, color: 0x4a5560, cap: 'round' });
      g.moveTo(elbowX, elbowY)
        .quadraticCurveTo(faMidX, faMidY, handX, handY)
        .stroke({ width: faW - 8, color: 0x5a6570, cap: 'round' });
      g.moveTo(elbowX, elbowY - 2)
        .quadraticCurveTo(faMidX, faMidY - 2, handX, handY - 1)
        .stroke({ width: 6, color: 0x6a7580, alpha: 0.7, cap: 'round' });
      // Hydraulic lines
      g.moveTo(elbowX + 6, elbowY - 3)
        .quadraticCurveTo(faMidX + 8, faMidY - 3, handX + 5, handY - 2)
        .stroke({ width: 3.5, color: accent, alpha: 0.6, cap: 'round' });
      g.moveTo(elbowX - 5, elbowY + 3)
        .quadraticCurveTo(faMidX - 7, faMidY + 3, handX - 4, handY + 2)
        .stroke({ width: 3, color: 0x8a9aa8, alpha: 0.5, cap: 'round' });
      // Rivets
      for (let i = 1; i <= 4; i++) {
        const t = i / 5;
        const rx = lerp(elbowX, handX, t) + (opts.side === 'player' ? -6 : 6);
        const ry = lerp(elbowY, handY, t);
        g.circle(rx, ry, 2).fill(0x7a8a98);
      }

      // Wrist actuator
      const wristX = lerp(elbowX, handX, 0.78);
      const wristY = lerp(elbowY, handY, 0.78);
      g.roundRect(wristX - 14, wristY - 10, 28, 20, 4).fill(0x3a4550);
      g.roundRect(wristX - 10, wristY - 6, 20, 12, 3).fill(accent);
      g.roundRect(wristX - 6, wristY - 3, 12, 6, 2).fill(0x2a3038);

      // Shoulder housing
      g.circle(shoulderX, shoulderY, 22).fill(0x3a4048);
      g.circle(shoulderX, shoulderY, 16).fill(0x4a5560);
      g.circle(shoulderX, shoulderY, 8).fill(accent);
      g.roundRect(shoulderX - 18, shoulderY - 4, 36, 8, 4).fill({ color: 0x5a6570, alpha: 0.6 });

    } else {
      // === ORGANIC ARM (Rookie Brawler) ===
      // Upper arm: muscular
      g.moveTo(shoulderX, shoulderY)
        .quadraticCurveTo(uaMidX, uaMidY, elbowX, elbowY)
        .stroke({ width: 34, color: skin, cap: 'round' });
      g.moveTo(shoulderX + 2, shoulderY - 4)
        .quadraticCurveTo(uaMidX + 2, uaMidY - 6, elbowX + 1, elbowY - 3)
        .stroke({ width: 14, color: 0xffffff, alpha: 0.08, cap: 'round' });
      g.moveTo(shoulderX - 4, shoulderY + 6)
        .quadraticCurveTo(uaMidX - 3, uaMidY + 5, elbowX - 2, elbowY + 3)
        .stroke({ width: 3, color: 0x000000, alpha: 0.12, cap: 'round' });

      // Shoulder: deltoid with cloth strap
      g.circle(shoulderX, shoulderY, 22).fill(skin);
      g.circle(shoulderX - 3, shoulderY - 5, 14).fill({ color: 0xffffff, alpha: 0.06 });
      g.roundRect(shoulderX - 16, shoulderY - 8, 32, 16, 8).fill({ color: cloth, alpha: 0.8 });
      g.moveTo(shoulderX - 12, shoulderY).lineTo(shoulderX + 12, shoulderY + 2).stroke({ width: 3, color: accent, alpha: 0.6, cap: 'round' });

      // Elbow
      g.circle(elbowX, elbowY, 16).fill(skin);
      g.circle(elbowX, elbowY, 11).fill({ color: cloth, alpha: 0.4 });

      // Forearm: thick, powerful
      const faW = 26 + strain * 6;
      g.moveTo(elbowX, elbowY)
        .quadraticCurveTo(faMidX, faMidY, handX, handY)
        .stroke({ width: faW, color: skin, cap: 'round' });
      g.moveTo(elbowX - 2, elbowY - 4)
        .quadraticCurveTo(faMidX - 2, faMidY - 4, handX - 1, handY - 3)
        .stroke({ width: 9, color: 0xffffff, alpha: 0.07, cap: 'round' });
      g.moveTo(elbowX + 2, elbowY + 4)
        .quadraticCurveTo(faMidX + 2, faMidY + 4, handX + 1, handY + 3)
        .stroke({ width: 8, color: 0x000000, alpha: 0.1, cap: 'round' });

      // Veins under strain
      if (strain > 0.3 && !this.reducedMotion) {
        const veinAlpha = 0.08 + strain * 0.12;
        g.moveTo(elbowX + 3, elbowY - 6)
          .quadraticCurveTo(faMidX + 5, faMidY - 5, handX + 3, handY - 4)
          .stroke({ width: 1.5, color: 0x4a2a3a, alpha: veinAlpha, cap: 'round' });
        g.moveTo(elbowX - 4, elbowY - 3)
          .quadraticCurveTo(faMidX - 3, faMidY - 4, handX - 2, handY - 5)
          .stroke({ width: 1.2, color: 0x4a2a3a, alpha: veinAlpha * 0.7, cap: 'round' });
      }

      // Leather wrist wraps (Rookie Brawler signature)
      const wristX = lerp(elbowX, handX, 0.72);
      const wristY = lerp(elbowY, handY, 0.72);
      g.roundRect(wristX - 13, wristY - 9, 26, 18, 5).fill(cloth);
      for (let i = 0; i < 3; i++) {
        const wy = wristY - 5 + i * 5;
        g.moveTo(wristX - 10, wy).lineTo(wristX + 10, wy + 1.5).stroke({ width: 2.5, color: accent, alpha: 0.6 - i * 0.1, cap: 'round' });
      }
      g.roundRect(wristX - 4, wristY - 3, 8, 6, 2).fill(accent);

      // Mid-forearm bracer
      const bracerX = lerp(elbowX, handX, 0.45);
      const bracerY = lerp(elbowY, handY, 0.45);
      g.roundRect(bracerX - 11, bracerY - 7, 22, 14, 4).fill({ color: cloth, alpha: 0.7 });
      g.moveTo(bracerX - 8, bracerY).lineTo(bracerX + 8, bracerY + 1).stroke({ width: 2, color: accent, alpha: 0.5, cap: 'round' });
    }

    // Elbow pad contact glow
    g.circle(elbowX, elbowY, 18).stroke({ width: 2.5, color: accent, alpha: 0.15 + strain * 0.35 });
  }

  private drawGrip(handX: number, handY: number, angle: number, strain: number): void {
    if (!this.gripG) return;
    const g = this.gripG;
    g.clear();

    const playerGlove = hex(this.playerPalette.glove);
    const opponentGlove = hex(this.opponentPalette.glove);
    const playerSkin = hex(this.playerPalette.skinTone);
    const opponentSkin = hex(this.opponentPalette.skinTone);

    const gripR = 18 + strain * 4;

    // Pressure aura
    const glowAlpha = 0.08 + strain * 0.2;
    g.circle(handX, handY, gripR + 12).fill({ color: 0xd4af6a, alpha: glowAlpha * 0.3 });
    g.circle(handX, handY, gripR + 6).fill({ color: 0x5ec8ff, alpha: glowAlpha * 0.4 });

    // Player hand (gloved fist from left)
    g.circle(handX - 6, handY + 1, gripR * 0.85).fill(playerGlove);
    g.circle(handX - 6, handY - 2, gripR * 0.55).fill({ color: playerSkin, alpha: 0.35 });
    for (let i = 0; i < 4; i++) {
      g.circle(handX - 3 + i * 4.5, handY + gripR * 0.55, 3.8).fill({ color: playerSkin, alpha: 0.5 });
    }
    g.circle(handX - 12, handY - gripR * 0.3, 4.5).fill(playerGlove);

    // Opponent hand (mechanical clamp from right)
    g.circle(handX + 6, handY - 1, gripR * 0.82).fill(opponentGlove);
    g.circle(handX + 6, handY - 4, gripR * 0.5).fill({ color: opponentSkin, alpha: 0.3 });
    for (let i = 0; i < 4; i++) {
      g.circle(handX + 3 - i * 4.5, handY - gripR * 0.55, 3.5).fill({ color: 0x6a7a8a, alpha: 0.6 });
    }
    g.circle(handX + 12, handY + gripR * 0.25, 4).fill(opponentGlove);

    // Tension ring
    g.circle(handX, handY, gripR + 2).stroke({ width: 2, color: 0xf0d9a0, alpha: glowAlpha });

    // Strain sparks
    if (strain > 0.4 && !this.reducedMotion) {
      const t = performance.now() / 150;
      const sparkCount = Math.floor(strain * 5);
      for (let i = 0; i < sparkCount; i++) {
        const a = t + i * 1.8;
        const dist = gripR + 4 + Math.sin(a * 2.3) * 6;
        const sx = handX + Math.cos(a) * dist;
        const sy = handY + Math.sin(a) * dist;
        g.circle(sx, sy, 1.5 + Math.random()).fill({ color: 0xf0d9a0, alpha: 0.4 + Math.random() * 0.3 });
      }
    }
  }

  // === UPDATE LOOP ===
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
        this.slamFlash = 1;
        this.onComplete?.();
        this.paused = true;
        return;
      }
    }
    if (active) {
      const u = Math.min(1, Math.max(0, (elapsedMs - active.startMs) / active.durationMs));
      const ease = this.reducedMotion ? u : easeInOut(u);
      this.playerStr = Math.round(
        active.playerStrengthBefore + (active.playerStrengthAfter - active.playerStrengthBefore) * ease,
      );
      this.opponentStr = Math.round(
        active.opponentStrengthBefore + (active.opponentStrengthAfter - active.opponentStrengthBefore) * ease,
      );
      this.onStrength?.(this.playerStr, this.opponentStr);

      if (active.animationCue !== this.cue) {
        this.cue = active.animationCue;
        this.onEvent?.(active);
        if (active.vfxCue.includes('critical') || active.vfxCue.includes('heavy')) {
          this.flashIntensity = 0.6;
          this.spawnBurst(12, active.vfxCue.includes('critical') ? 0x5ec8ff : 0xd4af6a);
        }
        if (active.vfxCue.includes('final') || active.animationCue === 'winning_slam') {
          this.slamFlash = 1;
          this.spawnBurst(24, 0xffffff);
        }
        if (active.animationCue === 'recovery') {
          this.recoveryGlow = 1;
          this.spawnBurst(8, 0x3ecf8e);
        }
      }

      const diff = (this.opponentStr - this.playerStr) / 100;
      if (Math.abs(diff - this.prevDiff) > 0.04) {
        this.momentumDir = diff > this.prevDiff ? 1 : -1;
        if (!this.reducedMotion) this.spawnBurst(4, 0xf0d9a0);
      }
      this.prevDiff = diff;

      this.targetGripAngle = diff * 0.55;
      this.shake = this.reducedMotion ? 0 : active.intensity > 7000 ? 2.0 : active.intensity > 4000 ? 0.9 : 0.2;

      if (!this.muted && active.soundCue && active.soundCue !== 'none') {
        this.playCue(active.soundCue, active.intensity);
      }
    }

    this.gripAngle += (this.targetGripAngle - this.gripAngle) * 0.12;
    this.strainPhase += 0.05;
    this.ambientPhase += 0.02;
    this.flashIntensity *= 0.92;
    this.slamFlash *= 0.94;
    this.recoveryGlow *= 0.96;

    this.updateParticles();
    this.drawArms();
    this.drawVfxOverlay();
  }

  // === PARTICLE SYSTEM ===
  private spawnBurst(count: number, color: number): void {
    if (this.reducedMotion) return;
    const s = this.scene;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x: s.gripCenterX + (Math.random() - 0.5) * 30,
        y: s.gripCenterY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.6,
        size: 2 + Math.random() * 3,
        color,
        alpha: 0.6 + Math.random() * 0.4,
      });
    }
    if (this.particles.length > 80) {
      this.particles = this.particles.slice(-60);
    }
  }

  private updateParticles(): void {
    if (!this.particlesG) return;
    const g = this.particlesG;
    g.clear();
    if (this.reducedMotion) {
      this.particles = [];
      return;
    }
    // Ambient pressure particles
    if (this.cue !== 'idle' && this.cue !== 'intro' && Math.random() < 0.3) {
      const s = this.scene;
      this.particles.push({
        x: s.gripCenterX + (Math.random() - 0.5) * 40,
        y: s.gripCenterY + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.5 - Math.random() * 0.8,
        life: 1,
        maxLife: 0.8 + Math.random() * 0.5,
        size: 1.5 + Math.random() * 2,
        color: 0x8a7a60,
        alpha: 0.3 + Math.random() * 0.3,
      });
    }

    const dt = 1 / 60;
    this.particles = this.particles.filter((p) => {
      p.life -= dt / p.maxLife;
      if (p.life <= 0) return false;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      const a = p.alpha * p.life;
      g.circle(p.x, p.y, p.size * p.life).fill({ color: p.color, alpha: a });
      return true;
    });
  }

  // === VFX OVERLAY ===
  private drawVfxOverlay(): void {
    if (!this.vfxG || !this.overlayG || !this.app) return;
    const vfx = this.vfxG;
    const overlay = this.overlayG;
    vfx.clear();
    overlay.clear();
    if (this.reducedMotion) return;

    const s = this.scene;

    if (this.flashIntensity > 0.05) {
      vfx.ellipse(s.gripCenterX, s.gripCenterY, s.tableW * 0.18, 40).fill({
        color: 0xffffff, alpha: this.flashIntensity * 0.12,
      });
    }

    if (this.slamFlash > 0.1) {
      overlay.rect(0, 0, s.w, s.h).fill({ color: 0xffffff, alpha: this.slamFlash * 0.08 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + this.strainPhase;
        const len = 40 + this.slamFlash * 60;
        vfx.moveTo(s.gripCenterX, s.gripCenterY)
          .lineTo(s.gripCenterX + Math.cos(a) * len, s.gripCenterY + Math.sin(a) * len)
          .stroke({ width: 3, color: 0xd4af6a, alpha: this.slamFlash * 0.3 });
      }
    }

    if (this.recoveryGlow > 0.1) {
      vfx.circle(s.playerElbowX, s.elbowY - s.forearmLen * 0.4, 50).fill({
        color: 0x3ecf8e, alpha: this.recoveryGlow * 0.1,
      });
    }

    if (Math.abs(this.momentumDir) > 0 && this.shake > 0.5) {
      const dir = this.momentumDir;
      for (let i = 0; i < 3; i++) {
        const y = s.gripCenterY - 20 + i * 20;
        const x = s.gripCenterX + dir * (20 + i * 15);
        vfx.moveTo(x, y).lineTo(x + dir * 25, y).stroke({ width: 2, color: 0xf0d9a0, alpha: 0.2 });
      }
    }

    const hazeAlpha = 0.015 + Math.sin(this.ambientPhase) * 0.005;
    overlay.ellipse(s.cx, s.tableY - s.h * 0.15, s.w * 0.4, s.h * 0.12).fill({ color: 0xd4af6a, alpha: hazeAlpha });
  }

  // === AUDIO ===
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
      const base = cue.includes('critical') || cue.includes('final') ? 120
        : cue.includes('impact') ? 90
        : cue === 'victory' ? 440
        : cue === 'defeat' ? 70
        : 160;
      osc.frequency.value = base + intensity / 100;
      gain.gain.value = 0.025;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Autoplay policy
    }
  }
}
