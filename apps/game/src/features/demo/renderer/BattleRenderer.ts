/**
 * PixiJS Phase 3.3B battle renderer - textured sprite rigs + cinematic VFX.
 *
 * Replaces procedural Graphics fighter anatomy with SpriteRig layers loaded
 * from the Qwen-authored SVG asset pipeline. PixiJS Graphics are retained ONLY
 * for particles, lighting cones, haze, impact rings, debug geometry, control
 * bars, and loading indicators.
 *
 * Camera system: responsive presets (desktop/tablet/mobile), dynamic zoom on
 * critical push, shake on slam, pull-back for result.
 */

import { Application, Container, Graphics, Sprite } from 'pixi.js';
import {
  PHASE3_4_ARENA_VIEWPORT_FOCUS,
  PHASE3_4_BATTLE_RIGS,
  getPremiumAssetSlot,
  layoutFocalCover,
  quadraticPinArc,
  selectPhase34BattlePoseId,
  validatePhase34RigFrame,
  type Phase34BattlePose,
  type ViewportClass,
} from '@armz-clash/game-core';
import { SpriteRig } from './SpriteRig';
import { PremiumLayeredRig } from './PremiumLayeredRig';
import { BattleAudio, type AudioCue } from './BattleAudio';
import {
  preloadBattleAssets,
  classifyViewport,
  fighterIdForPreset,
  fighterIdForOpponent,
  type BattleAssetBundle,
} from './battleAssets';
import { computeGripPoint } from './rigSolver';
import {
  Phase34PoseController,
  authoritativeFinalPoseId,
  phase34SidePoseToRigInput,
} from './phase34PoseRuntime';
import {
  createDirectionalVfxPlan,
  momentumDirection,
  type BattleDirection,
  type DirectionalVfxPlan,
} from './directionalVfx';

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
  opponentKey?: string;
  reducedMotion?: boolean;
  muted?: boolean;
  sfxEnabled?: boolean;
  musicEnabled?: boolean;
  onComplete?: () => void;
  onEvent?: (ev: TimelineEvent) => void;
  onStrength?: (player: number, opponent: number) => void;
  onAssetMode?: (mode: 'premium-layered' | 'legacy-fallback') => void;
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
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
};

type EffectSprite = {
  sprite: Sprite;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  growRate: number;
  baseAlpha: number;
};

const EFFECT_RUNTIME_IDS: Record<string, string> = {
  'effects/grip-lock': 'effects/grip-flash',
  'effects/push-streak': 'effects/momentum-streak',
  'effects/counter-burst': 'effects/pressure-ring',
  'effects/critical-impact': 'effects/critical-impact',
  'effects/recovery-cue': 'effects/recovery-glow',
  'effects/final-slam': 'effects/slam-impact',
  'effects/victory-sweep': 'effects/victory-accent',
  'effects/defeat-dim': 'effects/defeat-accent',
};

const CAMERA_PRESETS: Record<
  ViewportClass,
  { baseZoom: number; focusY: number; criticalZoom: number }
> = {
  desktop: { baseZoom: 1.08, focusY: 0.55, criticalZoom: 1.2 },
  tablet: { baseZoom: 1.02, focusY: 0.53, criticalZoom: 1.14 },
  mobile: { baseZoom: 0.96, focusY: 0.5, criticalZoom: 1.06 },
};

export class BattleRenderer {
  private app: Application | null = null;
  private host: HTMLElement;
  private timeline: TimelineEvent[];
  private playerPalette: FighterPalette;
  private opponentPalette: FighterPalette;
  private reducedMotion: boolean;
  private muted: boolean;
  private sfxEnabled: boolean;
  private musicEnabled: boolean;
  private onComplete?: () => void;
  private onEvent?: (ev: TimelineEvent) => void;
  private onStrength?: (player: number, opponent: number) => void;
  private onAssetMode?: (mode: 'premium-layered' | 'legacy-fallback') => void;
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
    overlay: Container;
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
  private loadingG: Graphics | null = null;
  private cue = 'idle';
  private shake = 0;
  private playerName: string;
  private opponentName: string;
  private playerPresetKey: string;
  private opponentKey: string;
  private completed = false;
  private gripAngle = 0;
  private targetGripAngle = 0;
  private strainPhase = 0;
  private particles: Particle[] = [];
  private flashIntensity = 0;
  private slamFlash = 0;
  private momentumDir: BattleDirection = 0;
  private prevDiff = 0;
  private recoveryGlow = 0;
  private ambientPhase = 0;
  private assetBundle: BattleAssetBundle | null = null;
  private playerRig: SpriteRig | PremiumLayeredRig | null = null;
  private opponentRig: SpriteRig | PremiumLayeredRig | null = null;
  private usePremiumLayeredRigs = false;
  private arenaSprites: Sprite[] = [];
  private effectSprites: EffectSprite[] = [];
  private audio: BattleAudio;
  private cameraZoom = 1;
  private targetCameraZoom = 1;
  private cameraShakeX = 0;
  private cameraShakeY = 0;
  private viewport: ViewportClass = 'desktop';
  private playerFighterId: string | null = null;
  private opponentFighterId: string | null = null;
  private useSpriteRigs = false;
  private prevCueForAudio = '';
  private rootContainer: Container | null = null;
  private poseController = new Phase34PoseController();
  private currentElapsedMs = 0;
  private finalOutcome: 'victory' | 'defeat' | null = null;
  private pinArcStart: { x: number; y: number } | null = null;
  private pinArcProgress = 0;
  private lastLayoutWidth = 0;
  private lastLayoutHeight = 0;
  private rigDiagnosticWarned = false;
  private activeEventIndex = -1;

  constructor(opts: BattleRendererOptions) {
    this.host = opts.host;
    this.timeline = opts.timeline;
    this.playerPalette = opts.playerPalette;
    this.opponentPalette = opts.opponentPalette;
    this.reducedMotion = Boolean(opts.reducedMotion);
    this.muted = Boolean(opts.muted);
    this.sfxEnabled = opts.sfxEnabled ?? !opts.muted;
    this.musicEnabled = opts.musicEnabled ?? false;
    this.onComplete = opts.onComplete;
    this.onEvent = opts.onEvent;
    this.onStrength = opts.onStrength;
    this.onAssetMode = opts.onAssetMode;
    this.playerName = opts.playerName;
    this.opponentName = opts.opponentName;
    this.playerPresetKey = opts.playerPresetKey ?? 'rookie_brawler';
    this.opponentKey = opts.opponentKey ?? 'practice_automaton';
    this.audio = new BattleAudio();
    this.playerFighterId = fighterIdForPreset(this.playerPresetKey);
    this.opponentFighterId = fighterIdForOpponent(this.opponentKey);
    this.useSpriteRigs = Boolean(this.playerFighterId && this.opponentFighterId);
  }

