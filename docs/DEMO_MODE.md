# Demo Mode

**Status:** Active
**Last Updated:** 2026-07-21 (Phase 3.3B)

---

## Overview

Demo Mode is the local development and testing environment for ARMZ CLASH. It provides a complete gameplay loop without requiring wallet authentication, mainnet connectivity, or real-value systems.

**URL:** `http://127.0.0.1:3001/demo`

---

## Starting Demo Mode

```bash
# Terminal 1: API server
pnpm dev:api

# Terminal 2: Game client
pnpm dev:game

# Browser
open http://127.0.0.1:3001/demo
```

---

## Demo Flow

1. **Reveal** — Player ARMZ reveal animation
2. **Collection** — View collected ARMZ roster
3. **Opponent Selection** — Choose opponent (Practice Automaton in Phase 3.3B)
4. **Versus Screen** — Pre-battle presentation
5. **Battle** — Real-time arm-wrestling simulation (~8–12s)
6. **Result** — Victory/Defeat cinematic sequence
7. **Replay** — Return to battle or collection

---

## Phase 3.3B Visual Upgrades

### Textured Sprite Rigs

- **Rookie Brawler** (player): 12-layer sprite rig with hand-authored SVG artwork
- **Practice Automaton** (opponent): 11-layer sprite rig with mechanical illustration
- Remaining five Common ARMZ: procedural rendering (unchanged)

### Arena

- Authored SVG textures: championship table, elbow pads, pin pads, metal frame
- Crowd silhouettes, banners, spotlights
- Responsive camera presets (desktop/tablet/mobile)

### VFX

- Authored effect sprites: grip flash, pressure rings, momentum streaks, critical impact, slam shockwave
- Reduced-motion mode: static indicators instead of animated particles

### Audio

- **Synthesized live via Web Audio API** — no downloaded or copyrighted audio
- Cues: ambience, grip lock, strain, impacts, critical, recovery, final slam, victory/defeat
- SFX/music toggles persist in localStorage
- No sound before user interaction (autoplay compliant)

### Result Sequence

- Large VICTORY/DEFEAT title with animation
- Winner/loser portrait row
- Final Control values
- Simulated reward card ("No monetary value", "Not claimable")
- Stays inside viewport — no scrolling required

---

## Battle Pacing

- **Total duration:** ~8–12s (average ~11s)
- **Grip lock:** ~2.2s
- **Active struggle:** ~3s
- **Final slam:** ~1s

Server result is authoritative. Visual animation never changes or invents outcome.

---

## Viewport Support

Tested at:

- Desktop: 1920×1080, 1440×900, 1366×768, 1280×720
- Tablet: 1024×1366, 820×1180, 768×1024
- Mobile: 430×932, 393×852, 390×844, 375×812, 360×800

No horizontal overflow, no clipped artwork, no hidden controls, safe-area handling.

---

## Accessibility

- Keyboard navigation
- Visible focus indicators
- Reduced-motion support
- Screen-reader result announcement (once on finalSynced)
- Touch targets ≥44px
- Contrast compliant
- No color-only meaning
- Accessible labels for fighter art

---

## Quality Gates

```bash
pnpm build:assets          # Build SVG → texture pipeline
pnpm test:unit             # 137 tests including Phase 3.3B regression
pnpm typecheck
pnpm lint
pnpm format:check
```

---

## Documentation

- [Phase 3.3B Asset Pipeline](PHASE3_3B_QWEN_ONLY_ASSET_PIPELINE.md)
- [Phase 3.3B Vector Art Manifest](PHASE3_3B_VECTOR_ART_MANIFEST.md)
- [Phase 3.3B Rig and Pose Manifest](PHASE3_3B_RIG_AND_POSE_MANIFEST.md)
- [Phase 3.3B VFX and Audio](PHASE3_3B_VFX_AND_AUDIO.md)
- [Phase 3.3B Owner Acceptance](PHASE3_3B_OWNER_ACCEPTANCE.md)
- [Phase 3.3B Asset Size Report](PHASE3_3B_ASSET_SIZE_REPORT.md)
