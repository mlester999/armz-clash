/**
 * Phase 3.3B â€” Qwen-only premium vector asset pipeline.
 *
 * Deterministic build script that:
 *  1. Reads hand-authored SVG sources from apps/game/assets/source.
 *  2. Validates each SVG (viewBox present, no <script>, no duplicate ids,
 *     no external/network references, no embedded data URIs).
 *  3. Rasterizes every SVG to WebP (primary, q82) + PNG (fallback, comp 6)
 *     at 1x (mobile) and 2x (desktop/tablet) using sharp/librsvg.
 *  4. Emits a PixiJS-compatible texture atlas (shelf-packed PNG + JSON).
 *  5. Emits typed asset / rig / pose manifests + content hashes + size report.
 *
 * Determinism guarantees: sorted file iteration, fixed quality settings, no
 * timestamps in any output, stable JSON key ordering. Runs fully offline.
 *
 * Usage: pnpm build:assets   (tsx scripts/build-game-assets.ts)
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  ALL_RIG_PARTS,
  ASSET_VERSION,
  CAMERA_PRESETS,
  CUE_TO_POSE,
  POSES,
  SURFACE_ASSETS,
  type RigPartDef,
  type Vec2,
} from './game-asset-config';

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'apps/game/assets/source');
const OUT_DIR = path.join(ROOT, 'apps/game/public/assets/game/phase3-3b');
const DOCS_DIR = path.join(ROOT, 'docs');

const WEBP_QUALITY = 82;
const PNG_COMPRESSION = 6;
const MAX_LONG_SIDE = 2048;

type BuildAsset = {
  assetId: string;
  fighterId: string | null;
  sourceRel: string; // relative to SOURCE_DIR
  outRel: string; // relative to OUT_DIR, no extension
  category: string;
  materialCategory: string;
  anchor: Vec2;
  pivot: Vec2;
  rig?: RigPartDef;
};

type ValidationProblem = { assetId: string; sourceRel: string; problem: string };

// ---------------------------------------------------------------------------
// Asset inventory (sorted, deterministic)
// ---------------------------------------------------------------------------

function buildInventory(): BuildAsset[] {
  const assets: BuildAsset[] = [];

  for (const part of ALL_RIG_PARTS) {
    const outRel = part.source.replace(/\.svg$/, '');
    assets.push({
      assetId: part.assetId,
      fighterId: part.fighterId,
      sourceRel: part.source,
      outRel,
      category: 'rig',
      materialCategory: part.materialCategory,
      anchor: part.anchor,
      pivot: part.pivot,
      rig: part,
    });
  }

  for (const surface of SURFACE_ASSETS) {
    const outRel = surface.source.replace(/\.svg$/, '');
    assets.push({
      assetId: surface.assetId,
      fighterId: surface.fighterId,
      sourceRel: surface.source,
      outRel,
      category: surface.category,
      materialCategory: surface.materialCategory,
      anchor: surface.anchor,
      pivot: surface.anchor,
    });
  }

  assets.sort((a, b) => a.assetId.localeCompare(b.assetId));
  return assets;
}

// ---------------------------------------------------------------------------
// SVG validation
// ---------------------------------------------------------------------------

function stripNamespaces(svg: string): string {
  // Remove xmlns / xmlns:xlink declarations so the naive URL scan does not
  // false-positive on the standard "http://www.w3.org/2000/svg" namespace.
  return svg.replace(/xmlns(?::[a-zA-Z0-9]+)?\s*=\s*"[^"]*"/g, '');
}

function validateSvg(assetId: string, sourceRel: string, svg: string): string[] {
  const problems: string[] = [];

  if (!/viewBox\s*=\s*"/.test(svg)) {
    problems.push('missing viewBox attribute');
  }
  if (/<script[\s>]/i.test(svg)) {
    problems.push('contains a <script> tag');
  }
  if (/<foreignObject[\s>]/i.test(svg)) {
    problems.push('contains a <foreignObject> tag');
  }
  if (/<image[\s>]/i.test(svg)) {
    problems.push('contains an <image> tag (external raster reference)');
  }

  const ids = [...svg.matchAll(/\bid\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  if (dupes.size > 0) {
    problems.push(`duplicate ids: ${[...dupes].sort().join(', ')}`);
  }

  const stripped = stripNamespaces(svg);
  if (/https?:\/\//i.test(stripped)) {
    problems.push('contains an external http(s) reference');
  }
  if (/url\(\s*data:/i.test(stripped)) {
    problems.push('contains an embedded data: URI');
  }
  if (/\b(href|xlink:href|src)\s*=\s*"/i.test(stripped)) {
    problems.push('contains an href/src reference');
  }

  return problems;
}

function parseViewBox(svg: string): { w: number; h: number } {
  const m = svg.match(/viewBox\s*=\s*"([^"]+)"/);
  if (!m) throw new Error('viewBox missing');
  const parts = m[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  return { w: parts[2] ?? 0, h: parts[3] ?? 0 };
}

// ---------------------------------------------------------------------------
// Rasterization scale selection (deterministic per category)
// ---------------------------------------------------------------------------

function targetLongest1x(asset: BuildAsset): number {
  if (asset.category === 'rig') return 320;
  if (asset.category === 'effect') return 256;
  if (asset.category === 'ui') {
    if (asset.assetId.includes('/icons/')) return 96;
    if (asset.assetId.includes('/badges/')) return 256;
    return 640; // result frames / reward card
  }
  if (asset.category === 'arena') {
    const small = ['arena/elbow-pad', 'arena/pin-pad'];
    return small.includes(asset.assetId) ? 192 : 1024;
  }
  // portrait / reveal / versus / result fighter surfaces
  return 512;
}

function renderScales(asset: BuildAsset, vbW: number, vbH: number): { s1: number; s2: number } {
  const longest = Math.max(vbW, vbH);
  const s1 = targetLongest1x(asset) / longest;
  let s2 = s1 * 2;
  if (longest * s2 > MAX_LONG_SIDE) s2 = MAX_LONG_SIDE / longest;
  if (s2 < s1) s2 = s1;
  return { s1, s2 };
}

// ---------------------------------------------------------------------------
// Semantic anchors (grip / elbow / shoulder / hand) for rig parts
// ---------------------------------------------------------------------------

function semanticAnchors(asset: BuildAsset): {
  gripAnchor: Vec2 | null;
  elbowAnchor: Vec2 | null;
  shoulderAnchor: Vec2 | null;
  handAnchor: Vec2 | null;
} {
  const kind = asset.rig?.kind;
  const a = asset.anchor;
  return {
    shoulderAnchor: kind === 'shoulder' ? a : null,
    elbowAnchor: kind === 'elbow' ? a : null,
    handAnchor: kind === 'hand' ? a : null,
    // Grip contact sits near the distal tip of the hand bone.
    gripAnchor: kind === 'hand' ? { x: a.x, y: 0.9 } : null,
  };
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

type RasterResult = {
  assetId: string;
  width: number; // 1x px
  height: number; // 1x px
  files: Array<{ rel: string; bytes: number; hash: string }>;
  frame: { w: number; h: number }; // atlas frame (1x)
  png1xBuffer: Buffer;
};

async function rasterize(asset: BuildAsset, svg: string): Promise<RasterResult> {
  const { w: vbW, h: vbH } = parseViewBox(svg);
  const { s1, s2 } = renderScales(asset, vbW, vbH);
  const svgBuf = Buffer.from(svg);

  const files: RasterResult['files'] = [];
  let png1xBuffer = Buffer.alloc(0);
  let width1 = 0;
  let height1 = 0;

  const variants: Array<{ suffix: string; scale: number; kind: 'webp' | 'png' }> = [
    { suffix: '@1x.webp', scale: s1, kind: 'webp' },
    { suffix: '@2x.webp', scale: s2, kind: 'webp' },
    { suffix: '@1x.png', scale: s1, kind: 'png' },
    { suffix: '@2x.png', scale: s2, kind: 'png' },
  ];

  for (const v of variants) {
    const density = Math.max(1, Math.round(72 * v.scale));
    let pipeline = sharp(svgBuf, { density });
    if (v.kind === 'webp') {
      pipeline = pipeline.webp({ quality: WEBP_QUALITY, effort: 4, alphaQuality: 100 });
    } else {
      pipeline = pipeline.png({ compressionLevel: PNG_COMPRESSION, effort: 4 });
    }
    const buf = await pipeline.toBuffer();
    const rel = `${asset.outRel}${v.suffix}`;
    const abs = path.join(OUT_DIR, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, buf);
    files.push({
      rel,
      bytes: buf.length,
      hash: createHash('sha256').update(buf).digest('hex'),
    });
    if (v.suffix === '@1x.png') {
      png1xBuffer = buf;
      const meta = await sharp(buf).metadata();
      width1 = meta.width ?? 0;
      height1 = meta.height ?? 0;
    }
  }

  return {
    assetId: asset.assetId,
    width: width1,
    height: height1,
    files,
    frame: { w: width1, h: height1 },
    png1xBuffer,
  };
}

// ---------------------------------------------------------------------------
// Shelf-packed texture atlas (PixiJS TexturePacker-compatible JSON)
// ---------------------------------------------------------------------------

type ShelfFrame = { assetId: string; x: number; y: number; w: number; h: number };

function packShelves(
  items: Array<{ assetId: string; w: number; h: number; buf: Buffer }>,
  maxW: number,
): { frames: ShelfFrame[]; width: number; height: number } {
  const sorted = [...items].sort((a, b) => b.h - a.h || a.assetId.localeCompare(b.assetId));
  const frames: ShelfFrame[] = [];
  let shelfY = 0;
  let shelfH = 0;
  let cursorX = 0;
  let totalW = 0;
  const pad = 1;
  for (const it of sorted) {
    if (cursorX + it.w > maxW) {
      shelfY += shelfH + pad;
      shelfH = 0;
      cursorX = 0;
    }
    frames.push({ assetId: it.assetId, x: cursorX, y: shelfY, w: it.w, h: it.h });
    cursorX += it.w + pad;
    shelfH = Math.max(shelfH, it.h);
    totalW = Math.max(totalW, cursorX);
  }
  const height = shelfY + shelfH;
  // Round up to power-of-two-ish stable size.
  const width = Math.max(1, totalW);
  return { frames, width, height };
}

async function buildAtlas(
  results: Array<{ assetId: string; png1xBuffer: Buffer; frame: { w: number; h: number } }>,
): Promise<{ json: string; bytes: number; hash: string }> {
  const items = results
    .filter((r) => r.png1xBuffer.length > 0 && r.frame.w > 0 && r.frame.h > 0)
    .map((r) => ({ assetId: r.assetId, w: r.frame.w, h: r.frame.h, buf: r.png1xBuffer }));

  const { frames, width, height } = packShelves(items, 1024);
  const { frames, width, height } = packShelves(items, 2048);
  const atlas = sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  });
  const composites = await Promise.all(
    frames.map(async (f) => {
      const item = items.find((i) => i.assetId === f.assetId)!;
      return { input: item.buf, left: f.x, top: f.y };
    }),
  );
  const atlasPng = await atlas
    .composite(composites)
    .png({ compressionLevel: PNG_COMPRESSION })
    .toBuffer();

  const framesJson: Record<string, unknown> = {};
  for (const f of [...frames].sort((a, b) => a.assetId.localeCompare(b.assetId))) {
    framesJson[f.assetId] = {
      frame: { x: f.x, y: f.y, w: f.w, h: f.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
      sourceSize: { w: f.w, h: f.h },
    };
  }

  const json = JSON.stringify(
    {
      frames: framesJson,
      meta: {
        app: 'armz-clash/build-game-assets',
        version: ASSET_VERSION,
        image: 'phase3-3b.png',
        format: 'RGBA8888',
        size: { w: width, h: height },
        scale: '1',
      },
    },
    null,
    2,
  );

  const atlasDir = path.join(OUT_DIR, 'atlases');
  mkdirSync(atlasDir, { recursive: true });
  writeFileSync(path.join(atlasDir, 'phase3-3b.png'), atlasPng);
  writeFileSync(path.join(atlasDir, 'phase3-3b.json'), json);

  return {
    json,
    bytes: atlasPng.length,
    hash: createHash('sha256').update(atlasPng).digest('hex'),
  };
}

// ---------------------------------------------------------------------------
// Manifests
// ---------------------------------------------------------------------------

function writeJson(rel: string, data: unknown): void {
  const abs = path.join(OUT_DIR, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`);
}

async function main(): Promise<void> {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`FAIL: source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // Clean previous runtime output for a deterministic rebuild.
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const inventory = buildInventory();
  const problems: ValidationProblem[] = [];
  const svgByAsset = new Map<string, string>();

  // Validate + read all sources first (fail fast before rasterizing).
  for (const asset of inventory) {
    const abs = path.join(SOURCE_DIR, asset.sourceRel);
    if (!existsSync(abs)) {
      problems.push({
        assetId: asset.assetId,
        sourceRel: asset.sourceRel,
        problem: 'source file missing',
      });
      continue;
    }
    const svg = readFileSync(abs, 'utf8');
    svgByAsset.set(asset.assetId, svg);
    for (const p of validateSvg(asset.assetId, asset.sourceRel, svg)) {
      problems.push({ assetId: asset.assetId, sourceRel: asset.sourceRel, problem: p });
    }
  }

  if (problems.length > 0) {
    console.error(`FAIL: ${problems.length} SVG validation problem(s):`);
    for (const p of problems) {
      console.error(`  - ${p.assetId} (${p.sourceRel}): ${p.problem}`);
    }
    process.exit(1);
  }
  console.log(`Validated ${inventory.length} SVG sources (0 problems).`);

  // Rasterize (sequential for stable memory + deterministic ordering).
  const results: RasterResult[] = [];
  for (const asset of inventory) {
    const svg = svgByAsset.get(asset.assetId)!;
    const res = await rasterize(asset, svg);
    results.push(res);
  }
  console.log(`Rasterized ${results.length} assets to WebP + PNG at 1x/2x.`);

  // Atlas.
  const atlas = await buildAtlas(results);
  console.log(`Built texture atlas (${atlas.bytes} bytes).`);

  // Asset manifest.
  const assetsJson: Record<string, unknown> = {};
  const hashes: Record<string, string> = {};
  const sizeRows: Array<{ assetId: string; bytes: number; files: number }> = [];

  for (const asset of inventory) {
    const res = results.find((r) => r.assetId === asset.assetId)!;
    const sem = semanticAnchors(asset);
    const fileBySuffix = new Map(res.files.map((f) => [f.rel.split('/').pop()!, f]));
    const pick = (suffix: string) =>
      fileBySuffix.get(`${path.basename(asset.outRel)}${suffix}`)?.rel ?? '';
    for (const f of res.files) hashes[f.rel] = f.hash;

    const poseCompatibility = asset.category === 'rig' ? POSES.map((p) => p.poseId) : [];

    assetsJson[asset.assetId] = {
      assetId: asset.assetId,
      fighterId: asset.fighterId,
      sourceSvgPath: `apps/game/assets/source/${asset.sourceRel}`,
      runtimeTexturePath: pick('@2x.webp'),
      width: res.width,
      height: res.height,
      pixelDensity: 2,
      anchor: asset.anchor,
      pivot: asset.pivot,
      gripAnchor: sem.gripAnchor,
      elbowAnchor: sem.elbowAnchor,
      shoulderAnchor: sem.shoulderAnchor,
      handAnchor: sem.handAnchor,
      boundingBox: { x: 0, y: 0, w: res.width, h: res.height },
      poseCompatibility,
      desktopTexture: pick('@2x.webp'),
      tabletTexture: pick('@2x.webp'),
      mobileTexture: pick('@1x.webp'),
      pngFallback: {
        desktop: pick('@2x.png'),
        tablet: pick('@2x.png'),
        mobile: pick('@1x.png'),
      },
      atlasKey: asset.assetId,
      materialCategory: asset.materialCategory,
      assetVersion: ASSET_VERSION,
    };

    sizeRows.push({
      assetId: asset.assetId,
      bytes: res.files.reduce((s, f) => s + f.bytes, 0),
      files: res.files.length,
    });
  }

  writeJson('manifests/asset-manifest.json', {
    version: ASSET_VERSION,
    generatedBy: 'scripts/build-game-assets.ts',
    assetCount: inventory.length,
    assets: assetsJson,
  });

  // Rig manifest (bone metadata for the FK solver).
  writeJson('manifests/rig-manifest.json', {
    version: ASSET_VERSION,
    fighters: {
      'rookie-brawler': ALL_RIG_PARTS.filter((p) => p.fighterId === 'rookie-brawler'),
      'practice-automaton': ALL_RIG_PARTS.filter((p) => p.fighterId === 'practice-automaton'),
    },
  });

  // Pose manifest.
  writeJson('manifests/pose-manifest.json', {
    version: ASSET_VERSION,
    poses: POSES,
    cueToPose: CUE_TO_POSE,
    cameraPresets: CAMERA_PRESETS,
  });

  // Hashes (sorted) for determinism checks.
  const sortedHashes: Record<string, string> = {};
  for (const key of Object.keys(hashes).sort()) sortedHashes[key] = hashes[key];
  sortedHashes['atlases/phase3-3b.png'] = atlas.hash;
  writeJson('manifests/hashes.json', { version: ASSET_VERSION, hashes: sortedHashes });

  // Size report JSON + markdown doc.
  sizeRows.sort((a, b) => a.assetId.localeCompare(b.assetId));
  const totalBytes = sizeRows.reduce((s, r) => s + r.bytes, 0) + atlas.bytes;
  writeJson('manifests/asset-size-report.json', {
    version: ASSET_VERSION,
    totalBytes,
    atlasBytes: atlas.bytes,
    assets: sizeRows,
  });

  const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
  const md = [
    '# Phase 3.3B Asset Size Report',
    '',
    `> Generated by \`scripts/build-game-assets.ts\` (asset version \`${ASSET_VERSION}\`). Do not edit by hand.`,
    '',
    `- Total runtime texture bytes (all variants + atlas): **${kb(totalBytes)}**`,
    `- Texture atlas (\`atlases/phase3-3b.png\`): **${kb(atlas.bytes)}**`,
    `- Asset count: **${inventory.length}** (each emitted as WebP + PNG at 1x and 2x)`,
    '',
    '| Asset | Files | Bytes |',
    '| --- | ---: | ---: |',
    ...sizeRows.map((r) => `| ${r.assetId} | ${r.files} | ${kb(r.bytes)} |`),
    '',
  ].join('\n');
  mkdirSync(DOCS_DIR, { recursive: true });
  writeFileSync(path.join(DOCS_DIR, 'PHASE3_3B_ASSET_SIZE_REPORT.md'), md);

  console.log(`Wrote manifests + atlas + size report to ${path.relative(ROOT, OUT_DIR)}.`);
  console.log(`Total runtime texture bytes: ${totalBytes} (${kb(totalBytes)}).`);
}

main().catch((err) => {
  console.error('FAIL: asset build error');
  console.error(err);
  process.exit(1);
});