  async mount(): Promise<void> {
    if (this.destroyed) return;
    this.viewport = classifyViewport(this.host.clientWidth || 1280, this.host.clientHeight || 720);
    const app = new Application();
    await app.init({
      resizeTo: this.host,
      background: '#04070d',
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    if (this.destroyed) {
      app.destroy(true, { children: true });
      return;
    }
    this.app = app;
    this.host.replaceChildren(app.canvas as HTMLCanvasElement);
    (app.canvas as HTMLCanvasElement).setAttribute('role', 'img');
    (app.canvas as HTMLCanvasElement).setAttribute(
      'aria-label',
      `Armz Clash demo battle \\u2014 ${this.playerName} vs ${this.opponentName} arm wrestling animation`,
    );

    const root = new Container();
    this.rootContainer = root;
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
      overlay: new Container(),
    };
    Object.values(this.layers).forEach((c) => root.addChild(c));
    this.layers.vfx.sortableChildren = true;

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
    this.loadingG = new Graphics();

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
    this.layers.overlay.addChild(this.loadingG);

    this.drawStaticScene();

    if (this.useSpriteRigs) {
      this.drawLoadingIndicator(true);
      try {
        const bundle = await preloadBattleAssets(
          this.playerFighterId,
          this.opponentFighterId,
          this.viewport,
        );
        if (this.destroyed) return;
        this.assetBundle = bundle;
        this.buildArenaSprites();
        this.buildFighterRigs();
      } catch {
        if (this.destroyed) return;
        this.useSpriteRigs = false;
        this.assetBundle = null;
        this.onAssetMode?.('legacy-fallback');
      }
      this.drawLoadingIndicator(false);
    }

    this.audio.init();
    this.audio.setSfxEnabled(this.sfxEnabled && !this.muted);
    this.audio.setMusicEnabled(this.musicEnabled);

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
    this.audio.setSfxEnabled(!muted && this.sfxEnabled);
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    this.audio.setSfxEnabled(enabled && !this.muted);
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    this.audio.setMusicEnabled(enabled);
  }

  setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled;
    if (enabled) {
      this.shake = 0;
      this.cameraShakeX = 0;
      this.cameraShakeY = 0;
      this.particles = [];
    }
  }

  /** Apply the authoritative terminal pin before React mounts the result overlay. */
  applyAuthoritativeFinalPose(
    outcome: 'victory' | 'defeat',
    playerFinalStrength: number,
    opponentFinalStrength: number,
  ): void {
    this.playerStr = playerFinalStrength;
    this.opponentStr = opponentFinalStrength;
    this.finalOutcome = outcome;
    this.pinArcProgress = 1;
    const scene = this.app ? this.scene : null;
    this.pinArcStart = scene ? { x: scene.gripCenterX, y: scene.gripCenterY } : null;
    this.poseController.force(authoritativeFinalPoseId(outcome), this.currentElapsedMs);
    if (this.app) {
      this.drawArms();
      this.drawVfxOverlay();
    }
    this.pause();
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.audio.destroy();
    this.playerRig?.destroy();
    this.playerRig = null;
    this.opponentRig?.destroy();
    this.opponentRig = null;
    for (const s of this.arenaSprites) s.destroy({ texture: false, textureSource: false });
    this.arenaSprites = [];
    for (const e of this.effectSprites) e.sprite.destroy({ texture: false, textureSource: false });
    this.effectSprites = [];
    this.particles = [];
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    this.onComplete = undefined;
    this.onEvent = undefined;
    this.onStrength = undefined;
    this.onAssetMode = undefined;
    this.host.replaceChildren();
  }

  private get scene() {
    const w = this.app!.screen.width;
    const h = this.app!.screen.height;
    const cx = w / 2;
    const tableY = h * 0.76;
    const tableW = Math.min(w * 0.86, 1120);
    const tableH = Math.max(48, h * 0.105);
    const elbowPadW = tableW * 0.13;
    const elbowPadH = tableH * 0.4;
    const playerElbowX = cx - tableW * 0.3;
    const opponentElbowX = cx + tableW * 0.3;
    const elbowY = tableY - tableH * 0.2;
    const forearmLen = Math.min(h * 0.44, 310);
    const gripCenterX = cx;
    const gripCenterY = elbowY - forearmLen * 0.72;
    const pinPadW = tableW * 0.09;
    const pinPadH = tableH * 0.55;
    const playerPinX = cx - tableW * 0.42;
    const opponentPinX = cx + tableW * 0.42;
    const shoulderY = elbowY + h * 0.08;
    return {
      w,
      h,
      cx,
      tableY,
      tableW,
      tableH,
      elbowPadW,
      elbowPadH,
      playerElbowX,
      opponentElbowX,
      elbowY,
      forearmLen,
      gripCenterX,
      gripCenterY,
      pinPadW,
      pinPadH,
      playerPinX,
      opponentPinX,
      shoulderY,
    };
  }

  private drawLoadingIndicator(show: boolean): void {
    if (!this.loadingG || !this.app) return;
    this.loadingG.clear();
    if (!show) return;
    const { w, h } = this.scene;
    this.loadingG.rect(0, 0, w, h).fill({ color: 0x04070d, alpha: 0.85 });
    const barW = Math.min(w * 0.4, 200);
    const barH = 6;
    const bx = (w - barW) / 2;
    const by = h / 2;
    this.loadingG.roundRect(bx, by, barW, barH, 3).fill({ color: 0x1a2438, alpha: 1 });
    this.loadingG.roundRect(bx, by, barW * 0.6, barH, 3).fill({ color: 0xd4af6a, alpha: 0.9 });
  }

  private buildArenaSprites(): void {
    if (!this.assetBundle || !this.layers) return;
    const { textures } = this.assetBundle;
    const arenaIds = [
      'arena/background',
      'arena/crowd',
      'arena/lighting',
      'arena/banners',
      'arena/table-frame',
      'arena/table',
      'arena/elbow-pad',
      'arena/pin-pad',
    ];
    for (const id of arenaIds) {
      const tex = textures.get(id);
      if (!tex) continue;
      const sprite = new Sprite(tex);
      sprite.label = id;
      if (id === 'arena/background' || id === 'arena/lighting' || id === 'arena/banners') {
        this.layers.bg.addChild(sprite);
      } else if (id === 'arena/crowd') {
        this.layers.crowd.addChild(sprite);
      } else {
        this.layers.table.addChild(sprite);
      }
      this.arenaSprites.push(sprite);
      if (id === 'arena/elbow-pad' || id === 'arena/pin-pad') {
        const pad2 = new Sprite(tex);
        pad2.label = `${id}:opponent`;
        this.layers.table.addChild(pad2);
        this.arenaSprites.push(pad2);
      }
    }
    this.layoutArenaSprites(true);
  }

