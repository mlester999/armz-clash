/**
 * Deterministic seeded PRNG for server-authoritative demo battles.
 * Mulberry32 — integer-friendly, no floating combat storage (floats only for RNG stream).
 */

export type SeededRng = {
  next(): number;
  intInclusive(min: number, max: number): number;
  chanceBps(basisPoints: number): boolean;
};

function hashSeed(seed: string | number): number {
  const s = String(seed);
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function createSeededRng(seed: string | number): SeededRng {
  let t = hashSeed(seed) || 1;
  const next = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    intInclusive(min: number, max: number) {
      if (max < min) throw new Error('intInclusive: max < min');
      const span = max - min + 1;
      return min + Math.floor(next() * span);
    },
    chanceBps(basisPoints: number) {
      const bps = Math.max(0, Math.min(10_000, Math.floor(basisPoints)));
      return next() * 10_000 < bps;
    },
  };
}
