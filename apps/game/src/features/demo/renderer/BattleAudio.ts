/**
 * Phase 3.3B — runtime Web Audio synthesis for battle SFX + ambience.
 *
 * All sounds are synthesized live via the Web Audio API (no downloaded or
 * copyrighted audio). Respects autoplay restrictions: no sound before user
 * interaction. Single AudioContext, no leaked oscillators, proper cleanup.
 */

export type AudioCue =
  | 'ambience_loop'
  | 'hands_lock'
  | 'cloth_move'
  | 'metal_move'
  | 'strain'
  | 'table_creak'
  | 'impact_light'
  | 'impact_heavy'
  | 'critical'
  | 'recovery'
  | 'final_slam'
  | 'victory'
  | 'defeat'
  | 'reward_reveal'
  | 'none';

export class BattleAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambienceOsc: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxEnabled = true;
  private musicEnabled = false;
  private destroyed = false;
  private lastCueAt = 0;

  constructor() {
    // Lazy init on first user interaction.
  }

  /** Initialize the AudioContext. Must be called after user interaction. */
  init(): void {
    if (this.ctx || this.destroyed) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? 0.6 : 0;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? 0.3 : 0;
      this.musicGain.connect(this.masterGain);
    } catch {
      // Autoplay policy or no audio support.
    }
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(enabled ? 0.6 : 0, this.ctx.currentTime, 0.01);
    }
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(enabled ? 0.3 : 0, this.ctx.currentTime, 0.01);
    }
    if (enabled && !this.ambienceOsc) {
      this.startAmbience();
    } else if (!enabled && this.ambienceOsc) {
      this.stopAmbience();
    }
  }

  private startAmbience(): void {
    if (!this.ctx || !this.musicGain || this.ambienceOsc) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 55; // Low arena hum.
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      this.ambienceOsc = osc;
      this.ambienceGain = gain;
    } catch {
      // Ignore.
    }
  }

  private stopAmbience(): void {
    if (this.ambienceOsc && this.ctx) {
      try {
        this.ambienceOsc.stop(this.ctx.currentTime + 0.05);
      } catch {
        // Already stopped.
      }
      this.ambienceOsc = null;
      this.ambienceGain = null;
    }
  }

  /** Play a synthesized SFX cue. Rate-limited to prevent spam. */
  playCue(cue: AudioCue, intensity = 5000): void {
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.destroyed) return;
    if (cue === 'none' || cue === 'ambience_loop') return;

    const now = performance.now();
    if (now - this.lastCueAt < 100) return; // Rate limit.
    this.lastCueAt = now;

    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.sfxGain);

      const t = ctx.currentTime;
      const norm = Math.min(1, intensity / 10000);

      switch (cue) {
        case 'hands_lock':
          osc.type = 'square';
          osc.frequency.setValueAtTime(180, t);
          osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.start(t);
          osc.stop(t + 0.1);
          break;
        case 'cloth_move':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120 + norm * 40, t);
          gain.gain.setValueAtTime(0.06, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
          osc.start(t);
          osc.stop(t + 0.06);
          break;
        case 'metal_move':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220 + norm * 80, t);
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
          osc.start(t);
          osc.stop(t + 0.07);
          break;
        case 'strain':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(80 + norm * 60, t);
          gain.gain.setValueAtTime(0.1 + norm * 0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          osc.start(t);
          osc.stop(t + 0.12);
          break;
        case 'table_creak':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(60, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
          gain.gain.setValueAtTime(0.05, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          osc.start(t);
          osc.stop(t + 0.15);
          break;
        case 'impact_light':
          osc.type = 'square';
          osc.frequency.setValueAtTime(140, t);
          osc.frequency.exponentialRampToValueAtTime(70, t + 0.06);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          osc.start(t);
          osc.stop(t + 0.08);
          break;
        case 'impact_heavy':
          osc.type = 'square';
          osc.frequency.setValueAtTime(100, t);
          osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          osc.start(t);
          osc.stop(t + 0.12);
          break;
        case 'critical':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, t);
          osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.start(t);
          osc.stop(t + 0.18);
          break;
        case 'recovery':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, t);
          osc.frequency.exponentialRampToValueAtTime(500, t + 0.2);
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.start(t);
          osc.stop(t + 0.25);
          break;
        case 'final_slam':
          osc.type = 'square';
          osc.frequency.setValueAtTime(120, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.start(t);
          osc.stop(t + 0.25);
          break;
        case 'victory':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, t);
          osc.frequency.setValueAtTime(554, t + 0.1);
          osc.frequency.setValueAtTime(659, t + 0.2);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          osc.start(t);
          osc.stop(t + 0.4);
          break;
        case 'defeat':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(330, t);
          osc.frequency.exponentialRampToValueAtTime(220, t + 0.3);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.start(t);
          osc.stop(t + 0.35);
          break;
        case 'reward_reveal':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(600, t);
          osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          osc.start(t);
          osc.stop(t + 0.2);
          break;
        default:
          break;
      }
    } catch {
      // Ignore synthesis errors.
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.stopAmbience();
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
  }
}