  private layoutArenaSprites(force = false): void {
    if (!this.assetBundle || !this.app) return;
    const s = this.scene;
    if (!force && s.w === this.lastLayoutWidth && s.h === this.lastLayoutHeight) return;
    this.lastLayoutWidth = s.w;
    this.lastLayoutHeight = s.h;
    this.viewport = classifyViewport(s.w, s.h);

    for (const sprite of this.arenaSprites) {
      const id = sprite.label;
      const baseId = id.replace(':opponent', '');
      const sourceSize = this.assetBundle.textureSizes.get(baseId) ?? {
        width: Math.max(1, sprite.texture.width),
        height: Math.max(1, sprite.texture.height),
      };
      if (id === 'arena/background') {
        const entry = this.assetBundle.premiumManifest?.assets['arena/background'];
        const sourceFocal = entry?.focalPoint ?? { x: 0.5, y: 0.42 };
        const viewportFocus =
          entry?.responsiveFocalPoints?.[this.viewport] ??
          PHASE3_4_ARENA_VIEWPORT_FOCUS[this.viewport];
        const layout = layoutFocalCover(
          sourceSize.width,
          sourceSize.height,
          s.w,
          s.h,
          sourceFocal,
          viewportFocus,
        );
        sprite.position.set(layout.x, layout.y);
        sprite.width = layout.width;
        sprite.height = layout.height;
      } else if (id === 'arena/crowd') {
        sprite.position.set(0, s.h * 0.15);
        sprite.width = s.w;
        sprite.height = s.h * 0.35;
        sprite.alpha = 0.7;
      } else if (id === 'arena/lighting') {
        sprite.position.set(0, 0);
        sprite.width = s.w;
        sprite.height = s.h * 0.6;
        sprite.alpha = 0.5;
      } else if (id === 'arena/banners') {
        sprite.position.set(0, 0);
        sprite.width = s.w;
        sprite.height = s.h * 0.3;
        sprite.alpha = 0.6;
      } else if (id === 'arena/table') {
        sprite.width = s.tableW;
        sprite.height = s.tableW * (sourceSize.height / sourceSize.width);
        sprite.position.set(s.cx - sprite.width / 2, s.tableY - s.tableH * 0.28);
      } else if (id === 'arena/table-frame') {
        sprite.width = s.tableW * 1.05;
        sprite.height = sprite.width * (sourceSize.height / sourceSize.width);
        sprite.position.set(s.cx - sprite.width / 2, s.tableY + s.tableH * 0.45);
      } else if (baseId === 'arena/elbow-pad') {
        sprite.width = s.elbowPadW;
        sprite.height = s.elbowPadH;
        const x = id.endsWith(':opponent') ? s.opponentElbowX : s.playerElbowX;
        sprite.position.set(x - sprite.width / 2, s.elbowY - sprite.height / 2);
      } else if (baseId === 'arena/pin-pad') {
        sprite.width = s.pinPadW;
        sprite.height = s.pinPadH;
        const x = id.endsWith(':opponent') ? s.opponentPinX : s.playerPinX;
        sprite.position.set(x - sprite.width / 2, s.tableY - sprite.height);
      }
    }
  }

  private buildFighterRigs(): void {
    if (!this.assetBundle || !this.layers) return;
    const { manifests, textures, textureSizes } = this.assetBundle;
    if (this.assetBundle.premiumRigPairReady) {
      this.playerRig = new PremiumLayeredRig({
        contract: PHASE3_4_BATTLE_RIGS['rookie-brawler'],
        textures,
        textureSizes,
      });
      this.opponentRig = new PremiumLayeredRig({
        contract: PHASE3_4_BATTLE_RIGS['practice-automaton'],
        textures,
        textureSizes,
      });
      this.layers.playerArm.addChild(this.playerRig.container);
      this.layers.opponentArm.addChild(this.opponentRig.container);
      this.usePremiumLayeredRigs = true;
      this.onAssetMode?.('premium-layered');
      return;
    }
    const rigManifest = manifests.rig;
    if (this.playerFighterId) {
      const parts = rigManifest.fighters[this.playerFighterId];
      if (parts && parts.length > 0) {
        this.playerRig = new SpriteRig({ parts, textures, textureSizes });
        this.layers.playerArm.addChild(this.playerRig.container);
      }
    }
    if (this.opponentFighterId) {
      const parts = rigManifest.fighters[this.opponentFighterId];
      if (parts && parts.length > 0) {
        this.opponentRig = new SpriteRig({ parts, textures, textureSizes });
        this.layers.opponentArm.addChild(this.opponentRig.container);
      }
    }
    this.onAssetMode?.('legacy-fallback');
  }

  private spawnDirectionalEffect(plan: DirectionalVfxPlan): void {
    if (this.reducedMotion || !this.assetBundle || !this.layers) return;
    const runtimeId = EFFECT_RUNTIME_IDS[plan.assetId] ?? plan.assetId;
    const tex = this.assetBundle.textures.get(runtimeId);
    if (!tex) return;
    for (let i = 0; i < plan.count; i++) {
      const sprite = new Sprite(tex);
      const size = plan.displaySize * (0.92 + Math.random() * 0.16);
      sprite.width = size;
      sprite.height = size;
      sprite.anchor.set(0.5);
      sprite.x = plan.origin.x + (Math.random() - 0.5) * Math.min(20, size * 0.12);
      sprite.y = plan.origin.y + (Math.random() - 0.5) * Math.min(14, size * 0.08);
      sprite.rotation = plan.rotation;
      if (plan.flipX) sprite.scale.x = -Math.abs(sprite.scale.x);
      sprite.alpha = plan.opacity;
      sprite.blendMode = plan.blendMode;
      sprite.zIndex = plan.zIndex;
      this.layers.vfx.addChild(sprite);
      this.effectSprites.push({
        sprite,
        life: 1,
        maxLife: plan.lifetimeSeconds,
        vx: plan.velocity.x,
        vy: plan.velocity.y,
        growRate: plan.intensity === 'final' ? 0.35 : 0.16,
        baseAlpha: plan.opacity,
      });
    }
    if (this.effectSprites.length > 32) {
      const removed = this.effectSprites.splice(0, this.effectSprites.length - 24);
      for (const e of removed) e.sprite.destroy({ texture: false, textureSource: false });
    }
  }

