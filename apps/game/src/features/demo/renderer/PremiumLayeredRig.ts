import { Container, Sprite } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { Phase34BattleRigContract } from '@armz-clash/game-core';
import type { FkInput, PoseInput } from './rigSolver';
import {
  preparePremiumRig,
  solvePremiumRigFrame,
  type PremiumRigFrameSolution,
  type PreparedPremiumRig,
} from './premiumRigSolver';

export type PremiumLayeredRigOptions = {
  contract: Phase34BattleRigContract;
  textures: Map<string, Texture>;
  textureSizes: Map<string, { width: number; height: number }>;
};

/**
 * Pixi renderer for the Phase 3.4A owner-generated layered rig. It deliberately
 * shares the deterministic FK solver with the legacy rig so both paths preserve
 * the same planted-elbow and shared-grip invariants.
 */
export class PremiumLayeredRig {
  readonly container: Container;
  private readonly sprites = new Map<string, Sprite>();
  private readonly preparedRig: PreparedPremiumRig;
  private lastSolution: PremiumRigFrameSolution | null = null;

  constructor(opts: PremiumLayeredRigOptions) {
    this.container = new Container();
    this.container.label = `phase34a-layered-rig:${opts.contract.fighterId}`;

    this.preparedRig = preparePremiumRig(opts.contract, opts.textureSizes);

    for (const layer of [...opts.contract.layers].sort((a, b) => a.zIndex - b.zIndex)) {
      const texture = opts.textures.get(layer.assetId);
      if (!texture) continue;
      const sprite = new Sprite(texture);
      sprite.anchor.set(layer.anchor.x, layer.anchor.y);
      sprite.label = layer.assetId;
      sprite.roundPixels = true;
      this.sprites.set(layer.assetId, sprite);
      this.container.addChild(sprite);
    }
  }

  update(input: FkInput): void {
    const solution = solvePremiumRigFrame(this.preparedRig, input);
    this.lastSolution = solution;
    for (const [assetId, transform] of Object.entries(solution.transforms)) {
      const sprite = this.sprites.get(assetId);
      if (!sprite) continue;
      sprite.visible = transform.visible;
      sprite.position.set(transform.x, transform.y);
      sprite.rotation = transform.rotation;
      sprite.scale.set(transform.scaleX, transform.scaleY);
      if (assetId.endsWith('strain-highlight') || assetId.endsWith('pressure-highlight')) {
        sprite.alpha = Math.min(0.85, 0.18 + transform.glow * 0.7);
      } else if (assetId.endsWith('contact-shadow')) {
        sprite.alpha = 0.45;
      } else {
        sprite.alpha = 1;
      }
    }
  }

  getLastSolution(): PremiumRigFrameSolution | null {
    return this.lastSolution;
  }

  destroy(): void {
    for (const sprite of this.sprites.values()) {
      sprite.destroy({ children: false, texture: false, textureSource: false });
    }
    this.sprites.clear();
    this.container.destroy({ children: true });
  }
}

export type { FkInput, PoseInput };
