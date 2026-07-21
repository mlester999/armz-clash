/**
 * Phase 3.3B â€” sprite-based fighter rig.
 *
 * Replaces the procedural PixiJS Graphics anatomy with textured Sprite layers
 * loaded from the generated asset manifest. PixiJS Graphics are NOT used here
 * for fighter anatomy (only the renderer uses Graphics for particles/lighting).
 *
 * Layer order per fighter (draw order by authored `z`):
 *   shadows -> shoulder -> upper-arm -> elbow -> forearm -> bracer/wraps ->
 *   wrist -> hand -> fingers/thumb/grip-pad -> highlights
 */

import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { RigPart } from '@armz-clash/game-core';
import { solveRig, type FkInput, type PoseInput, type RigPartInput, type Vec2 } from './rigSolver';

export type SpriteRigOptions = {
  parts: readonly RigPart[];
  textures: Map<string, Texture>;
  /** 1x texture size per assetId (used to derive bone base lengths). */
  textureSizes: Map<string, { width: number; height: number }>;
};

export class SpriteRig {
  readonly container: Container;
  private parts: readonly RigPart[];
  private sprites = new Map<string, Sprite>();
  private baseLengths: Record<string, number> = {};
  private rigParts: RigPartInput[];

  constructor(opts: SpriteRigOptions) {
    this.parts = opts.parts;
    this.container = new Container();
    this.container.label = 'sprite-rig';

    // Compute authored bone base lengths from texture size + normalized anchor.
    for (const part of this.parts) {
      const size = opts.textureSizes.get(part.assetId) ?? { width: 100, height: 100 };
      if (part.kind === 'upperArm' || part.kind === 'forearm' || part.kind === 'hand') {
        this.baseLengths[part.assetId] = Math.max(1, (1 - part.anchor.y) * size.height);
      } else {
        this.baseLengths[part.assetId] = Math.max(1, size.height);
      }
    }

    this.rigParts = this.parts.map((p) => ({
      assetId: p.assetId,
      kind: p.kind,
      anchor: p.anchor,
      axisT: p.axisT,
      parent: p.parent,
      offset: p.offset,
      overlayScale: p.overlayScale,
      z: p.z,
    }));

    // Build sprites sorted by z (lower draws first).
    const sorted = [...this.parts].sort((a, b) => a.z - b.z);
    for (const part of sorted) {
      const tex = opts.textures.get(part.assetId);
      if (!tex) continue;
      const sprite = new Sprite(tex);
      sprite.anchor.set(part.anchor.x, part.anchor.y);
      sprite.label = part.assetId;
      sprite.roundPixels = true;
      this.sprites.set(part.assetId, sprite);
      this.container.addChild(sprite);
    }
  }

  /** Apply an FK solution for the current frame. */
  update(input: FkInput): void {
    const solution = solveRig(this.rigParts, this.baseLengths, input);
    for (const [assetId, t] of Object.entries(solution.transforms)) {
      const sprite = this.sprites.get(assetId);
      if (!sprite) continue;
      sprite.visible = t.visible;
      sprite.x = t.x;
      sprite.y = t.y;
      sprite.rotation = t.rotation;
      sprite.scale.set(t.scaleX, t.scaleY);
      // Highlight / strain tinting via alpha + subtle brightness.
      if (assetId.endsWith('/highlights')) {
        sprite.alpha = 0.35 + t.glow * 0.5;
      } else if (assetId.endsWith('/shadows')) {
        sprite.alpha = 0.5;
      } else {
        sprite.alpha = 1;
      }
    }
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  destroy(): void {
    for (const sprite of this.sprites.values()) {
      // Do not destroy shared textures here; the renderer owns the cache.
      sprite.destroy({ children: false, texture: false, textureSource: false });
    }
    this.sprites.clear();
    this.container.destroy({ children: true });
  }
}

export type { PoseInput, Vec2 };