  private spawnTimelineEffect(
    assetId: string,
    side: string | undefined,
    intensity: number,
    origin: { x: number; y: number },
    destination: { x: number; y: number } | null = null,
  ): void {
    const metadata = getPremiumAssetSlot(assetId)?.vfx;
    if (!metadata) return;
    this.spawnDirectionalEffect(
      createDirectionalVfxPlan({
        assetId,
        metadata,
        intensityBasisPoints: intensity,
        side,
        previousDirection: this.momentumDir,
        origin,
        destination,
      }),
    );
  }

  private updateEffectSprites(dt: number): void {
    this.effectSprites = this.effectSprites.filter((e) => {
      e.life -= dt / e.maxLife;
      if (e.life <= 0) {
        e.sprite.destroy({ texture: false, textureSource: false });
        return false;
      }
      e.sprite.x += e.vx * dt;
      e.sprite.y += e.vy * dt;
      e.sprite.alpha = e.life * e.baseAlpha;
      const grow = 1 + e.growRate * dt;
      e.sprite.scale.x *= grow;
      e.sprite.scale.y *= grow;
      return true;
    });
  }

  private applyCamera(): void {
    if (!this.rootContainer || !this.app) return;
    const preset = CAMERA_PRESETS[this.viewport];
    const s = this.scene;
    this.cameraZoom += (this.targetCameraZoom - this.cameraZoom) * 0.08;
    if (!this.reducedMotion && this.shake > 0.3) {
      this.cameraShakeX = (Math.random() - 0.5) * this.shake * 4;
      this.cameraShakeY = (Math.random() - 0.5) * this.shake * 2;
    } else {
      this.cameraShakeX *= 0.85;
      this.cameraShakeY *= 0.85;
    }
    const focusX = s.gripCenterX;
    const focusY = s.h * preset.focusY;
    this.rootContainer.pivot.set(focusX, focusY);
    this.rootContainer.position.set(focusX + this.cameraShakeX, focusY + this.cameraShakeY);
    this.rootContainer.scale.set(this.cameraZoom);
  }

