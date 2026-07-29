import { afterEach, describe, expect, it, vi } from 'vitest';
import { BattleRenderer } from './BattleRenderer';

type Destroyable = { destroy: ReturnType<typeof vi.fn> };

type RendererInternals = {
  destroyed: boolean;
  raf: number;
  audio: Destroyable;
  playerRig: Destroyable | null;
  opponentRig: Destroyable | null;
  arenaSprites: Destroyable[];
  effectSprites: Array<{ sprite: Destroyable }>;
  particles: unknown[];
  app: { destroy: ReturnType<typeof vi.fn> } | null;
  host: { replaceChildren: ReturnType<typeof vi.fn> };
};

describe('Phase 3.4 BattleRenderer cleanup', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('cancels animation and releases audio, rigs, sprites, app, and canvas host', () => {
    const cancelAnimationFrame = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

    const audio = { destroy: vi.fn() };
    const playerRig = { destroy: vi.fn() };
    const opponentRig = { destroy: vi.fn() };
    const arenaSprite = { destroy: vi.fn() };
    const effectSprite = { destroy: vi.fn() };
    const app = { destroy: vi.fn() };
    const host = { replaceChildren: vi.fn() };

    const renderer = Object.create(BattleRenderer.prototype) as BattleRenderer;
    const state = renderer as unknown as RendererInternals;
    Object.assign(state, {
      destroyed: false,
      raf: 42,
      audio,
      playerRig,
      opponentRig,
      arenaSprites: [arenaSprite],
      effectSprites: [{ sprite: effectSprite }],
      particles: [{ life: 1 }],
      app,
      host,
    });

    renderer.destroy();

    expect(state.destroyed).toBe(true);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(audio.destroy).toHaveBeenCalledOnce();
    expect(playerRig.destroy).toHaveBeenCalledOnce();
    expect(opponentRig.destroy).toHaveBeenCalledOnce();
    expect(arenaSprite.destroy).toHaveBeenCalledOnce();
    expect(effectSprite.destroy).toHaveBeenCalledOnce();
    expect(app.destroy).toHaveBeenCalledWith(true, { children: true });
    expect(host.replaceChildren).toHaveBeenCalledOnce();
    expect(state.playerRig).toBeNull();
    expect(state.opponentRig).toBeNull();
    expect(state.arenaSprites).toEqual([]);
    expect(state.effectSprites).toEqual([]);
    expect(state.particles).toEqual([]);
    expect(state.app).toBeNull();
  });

  it('releases independent resources across repeated battle renderer lifecycles', () => {
    const cancelAnimationFrame = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

    for (let index = 0; index < 3; index++) {
      const renderer = Object.create(BattleRenderer.prototype) as BattleRenderer;
      const state = renderer as unknown as RendererInternals;
      const audio = { destroy: vi.fn() };
      const rig = { destroy: vi.fn() };
      const app = { destroy: vi.fn() };
      const host = { replaceChildren: vi.fn() };
      Object.assign(state, {
        destroyed: false,
        raf: index + 1,
        audio,
        playerRig: rig,
        opponentRig: null,
        arenaSprites: [],
        effectSprites: [],
        particles: [],
        app,
        host,
      });

      renderer.destroy();

      expect(audio.destroy).toHaveBeenCalledOnce();
      expect(rig.destroy).toHaveBeenCalledOnce();
      expect(app.destroy).toHaveBeenCalledOnce();
      expect(host.replaceChildren).toHaveBeenCalledOnce();
    }
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(3);
  });
});
