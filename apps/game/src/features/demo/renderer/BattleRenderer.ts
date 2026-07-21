/**
 * PixiJS Phase 3.3 battle renderer — vertical arm-wrestling rig.
 * Elbows planted on pads, forearms rise to a central grip that rotates
 * toward pin pads. Arena with crowd, spotlights, and impact VFX.
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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t * t * (3 - 2 * t);
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
    crowd: Container;
    table: Container;
    playerArm: Container;
    opponentArm: Container;
    grip: Container;
    tableFront: Container;
    particles: Container;
    vfx: Container;
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
  private cue = 'idle';
  private shake = 0;
  private playerName: string;
  private opponentName: string;
  private playerPresetKey: string;
  private lastSoundAt = 0;
  private audioCtx: AudioContext | null = null;
  private completed = false;
  /** Grip angle: 0 = neutral, negative = player winning (pushing right), positive = opponent winning */
  private gripAngle = 0;
  private targetGripAngle = 0;
  private strainPhase = 0;

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
      background: '#050810',
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    this.app = app;
    this.host.replaceChildren(app.canvas as HTMLCanvasElement);
    (app.canvas as HTMLCanvasElement).setAttribute('role', 'img');
    (app.canvas as HTMLCanvasElement).setAttribute(
      'aria-label',
      'Armz Clash demo battle — arm wrestling animation',
    );

    const root = new Container();
    app.stage.addChild(root);
    this.layers = {
      bg: new Container(),
      crowd: new Container(),
      table: new Container(),
      playerArm: new Container(),
      opponentArm: new Container(),
      grip: new Container(),
      tableFront: new Container(),
      particles: new Container(),
      vfx: new Container(),
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

    this.layers.bg.addChild(this.bgG);
    this.layers.crowd.addChild(this.crowdG);
    this.layers.table.addChild(this.tableG);
    this.layers.playerArm.addChild(this.playerG);
    this.layers.opponentArm.addChild(this.opponentG);
    this.layers.grip.addChild(this.gripG);
    this.layers.tableFront.addChild(this.tableFrontG);
    this.layers.particles.addChild(this.particlesG);
    this.layers.vfx.addChild(this.vfxG);

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
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    this.host.replaceChildren();
  }

  // ─── SCENE GEOMETRY ───────────────────────────────────────────────────────────

  private get scene() {
    const w = this.app!.screen.width;
    const h = this.app!.screen.height;
    const cx = w / 2;
    const tableY = h * 0.68;
    const tableW = Math.min(w * 0.72, 620);
    const tableH = h * 0.09;
    const elbowPadW = tableW * 0.14;
    const elbowPadH = tableH * 0.35;
    const playerElbowX = cx - tableW * 0.32;
    const opponentElbowX = cx + tableW * 0.32;
    const elbowY = tableY - tableH * 0.15;
    const forearmLen = Math.min(h * 0.28, 180);
    const gripCenterX = cx;
    const gripCenterY = elbowY - forearmLen * 0.82;
    const pinPadW = tableW * 0.1;
    const pinPadH = tableH * 0.5;
    const playerPinX = cx - tableW * 0.44;
    const opponentPinX = cx + tableW * 0.44;
    const shoulderY = elbowY + h * 0.06;
    return {
      w, h, cx, tableY, tableW, tableH, elbowPadW, elbowPadH,
      playerElbowX, opponentElbowX, elbowY, forearmLen,
      gripCenterX, gripCenterY, pinPadW, pinPadH,
      playerPinX, opponentPinX, shoulderY,
    };
  }

  // ─── STATIC SCENE ─────────────────────────────────────────────────────────────

  private drawStaticScene(): void {
    if (!this.app) return;
    const { w, h, cx, tableY, tableW, tableH, elbowPadW, elbowPadH, playerElbowX, opponentElbowX, elbowY, playerPinX, opponentPinX, pinPadW, pinPadH } = this.scene;

    // Background — deep arena
    const bg = this.bgG!;
    bg.clear();
    bg.rect(0, 0, w, h).fill(0x050810);
    // Arena walls
    bg.rect(0, 0, w, h * 0.45).fill({ color: 0x0a0f1a, alpha: 1 });
    // Vertical pillars
    for (let i = 0; i < 8; i++) {
      const px = (w * (i + 0.5)) / 8;
      bg.roundRect(px - 6, 0, 12, h * 0.5, 3).fill({ color: 0x141c2c, alpha: 0.6 });
    }
    // Arena banners
    bg.roundRect(w * 0.08, h * 0.04, w * 0.06, h * 0.22, 4).fill({ color: 0x1a2438, alpha: 0.7 });
    bg.roundRect(w * 0.86, h * 0.04, w * 0.06, h * 0.22, 4).fill({ color: 0x1a2438, alpha: 0.7 });
    bg.roundRect(w * 0.1, h * 0.06, w * 0.02, h * 0.18, 2).fill({ color: 0xd4af6a, alpha: 0.15 });
    bg.roundRect(w * 0.88, h * 0.06, w * 0.02, h * 0.18, 2).fill({ color: 0x5ec8ff, alpha: 0.15 });
    // Spotlight cones
    bg.moveTo(cx - w * 0.18, 0).lineTo(cx + w * 0.18, 0).lineTo(cx + w * 0.32, tableY).lineTo(cx - w * 0.32, tableY).fill({ color: 0xffffff, alpha: 0.025 });
    bg.ellipse(cx, tableY - h * 0.1, w * 0.35, h * 0.12).fill({ color: 0xd4af6a, alpha: 0.06 });
    bg.ellipse(cx, h * 0.15, w * 0.25, h * 0.1).fill({ color: 0x5ec8ff, alpha: 0.04 });
    // Floor
    bg.rect(0, tableY + tableH, w, h - tableY - tableH).fill(0x080c14);
    bg.rect(0, tableY + tableH, w, 2).fill({ color: 0xd4af6a, alpha: 0.12 });

    // Crowd silhouettes
    const crowd = this.crowdG!;
    crowd.clear();
    for (let i = 0; i < 28; i++) {
      const cxp = (w * (i + 0.5)) / 28 + (Math.sin(i * 3.7) * 8);
      const cyp = h * 0.32 + Math.sin(i * 2.3) * 12 + (i % 3) * 8;
      const r = 8 + (i % 4) * 2;
      crowd.circle(cxp, cyp, r).fill({ color: 0x0e1420, alpha: 0.85 });
      crowd.roundRect(cxp - r * 0.7, cyp + r * 0.6, r * 1.4, r * 1.8, 3).fill({ color: 0x0c1018, alpha: 0.8 });
    }
    // Second row
    for (let i = 0; i < 20; i++) {
      const cxp = (w * (i + 0.5)) / 20 + (Math.cos(i * 4.1) * 6);
      const cyp = h * 0.24 + Math.sin(i * 1.9) * 8;
      const r = 6 + (i % 3) * 2;
      crowd.circle(cxp, cyp, r).fill({ color: 0x0a0e16, alpha: 0.7 });
    }

    // Table
    const tbl = this.tableG!;
    tbl.clear();
    // Table shadow
    tbl.ellipse(cx, tableY + tableH + 12, tableW * 0.52, 14).fill({ color: 0x000000, alpha: 0.5 });
    // Table body — thick championship slab
    tbl.roundRect(cx - tableW / 2, tableY, tableW, tableH, 8).fill(0x1c1812);
    tbl.roundRect(cx - tableW / 2 + 4, tableY + 3, tableW - 8, tableH - 6, 6).fill(0x2a2318);
    tbl.roundRect(cx - tableW / 2 + 8, tableY + 6, tableW - 16, tableH * 0.3, 4).fill(0x3d3428);
    // Gold inlay line
    tbl.roundRect(cx - tableW * 0.38, tableY + tableH * 0.45, tableW * 0.76, 3, 1.5).fill({ color: 0xd4af6a, alpha: 0.5 });
    // Edge highlight
    tbl.moveTo(cx - tableW / 2 + 6, tableY + 2).lineTo(cx + tableW / 2 - 6, tableY + 2).stroke({ width: 1.5, color: 0x6b5a40, alpha: 0.7 });
    // Elbow pads
    tbl.roundRect(playerElbowX - elbowPadW / 2, elbowY - elbowPadH / 2, elbowPadW, elbowPadH, 4).fill({ color: 0x2a3a4a, alpha: 0.9 });
    tbl.roundRect(playerElbowX - elbowPadW / 2 + 2, elbowY - elbowPadH / 2 + 2, elbowPadW - 4, elbowPadH - 4, 3).fill({ color: 0x3a4a5a, alpha: 0.6 });
    tbl.roundRect(opponentElbowX - elbowPadW / 2, elbowY - elbowPadH / 2, elbowPadW, elbowPadH, 4).fill({ color: 0x4a3a2a, alpha: 0.9 });
    tbl.roundRect(opponentElbowX - elbowPadW / 2 + 2, elbowY - elbowPadH / 2 + 2, elbowPadW - 4, elbowPadH - 4, 3).fill({ color: 0x5a4a3a, alpha: 0.6 });
    // Pin pads (where hands get slammed)
    tbl.roundRect(playerPinX - pinPadW / 2, tableY - pinPadH, pinPadW, pinPadH, 3).fill({ color: 0x5ec8ff, alpha: 0.2 });
    tbl.roundRect(opponentPinX - pinPadW / 2, tableY - pinPadH, pinPadW, pinPadH, 3).fill({ color: 0xd4af6a, alpha: 0.2 });

    // Table front edge (drawn over arms)
    const tf = this.tableFrontG!;
    tf.clear();
    tf.roundRect(cx - tableW / 2, tableY + tableH - 4, tableW, 8, 3).fill(0x1a1510);
    tf.roundRect(cx - tableW / 2 + 2, tableY + tableH - 2, tableW - 4, 3, 1.5).fill({ color: 0xd4af6a, alpha: 0.2 });
  }

  // ─── ARM DRAWING ──────────────────────────────────────────────────────────────

  private drawArms(): void {
    if (!this.app || !this.playerG || !this.opponentG || !this.gripG) return;
    const s = this.scene;
    const shakeX = this.reducedMotion ? 0 : this.shake * (Math.random() - 0.5) * 4;

    // Grip angle determines hand position
    // angle range: -0.55 (player winning, hand toward opponent pin) to +0.55 (opponent winning)
    const angle = this.gripAngle;
    const strain = Math.abs(angle) / 0.55;

    // Grip hand position (rotates around a pivot above the table center)
    const pivotX = s.cx + shakeX;
    const pivotY = s.elbowY;
    const handDist = s.forearmLen * 0.85;
    const handX = pivotX + Math.sin(angle) * handDist * 0.6;
    const handY = pivotY - handDist + Math.abs(angle) * handDist * 0.15;

    this.drawFighterArm(this.playerG, {
      elbowX: s.playerElbowX + shakeX,
      elbowY: s.elbowY,
      handX,
      handY,
      shoulderX: s.playerElbowX - s.tableW * 0.18 + shakeX,
      shoulderY: s.shoulderY,
      palette: this.playerPalette,
      side: 'player',
      strain,
      mechanical: false,
    });

    this.drawFighterArm(this.opponentG, {
      elbowX: s.opponentElbowX + shakeX,
      elbowY: s.elbowY,
      handX,
      handY,
      shoulderX: s.opponentElbowX + s.tableW * 0.18 + shakeX,
      shoulderY: s.shoulderY,
      palette: this.opponentPalette,
      side: 'opponent',
      strain,
      mechanical: true,
    });

    // Grip — interlocked hands at center
    this.drawGrip(handX, handY, angle, strain);
  }

  private drawFighterArm(
    g: Graphics,
    opts: {
      elbowX: number;
      elbowY: number;
      handX: number;
      handY: number;
      shoulderX: number;
      shoulderY: number;
      palette: FighterPalette;
      side: 'player' | 'opponent';
      strain: number;
      mechanical: boolean;
    },
  ): void {
    g.clear();
    const skin = hex(opts.palette.skinTone);
    const cloth = hex(opts.palette.primaryCloth);
    const accent = hex(opts.palette.accent);
    const glove = hex(opts.palette.glove);

    const { elbowX, elbowY, handX, handY, shoulderX, shoulderY } = opts;

    // Midpoint for forearm curve
    const midX = (elbowX + handX) / 2 + (opts.side === 'player' ? -8 : 8);
    const midY = (elbowY + handY) / 2;

    // Upper arm: shoulder → elbow (thick, slightly curved)
    const uaMidX = (shoulderX + elbowX) / 2;
    const uaMidY = (shoulderY + elbowY) / 2 - 6;

    // Shadow
    g.moveTo(shoulderX + 3, shoulderY + 5)
      .quadraticCurveTo(uaMidX + 3, uaMidY + 5, elbowX + 3, elbowY + 4)
      .stroke({ width: 30, color: 0x000000, alpha: 0.3, cap: 'round' });

    // Upper arm mass
    g.moveTo(shoulderX, shoulderY)
      .quadraticCurveTo(uaMidX, uaMidY, elbowX, elbowY)
      .stroke({ width: 28, color: skin, cap: 'round' });
    // Muscle highlight
    g.moveTo(shoulderX, shoulderY - 5)
      .quadraticCurveTo(uaMidX, uaMidY - 5, elbowX, elbowY - 4)
      .stroke({ width: 10, color: 0xffffff, alpha: 0.1, cap: 'round' });

    // Shoulder cap
    g.circle(shoulderX, shoulderY, 18).fill(skin);
    g.circle(shoulderX, shoulderY - 4, 12).fill({ color: cloth, alpha: 0.7 });

    // Elbow joint
    g.circle(elbowX, elbowY, 14).fill(skin);
    g.circle(elbowX, elbowY, 10).fill({ color: cloth, alpha: 0.5 });

    // Forearm: elbow → hand (the main visible arm-wrestling segment)
    const forearmW = 22 + opts.strain * 4; // bulge under strain
    g.moveTo(elbowX, elbowY)
      .quadraticCurveTo(midX, midY, handX, handY)
      .stroke({ width: forearmW, color: skin, cap: 'round' });
    // Forearm highlight
    g.moveTo(elbowX - 2, elbowY - 3)
      .quadraticCurveTo(midX - 2, midY - 3, handX, handY - 2)
      .stroke({ width: 7, color: 0xffffff, alpha: 0.08, cap: 'round' });

    // Wrist wrap / bracer
    const wristX = lerp(elbowX, handX, 0.75);
    const wristY = lerp(elbowY, handY, 0.75);
    if (opts.mechanical) {
      // Mechanical joint plates
      g.roundRect(wristX - 12, wristY - 8, 24, 16, 3).fill(cloth);
      g.roundRect(wristX - 8, wristY - 3, 16, 6, 2).fill(accent);
      // Hydraulic lines on forearm
      g.moveTo(elbowX + 4, elbowY - 4)
        .quadraticCurveTo(midX + 6, midY - 4, wristX + 4, wristY - 2)
        .stroke({ width: 3, color: accent, alpha: 0.6, cap: 'round' });
      g.moveTo(elbowX - 4, elbowY + 2)
        .quadraticCurveTo(midX - 6, midY + 2, wristX - 4, wristY + 2)
        .stroke({ width: 2, color: accent, alpha: 0.4, cap: 'round' });
    } else {
      // Leather wraps
      g.roundRect(wristX - 11, wristY - 7, 22, 14, 4).fill(cloth);
      g.moveTo(wristX - 8, wristY - 2).lineTo(wristX + 8, wristY + 2).stroke({ width: 3, color: accent, alpha: 0.7, cap: 'round' });
      g.moveTo(wristX - 6, wristY + 3).lineTo(wristX + 6, wristY + 5).stroke({ width: 2, color: accent, alpha: 0.5, cap: 'round' });
    }

    // Elbow pad contact glow
    g.circle(elbowX, elbowY, 16).stroke({ width: 2, color: accent, alpha: 0.2 + opts.strain * 0.3 });
  }

  private drawGrip(handX: number, handY: number, angle: number, strain: number): void {
    if (!this.gripG) return;
    const g = this.gripG;
    g.clear();

    const playerGlove = hex(this.playerPalette.glove);
    const opponentGlove = hex(this.opponentPalette.glove);
    const playerSkin = hex(this.playerPalette.skinTone);
    const opponentSkin = hex(this.opponentPalette.skinTone);

    // Interlocked grip — two hands clasped together
    const gripR = 16 + strain * 3;

    // Player hand (from left)
    g.circle(handX - 5, handY, gripR * 0.85).fill(playerGlove);
    g.circle(handX - 5, handY - 3, gripR * 0.5).fill({ color: playerSkin, alpha: 0.4 });
    // Fingers wrapping
    for (let i = 0; i < 4; i++) {
      g.circle(handX - 2 + i * 4, handY + gripR * 0.5 - 2, 3.5).fill({ color: playerSkin, alpha: 0.5 });
    }

    // Opponent hand (from right)
    g.circle(handX + 5, handY - 2, gripR * 0.8).fill(opponentGlove);
    g.circle(handX + 5, handY - 5, gripR * 0.45).fill({ color: opponentSkin, alpha: 0.3 });
    // Fingers
    for (let i = 0; i < 4; i++) {
      g.circle(handX + 2 - i * 4, handY - gripR * 0.5, 3.2).fill({ color: opponentSkin, alpha: 0.45 });
    }

    // Grip tension glow
    const glowAlpha = 0.1 + strain * 0.25;
    g.circle(handX, handY, gripR + 6).fill({ color: 0x5ec8ff, alpha: glowAlpha * 0.5 });
    g.circle(handX, handY, gripR + 2).stroke({ width: 2, color: 0xf0d9a0, alpha: glowAlpha });

    // Strain veins / tension lines under high strain
    if (strain > 0.5 && !this.reducedMotion) {
      const t = performance.now() / 200;
      for (let i = 0; i < 3; i++) {
        const a = t + i * 2.1;
        g.moveTo(handX + Math.cos(a) * gripR, handY + Math.sin(a) * gripR)
          .lineTo(handX + Math.cos(a) * (gripR + 8), handY + Math.sin(a) * (gripR + 8))
          .stroke({ width: 1.5, color: 0xf0d9a0, alpha: 0.3 });
      }
    }
  }

  // ─── UPDATE LOOP ──────────────────────────────────────────────────────────────

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
      }

      // Compute target grip angle from strength differential
      // Player winning (higher str) → negative angle (hand moves toward opponent pin/right)
      const diff = (this.opponentStr - this.playerStr) / 100;
      this.targetGripAngle = diff * 0.55;

      // Shake based on intensity
      this.shake = this.reducedMotion ? 0 : active.intensity > 7000 ? 1.6 : active.intensity > 4000 ? 0.7 : 0.15;

      if (!this.muted && active.soundCue && active.soundCue !== 'none') {
        this.playCue(active.soundCue, active.intensity);
      }
      this.drawParticles(active);
      this.drawImpactFlash(active);
    }

    // Smooth grip angle interpolation
    this.gripAngle += (this.targetGripAngle - this.gripAngle) * 0.12;
    this.strainPhase += 0.05;

    this.drawArms();
  }

  // ─── AUDIO ────────────────────────────────────────────────────────────────────

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

  // ─── VFX ──────────────────────────────────────────────────────────────────────

  private drawParticles(ev: TimelineEvent): void {
    if (!this.particlesG || !this.app || this.reducedMotion) {
      this.particlesG?.clear();
      return;
    }
    const g = this.particlesG;
    g.clear();
    if (ev.vfxCue === 'none') return;
    const s = this.scene;
    const n = ev.vfxCue.includes('heavy') || ev.vfxCue.includes('final') ? 20 : 10;
    for (let i = 0; i < n; i++) {
      const x = s.cx + (Math.random() - 0.5) * s.tableW * 0.4;
      const y = s.gripCenterY + (Math.random() - 0.5) * 40;
      const color = ev.vfxCue.includes('critical') ? 0x5ec8ff
        : ev.vfxCue.includes('victory') ? 0xd4af6a
        : 0x8a7a60;
      g.circle(x, y, 2 + Math.random() * 3.5).fill({ color, alpha: 0.4 + Math.random() * 0.5 });
    }
  }

  private drawImpactFlash(ev: TimelineEvent): void {
    if (!this.vfxG || !this.app) return;
    this.vfxG.clear();
    if (this.reducedMotion) return;
    if (!(ev.intensity > 5500 || ev.vfxCue.includes('heavy') || ev.vfxCue.includes('critical'))) return;
    const s = this.scene;
    this.vfxG.ellipse(s.cx, s.gripCenterY, s.tableW * 0.15, 30).fill({
      color: 0xffffff,
      alpha: 0.05 + (ev.intensity / 100000) * 0.08,
    });
  }
}