  private drawStaticScene(): void {
    if (!this.app) return;
    const {
      w,
      h,
      cx,
      tableY,
      tableW,
      tableH,
      elbowPadW,
      elbowPadH,
      playerElbowX,
      opponentElbowX,
      elbowY,
      playerPinX,
      opponentPinX,
      pinPadW,
      pinPadH,
    } = this.scene;
    const bg = this.bgG!;
    bg.clear();
    bg.rect(0, 0, w, h).fill(0x04070d);
    bg.rect(0, 0, w, h * 0.4).fill({ color: 0x080e18, alpha: 1 });
    bg.rect(0, h * 0.4, w, h * 0.15).fill({ color: 0x0a1020, alpha: 0.8 });
    bg.rect(0, h * 0.55, w, h * 0.15).fill({ color: 0x0c1225, alpha: 0.6 });
    for (let i = 0; i < 6; i++) {
      const px = (w * (i + 0.5)) / 6;
      bg.roundRect(px - 8, 0, 16, h * 0.55, 4).fill({ color: 0x121a2a, alpha: 0.7 });
      bg.roundRect(px - 2, h * 0.05, 4, h * 0.4, 2).fill({ color: 0xd4af6a, alpha: 0.06 });
    }
    bg.roundRect(w * 0.06, h * 0.03, w * 0.07, h * 0.25, 5).fill({ color: 0x1a2438, alpha: 0.8 });
    bg.roundRect(w * 0.87, h * 0.03, w * 0.07, h * 0.25, 5).fill({ color: 0x1a2438, alpha: 0.8 });
    bg.roundRect(w * 0.075, h * 0.05, w * 0.025, h * 0.2, 3).fill({ color: 0x5ec8ff, alpha: 0.12 });
    bg.roundRect(w * 0.885, h * 0.05, w * 0.025, h * 0.2, 3).fill({ color: 0xe07a4a, alpha: 0.12 });
    bg.moveTo(cx - w * 0.12, 0)
      .lineTo(cx + w * 0.12, 0)
      .lineTo(cx + w * 0.38, tableY)
      .lineTo(cx - w * 0.38, tableY)
      .fill({ color: 0xffffff, alpha: 0.035 });
    bg.moveTo(cx - w * 0.06, 0)
      .lineTo(cx + w * 0.06, 0)
      .lineTo(cx + w * 0.22, tableY)
      .lineTo(cx - w * 0.22, tableY)
      .fill({ color: 0xfff8e0, alpha: 0.025 });
    bg.ellipse(cx, tableY - h * 0.08, w * 0.32, h * 0.1).fill({ color: 0xd4af6a, alpha: 0.07 });
    bg.ellipse(cx, tableY - h * 0.05, w * 0.2, h * 0.06).fill({ color: 0xffffff, alpha: 0.03 });
    bg.rect(0, tableY + tableH, w, h - tableY - tableH).fill(0x060a10);
    bg.rect(0, tableY + tableH, w, 2).fill({ color: 0xd4af6a, alpha: 0.15 });
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
        crowd
          .roundRect(cxp - r * 0.7, cyp + r * 0.5, r * 1.4, r * 2, 3)
          .fill({ color: shade - 0x010102, alpha: 0.75 - row * 0.1 });
      }
    }
    const tbl = this.tableG!;
    tbl.clear();
    tbl.ellipse(cx, tableY + tableH + 14, tableW * 0.5, 16).fill({ color: 0x000000, alpha: 0.6 });
    tbl.roundRect(cx - tableW / 2, tableY, tableW, tableH, 10).fill(0x1a1510);
    tbl.roundRect(cx - tableW / 2 + 5, tableY + 4, tableW - 10, tableH - 8, 7).fill(0x282018);
    tbl.roundRect(cx - tableW / 2 + 10, tableY + 7, tableW - 20, tableH * 0.28, 5).fill(0x3a3020);
    tbl
      .roundRect(cx - tableW * 0.36, tableY + tableH * 0.5, tableW * 0.72, 3, 1.5)
      .fill({ color: 0xd4af6a, alpha: 0.55 });
    tbl
      .moveTo(cx - tableW / 2 + 8, tableY + 3)
      .lineTo(cx + tableW / 2 - 8, tableY + 3)
      .stroke({ width: 2, color: 0x7a6a4a, alpha: 0.6 });
    tbl
      .roundRect(playerElbowX - elbowPadW / 2, elbowY - elbowPadH / 2, elbowPadW, elbowPadH, 5)
      .fill({ color: 0x2a3a4a, alpha: 0.95 });
    tbl
      .roundRect(
        playerElbowX - elbowPadW / 2 + 3,
        elbowY - elbowPadH / 2 + 3,
        elbowPadW - 6,
        elbowPadH - 6,
        4,
      )
      .fill({ color: 0x3a4a5a, alpha: 0.7 });
    tbl
      .roundRect(opponentElbowX - elbowPadW / 2, elbowY - elbowPadH / 2, elbowPadW, elbowPadH, 5)
      .fill({ color: 0x4a3a2a, alpha: 0.95 });
    tbl
      .roundRect(
        opponentElbowX - elbowPadW / 2 + 3,
        elbowY - elbowPadH / 2 + 3,
        elbowPadW - 6,
        elbowPadH - 6,
        4,
      )
      .fill({ color: 0x5a4a3a, alpha: 0.7 });
    tbl
      .roundRect(playerPinX - pinPadW / 2, tableY - pinPadH, pinPadW, pinPadH, 4)
      .fill({ color: 0x5ec8ff, alpha: 0.25 });
    tbl
      .roundRect(opponentPinX - pinPadW / 2, tableY - pinPadH, pinPadW, pinPadH, 4)
      .fill({ color: 0xe07a4a, alpha: 0.25 });
    const tf = this.tableFrontG!;
    tf.clear();
    tf.roundRect(cx - tableW / 2, tableY + tableH - 5, tableW, 10, 4).fill(0x181210);
    tf.roundRect(cx - tableW / 2 + 3, tableY + tableH - 3, tableW - 6, 4, 2).fill({
      color: 0xd4af6a,
      alpha: 0.2,
    });
  }

  private drawArms(): void {
    if (!this.app || !this.playerG || !this.opponentG || !this.gripG) return;
    const s = this.scene;
    const authoredPose = this.poseController.sample(this.currentElapsedMs);
    const controlDiff = (this.playerStr - this.opponentStr) / 100;
    const maxSway = s.tableW * 0.28;
    const gripPt = this.sharedGripForPose(authoredPose, controlDiff, maxSway);
    const normalizedGrip = Math.max(-1, Math.min(1, (gripPt.x - s.gripCenterX) / maxSway));
    this.targetGripAngle = normalizedGrip * 0.55;
    this.gripAngle += (this.targetGripAngle - this.gripAngle) * 0.12;
    const angle = this.gripAngle;
    const strain = Math.abs(angle) / 0.55;

    if (this.useSpriteRigs && this.playerRig && this.opponentRig && this.assetBundle) {
      const playerPose = phase34SidePoseToRigInput(authoredPose.player, authoredPose);
      const opponentPose = phase34SidePoseToRigInput(authoredPose.opponent, authoredPose);
      const playerElbow = { x: s.playerElbowX, y: s.elbowY };
      const opponentElbow = { x: s.opponentElbowX, y: s.elbowY };
      this.playerRig.update({
        elbow: playerElbow,
        grip: gripPt,
        pose: playerPose,
        mirror: false,
      });
      this.opponentRig.update({
        elbow: opponentElbow,
        grip: gripPt,
        pose: opponentPose,
        mirror: true,
      });
      if (
        this.usePremiumLayeredRigs &&
        this.playerRig instanceof PremiumLayeredRig &&
        this.opponentRig instanceof PremiumLayeredRig
      ) {
        const playerSolution = this.playerRig.getLastSolution();
        const opponentSolution = this.opponentRig.getLastSolution();
        if (playerSolution && opponentSolution) {
          const transforms = [
            ...Object.values(playerSolution.transforms),
            ...Object.values(opponentSolution.transforms),
          ].flatMap((transform) => [
            transform.x,
            transform.y,
            transform.rotation,
            transform.scaleX,
            transform.scaleY,
          ]);
          const diagnostics = validatePhase34RigFrame({
            sharedGrip: gripPt,
            playerGrip: playerSolution.joints.grip,
            opponentGrip: opponentSolution.joints.grip,
            playerElbow: playerSolution.joints.elbow,
            playerExpectedElbow: playerElbow,
            opponentElbow: opponentSolution.joints.elbow,
            opponentExpectedElbow: opponentElbow,
            transformValues: transforms,
          });
          if (
            !diagnostics.valid &&
            !this.rigDiagnosticWarned &&
            process.env.NODE_ENV !== 'production'
          ) {
            this.rigDiagnosticWarned = true;
            console.warn('[Phase 3.4A] Layered-rig invariant warning', diagnostics);
          }
        }
      }
      this.playerG.clear();
      this.opponentG.clear();
      this.gripG.clear();
    } else {
      const shakeX = this.reducedMotion ? 0 : this.shake * (Math.random() - 0.5) * 5;
      const shakeY = this.reducedMotion ? 0 : this.shake * (Math.random() - 0.5) * 2;
      const handX = gripPt.x + shakeX;
      const handY = gripPt.y + shakeY;
      this.drawProceduralArm(this.playerG, {
        elbowX: s.playerElbowX + shakeX,
        elbowY: s.elbowY,
        handX,
        handY,
        shoulderX: s.playerElbowX - s.tableW * 0.2 + shakeX,
        shoulderY: s.shoulderY,
        palette: this.playerPalette,
        side: 'player',
        strain,
        mechanical: false,
      });
      this.drawProceduralArm(this.opponentG, {
        elbowX: s.opponentElbowX + shakeX,
        elbowY: s.elbowY,
        handX,
        handY,
        shoulderX: s.opponentElbowX + s.tableW * 0.2 + shakeX,
        shoulderY: s.shoulderY,
        palette: this.opponentPalette,
        side: 'opponent',
        strain,
        mechanical: true,
      });
      this.drawGrip(handX, handY, angle, strain);
    }
  }

  private sharedGripForPose(
    pose: Phase34BattlePose,
    controlDiff: number,
    maxSway: number,
  ): { x: number; y: number } {
    const s = this.scene;
    const center = { x: s.gripCenterX, y: s.gripCenterY };
    if (pose.gripTarget.mode === 'player-pin' || pose.gripTarget.mode === 'opponent-pin') {
      const destination = {
        x: pose.gripTarget.mode === 'player-pin' ? s.playerPinX : s.opponentPinX,
        y: s.tableY - s.pinPadH * 0.55,
      };
      const start =
        this.pinArcStart ?? computeGripPoint(center, controlDiff, maxSway, s.forearmLen * 0.08);
      return quadraticPinArc(start, destination, this.pinArcProgress, s.forearmLen * 0.08);
    }
    if (pose.gripTarget.mode === 'center') return center;
    return computeGripPoint(
      center,
      controlDiff,
      maxSway,
      s.forearmLen * 0.08 * Math.max(0.25, pose.gripTarget.y),
    );
  }

  private drawProceduralArm(
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
    const { elbowX, elbowY, handX, handY, shoulderX, shoulderY, strain } = opts;
    const faMidX = (elbowX + handX) / 2 + (opts.side === 'player' ? -10 : 10);
    const faMidY = (elbowY + handY) / 2;
    const uaMidX = (shoulderX + elbowX) / 2;
    const uaMidY = (shoulderY + elbowY) / 2 - 8;
    g.moveTo(shoulderX + 4, shoulderY + 6)
      .quadraticCurveTo(uaMidX + 4, uaMidY + 6, elbowX + 4, elbowY + 5)
      .stroke({ width: 36, color: 0x000000, alpha: 0.35, cap: 'round' });
    g.moveTo(elbowX + 3, elbowY + 4)
      .quadraticCurveTo(faMidX + 3, faMidY + 4, handX + 3, handY + 3)
      .stroke({ width: 30, color: 0x000000, alpha: 0.3, cap: 'round' });
    if (opts.mechanical) {
      g.moveTo(shoulderX, shoulderY)
        .quadraticCurveTo(uaMidX, uaMidY, elbowX, elbowY)
        .stroke({ width: 32, color: 0x3a4048, cap: 'round' });
      g.moveTo(shoulderX, shoulderY)
        .quadraticCurveTo(uaMidX, uaMidY, elbowX, elbowY)
        .stroke({ width: 24, color: 0x4a5058, cap: 'round' });
      for (let i = 1; i <= 3; i++) {
        const t = i / 4;
        const px = lerp(shoulderX, elbowX, t);
        const py = lerp(shoulderY, elbowY, t) - 4;
        g.moveTo(px - 10, py)
          .lineTo(px + 10, py)
          .stroke({ width: 2, color: 0x2a3038, alpha: 0.8 });
      }
      g.moveTo(shoulderX + 8, shoulderY + 4)
        .quadraticCurveTo(uaMidX + 10, uaMidY + 4, elbowX + 8, elbowY + 2)
        .stroke({ width: 5, color: accent, alpha: 0.5, cap: 'round' });
      g.circle(elbowX, elbowY, 18).fill(0x3a4048);
      g.circle(elbowX, elbowY, 14).fill(0x4a5560);
      g.circle(elbowX, elbowY, 8).fill(accent);
      const faW = 26 + strain * 5;
      g.moveTo(elbowX, elbowY)
        .quadraticCurveTo(faMidX, faMidY, handX, handY)
        .stroke({ width: faW, color: 0x4a5560, cap: 'round' });
      g.moveTo(elbowX, elbowY)
        .quadraticCurveTo(faMidX, faMidY, handX, handY)
        .stroke({ width: faW - 8, color: 0x5a6570, cap: 'round' });
      g.moveTo(elbowX + 6, elbowY - 3)
        .quadraticCurveTo(faMidX + 8, faMidY - 3, handX + 5, handY - 2)
        .stroke({ width: 3.5, color: accent, alpha: 0.6, cap: 'round' });
      const wristX = lerp(elbowX, handX, 0.78);
      const wristY = lerp(elbowY, handY, 0.78);
      g.roundRect(wristX - 14, wristY - 10, 28, 20, 4).fill(0x3a4550);
      g.roundRect(wristX - 10, wristY - 6, 20, 12, 3).fill(accent);
      g.circle(shoulderX, shoulderY, 22).fill(0x3a4048);
      g.circle(shoulderX, shoulderY, 16).fill(0x4a5560);
      g.circle(shoulderX, shoulderY, 8).fill(accent);
    } else {
      g.moveTo(shoulderX, shoulderY)
        .quadraticCurveTo(uaMidX, uaMidY, elbowX, elbowY)
        .stroke({ width: 34, color: skin, cap: 'round' });
      g.moveTo(shoulderX + 2, shoulderY - 4)
        .quadraticCurveTo(uaMidX + 2, uaMidY - 6, elbowX + 1, elbowY - 3)
        .stroke({ width: 14, color: 0xffffff, alpha: 0.08, cap: 'round' });
      g.circle(shoulderX, shoulderY, 22).fill(skin);
      g.roundRect(shoulderX - 16, shoulderY - 8, 32, 16, 8).fill({ color: cloth, alpha: 0.8 });
      g.circle(elbowX, elbowY, 16).fill(skin);
      const faW = 26 + strain * 6;
      g.moveTo(elbowX, elbowY)
        .quadraticCurveTo(faMidX, faMidY, handX, handY)
        .stroke({ width: faW, color: skin, cap: 'round' });
      g.moveTo(elbowX - 2, elbowY - 4)
        .quadraticCurveTo(faMidX - 2, faMidY - 4, handX - 1, handY - 3)
        .stroke({ width: 9, color: 0xffffff, alpha: 0.07, cap: 'round' });
      if (strain > 0.3 && !this.reducedMotion) {
        const veinAlpha = 0.08 + strain * 0.12;
        g.moveTo(elbowX + 3, elbowY - 6)
          .quadraticCurveTo(faMidX + 5, faMidY - 5, handX + 3, handY - 4)
          .stroke({ width: 1.5, color: 0x4a2a3a, alpha: veinAlpha, cap: 'round' });
      }
      const wristX = lerp(elbowX, handX, 0.72);
      const wristY = lerp(elbowY, handY, 0.72);
      g.roundRect(wristX - 13, wristY - 9, 26, 18, 5).fill(cloth);
      for (let i = 0; i < 3; i++) {
        const wy = wristY - 5 + i * 5;
        g.moveTo(wristX - 10, wy)
          .lineTo(wristX + 10, wy + 1.5)
          .stroke({ width: 2.5, color: accent, alpha: 0.6 - i * 0.1, cap: 'round' });
      }
      const bracerX = lerp(elbowX, handX, 0.45);
      const bracerY = lerp(elbowY, handY, 0.45);
      g.roundRect(bracerX - 11, bracerY - 7, 22, 14, 4).fill({ color: cloth, alpha: 0.7 });
    }
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
    const glowAlpha = 0.08 + strain * 0.2;
    g.circle(handX, handY, gripR + 12).fill({ color: 0xd4af6a, alpha: glowAlpha * 0.3 });
    g.circle(handX, handY, gripR + 6).fill({ color: 0x5ec8ff, alpha: glowAlpha * 0.4 });
    g.circle(handX - 6, handY + 1, gripR * 0.85).fill(playerGlove);
    g.circle(handX - 6, handY - 2, gripR * 0.55).fill({ color: playerSkin, alpha: 0.35 });
    for (let i = 0; i < 4; i++) {
      g.circle(handX - 3 + i * 4.5, handY + gripR * 0.55, 3.8).fill({
        color: playerSkin,
        alpha: 0.5,
      });
    }
    g.circle(handX - 12, handY - gripR * 0.3, 4.5).fill(playerGlove);
    g.circle(handX + 6, handY - 1, gripR * 0.82).fill(opponentGlove);
    g.circle(handX + 6, handY - 4, gripR * 0.5).fill({ color: opponentSkin, alpha: 0.3 });
    for (let i = 0; i < 4; i++) {
      g.circle(handX + 3 - i * 4.5, handY - gripR * 0.55, 3.5).fill({
        color: 0x6a7a8a,
        alpha: 0.6,
      });
    }
    g.circle(handX + 12, handY + gripR * 0.25, 4).fill(opponentGlove);
    g.circle(handX, handY, gripR + 2).stroke({ width: 2, color: 0xf0d9a0, alpha: glowAlpha });
    if (strain > 0.4 && !this.reducedMotion) {
      const t = performance.now() / 150;
      const sparkCount = Math.floor(strain * 5);
      for (let i = 0; i < sparkCount; i++) {
        const a = t + i * 1.8;
        const dist = gripR + 4 + Math.sin(a * 2.3) * 6;
        g.circle(handX + Math.cos(a) * dist, handY + Math.sin(a) * dist, 1.5 + Math.random()).fill({
          color: 0xf0d9a0,
          alpha: 0.4 + Math.random() * 0.3,
        });
      }
    }
  }

  private update(elapsed: number): void {
    if (!this.app || this.completed) return;
    this.currentElapsedMs = elapsed;
    this.layoutArenaSprites();
    const tl = this.timeline;
    if (tl.length === 0) return;

    // Find active event and interpolate strengths.
    let activeEvent: TimelineEvent | null = null;
    for (let i = 0; i < tl.length; i++) {
      const ev = tl[i]!;
      if (elapsed >= ev.startMs && elapsed < ev.startMs + ev.durationMs) {
        activeEvent = ev;
        break;
      }
    }

    // Timeline complete.
    const lastEvent = tl[tl.length - 1]!;
    if (elapsed >= lastEvent.startMs + lastEvent.durationMs) {
      this.playerStr = lastEvent.playerStrengthAfter;
      this.opponentStr = lastEvent.opponentStrengthAfter;
      this.onStrength?.(this.playerStr, this.opponentStr);
      this.finalOutcome ??= this.opponentStr === 0 ? 'victory' : 'defeat';
      this.poseController.force(
        this.finalOutcome === 'victory' ? 'opponentDefeatHold' : 'playerDefeatHold',
        elapsed,
      );
      this.pinArcProgress = 1;
      this.drawArms();
      this.completed = true;
      this.targetCameraZoom = CAMERA_PRESETS[this.viewport].baseZoom * 0.9;
      this.onComplete?.();
      this.pause();
      return;
    }

    if (activeEvent) {
      const t = Math.min(1, (elapsed - activeEvent.startMs) / Math.max(1, activeEvent.durationMs));
      const et = easeInOut(t);
      this.playerStr = lerp(activeEvent.playerStrengthBefore, activeEvent.playerStrengthAfter, et);
      this.opponentStr = lerp(
        activeEvent.opponentStrengthBefore,
        activeEvent.opponentStrengthAfter,
        et,
      );
      this.onStrength?.(Math.round(this.playerStr), Math.round(this.opponentStr));

      const cue = activeEvent.animationCue;
      const controlDiff = (this.playerStr - this.opponentStr) / 100;
      const isFinalEvent = activeEvent.type === 'final_slam';
      if (isFinalEvent && this.activeEventIndex !== activeEvent.index) {
        this.finalOutcome = activeEvent.side === 'opponent' ? 'defeat' : 'victory';
        const scene = this.scene;
        this.pinArcStart = computeGripPoint(
          { x: scene.gripCenterX, y: scene.gripCenterY },
          controlDiff,
          scene.tableW * 0.28,
          scene.forearmLen * 0.08,
        );
      }
      if (isFinalEvent) {
        this.pinArcProgress = this.reducedMotion ? Math.min(1, t * 2.5) : easeInOut(t);
      } else if (this.finalOutcome) {
        this.pinArcProgress = 1;
      }

      const poseId = selectPhase34BattlePoseId({
        animationCue: cue,
        eventType: activeEvent.type,
        side: activeEvent.side,
        intensity: activeEvent.intensity,
        controlDiff,
        latchedOutcome: this.finalOutcome,
      });
      this.poseController.setTarget(poseId, elapsed);
      const sampledPose = this.poseController.sample(elapsed);
      this.targetCameraZoom = CAMERA_PRESETS[this.viewport].baseZoom * sampledPose.cameraCue.zoom;

      // Event change detection is intentionally index-based: victory/defeat may
      // reuse the final-slam animation cue but still needs one distinct handoff.
      if (this.activeEventIndex !== activeEvent.index) {
        this.activeEventIndex = activeEvent.index;
        this.cue = cue;
        this.onEvent?.(activeEvent);

        // Audio cue.
        const soundCue = activeEvent.soundCue as AudioCue;
        if (soundCue && soundCue !== 'none') {
          this.audio.playCue(soundCue, activeEvent.intensity);
        }

        // VFX triggers.
        const vfx = activeEvent.vfxCue;
        const s = this.scene;
        const origin = { x: s.gripCenterX, y: s.gripCenterY };
        if (vfx === 'grip_spark') {
          this.spawnTimelineEffect(
            'effects/grip-lock',
            activeEvent.side,
            activeEvent.intensity,
            origin,
          );
          this.spawnBurst(s.gripCenterX, s.gripCenterY, 6, 0xf0d9a0);
        } else if (vfx === 'dust_light') {
          this.spawnBurst(s.gripCenterX, s.gripCenterY + 20, 4, 0x8a7a6a);
        } else if (vfx === 'dust_heavy') {
          this.spawnBurst(s.gripCenterX, s.gripCenterY + 20, 8, 0x8a7a6a);
          this.spawnTimelineEffect(
            'effects/counter-burst',
            activeEvent.side,
            activeEvent.intensity,
            origin,
          );
        } else if (vfx === 'critical_flash') {
          this.spawnTimelineEffect(
            'effects/critical-impact',
            activeEvent.side,
            activeEvent.intensity,
            origin,
          );
          this.spawnBurst(s.gripCenterX, s.gripCenterY, 10, 0x5ec8ff);
          this.targetCameraZoom = CAMERA_PRESETS[this.viewport].criticalZoom;
          this.flashIntensity = 0.6;
        } else if (vfx === 'energy_trail') {
          this.spawnTimelineEffect(
            cue === 'counter' ? 'effects/counter-burst' : 'effects/push-streak',
            activeEvent.side,
            activeEvent.intensity,
            origin,
          );
        } else if (vfx === 'final_impact') {
          const destination = {
            x: activeEvent.side === 'opponent' ? s.playerPinX : s.opponentPinX,
            y: s.tableY - s.pinPadH * 0.55,
          };
          this.spawnTimelineEffect(
            'effects/final-slam',
            activeEvent.side,
            activeEvent.intensity,
            origin,
            destination,
          );
          this.spawnBurst(s.gripCenterX, s.gripCenterY, 15, 0xd4af6a);
          this.shake = 1;
          this.flashIntensity = 0.8;
        } else if (vfx === 'victory_particles') {
          this.spawnTimelineEffect(
            'effects/victory-sweep',
            activeEvent.side,
            activeEvent.intensity,
            { x: s.gripCenterX, y: s.gripCenterY - 30 },
          );
          this.spawnBurst(s.gripCenterX, s.gripCenterY, 12, 0x5ec8ff);
        } else if (vfx === 'defeat_particles') {
          this.spawnTimelineEffect('effects/defeat-dim', activeEvent.side, activeEvent.intensity, {
            x: s.gripCenterX,
            y: s.gripCenterY - 30,
          });
          this.spawnBurst(s.gripCenterX, s.gripCenterY, 8, 0xe07a4a);
        }

        // Camera cues.
        if (cue === 'critical') {
          this.targetCameraZoom = CAMERA_PRESETS[this.viewport].criticalZoom;
        } else if (cue === 'recovery') {
          this.targetCameraZoom = CAMERA_PRESETS[this.viewport].baseZoom;
          this.recoveryGlow = 1;
          this.spawnTimelineEffect(
            'effects/recovery-cue',
            activeEvent.side,
            activeEvent.intensity,
            origin,
          );
        } else if (cue === 'winning_slam' || cue === 'defeated') {
          this.targetCameraZoom = CAMERA_PRESETS[this.viewport].baseZoom * 1.05;
        }
      }
    }

    // Momentum detection.
    const controlDiff = (this.playerStr - this.opponentStr) / 100;
    const nextDirection = momentumDirection(this.prevDiff, controlDiff);
    if (nextDirection !== 0 && Math.abs(controlDiff - this.prevDiff) > 0.02) {
      this.momentumDir = nextDirection;
      if (!this.reducedMotion) {
        this.spawnTimelineEffect(
          'effects/push-streak',
          nextDirection === 1 ? 'player' : 'opponent',
          3200,
          { x: this.scene.gripCenterX, y: this.scene.gripCenterY },
        );
      }
    }
    this.prevDiff = controlDiff;

    // Strain phase for visual effects.
    this.strainPhase += 0.05;

    // Decay effects.
    this.shake *= 0.92;
    this.flashIntensity *= 0.94;
    this.slamFlash *= 0.95;
    this.recoveryGlow *= 0.96;
    this.ambientPhase += 0.02;

    // Camera zoom easing.
    this.cameraZoom += (this.targetCameraZoom - this.cameraZoom) * 0.06;

    // Update systems.
    this.updateParticles();
    this.updateEffectSprites(1 / 60);
    this.drawArms();
    this.drawVfxOverlay();
    this.applyCamera();
  }

  private spawnBurst(x: number, y: number, count: number, color: number): void {
    if (this.reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        maxLife: 0.4 + Math.random() * 0.4,
        size: 2 + Math.random() * 3,
        color,
        alpha: 0.7 + Math.random() * 0.3,
      });
    }
    // Cap particle count.
    if (this.particles.length > 80) {
      this.particles.splice(0, this.particles.length - 60);
    }
  }

  private updateParticles(): void {
    if (!this.particlesG) return;
    const g = this.particlesG;
    g.clear();
    this.particles = this.particles.filter((p) => {
      p.life -= 1 / 60 / p.maxLife;
      if (p.life <= 0) return false;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.vx *= 0.98;
      const alpha = p.life * p.alpha;
      const size = p.size * (0.5 + p.life * 0.5);
      g.circle(p.x, p.y, size).fill({ color: p.color, alpha });
      return true;
    });
  }

  private drawVfxOverlay(): void {
    if (!this.vfxG || !this.overlayG) return;
    const g = this.vfxG;
    g.clear();
    const s = this.scene;
    const strain = Math.abs(this.gripAngle) / 0.55;

    // Grip pressure glow.
    if (strain > 0.1) {
      const glowR = 20 + strain * 30;
      g.circle(s.gripCenterX, s.gripCenterY, glowR).fill({ color: 0xd4af6a, alpha: strain * 0.08 });
      g.circle(s.gripCenterX, s.gripCenterY, glowR * 0.6).fill({
        color: 0x5ec8ff,
        alpha: strain * 0.05,
      });
    }

    // Recovery glow.
    if (this.recoveryGlow > 0.05) {
      g.circle(s.gripCenterX, s.gripCenterY, 40 + this.recoveryGlow * 20).fill({
        color: 0x5ec8ff,
        alpha: this.recoveryGlow * 0.15,
      });
    }

    // Momentum streaks (procedural fallback when reduced motion is off).
    if (!this.reducedMotion && Math.abs(this.momentumDir) > 0 && strain > 0.2) {
      const dir = this.momentumDir;
      const streakAlpha = strain * 0.12;
      for (let i = 0; i < 3; i++) {
        const sx = s.gripCenterX + dir * (20 + i * 15);
        const sy = s.gripCenterY - 10 + i * 8;
        g.moveTo(sx, sy)
          .lineTo(sx + dir * 25, sy - 3)
          .stroke({ width: 2, color: 0xd4af6a, alpha: streakAlpha * (1 - i * 0.25), cap: 'round' });
      }
    }

    // Flash overlay.
    const ov = this.overlayG;
    ov.clear();
    if (this.flashIntensity > 0.02) {
      ov.rect(0, 0, s.w, s.h).fill({ color: 0xffffff, alpha: this.flashIntensity * 0.3 });
    }
    if (this.slamFlash > 0.02) {
      ov.rect(0, 0, s.w, s.h).fill({ color: 0xd4af6a, alpha: this.slamFlash * 0.2 });
    }

    // Ambient haze (subtle).
    if (!this.reducedMotion) {
      const hazeAlpha = 0.02 + Math.sin(this.ambientPhase) * 0.01;
      ov.rect(0, s.h * 0.6, s.w, s.h * 0.4).fill({ color: 0x1a2438, alpha: hazeAlpha });
    }
  }
}
