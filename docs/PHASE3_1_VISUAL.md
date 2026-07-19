# Phase 3.1 — Visual overhaul

## Status

Phase 3.1 upgrades Demo Mode presentation to **upgraded hybrid assets (tier B)**, approaching near-production demo quality for UI chrome and collectible identity. Full multi-frame sprite production remains out of scope.

## Asset classification

| Area               | Before                        | After                                                             |
| ------------------ | ----------------------------- | ----------------------------------------------------------------- |
| Common ARMZ        | Flat CSS boxes / palette-only | Layered original SVG portraits per preset                         |
| Practice Automaton | Palette text only             | Dedicated mechanical SVG portrait                                 |
| Battle             | Procedural stick arms         | Premium multi-segment arms, arena lighting, grip glow, impact VFX |
| Shell / nav        | Plain text links              | Pill tab rail with active/disabled states                         |
| Buttons            | Partial states                | Cursor, hover, press, focus-visible, disabled                     |
| Collection         | Spreadsheet-like stats        | Collectible layout + stat meters + portrait                       |

## Visual system

- Deep navy base, muted gold primary accent, electric cyan secondary
- Premium panels (layered borders, soft glow, glass/dark metal shell)
- Stat meters, rarity tokens, strength HUD, result banners
- Tokens live in `packages/ui/src/styles.css` and `tokens.ts`

## Common ARMZ identity (six presets)

Each preset has distinct wrap/material treatment in `ArmzPortrait`:

1. Rookie Brawler — leather wraps
2. Dockhand — work sleeve + stripes
3. Street Challenger — athletic wraps
4. Iron Apprentice — metal bracer
5. Desert Grappler — cloth wraps
6. Arena Recruit — tournament glove plate

## Honest limitations

- Portraits are hybrid SVG illustration, not painted sprite sheets
- Battle fighters remain procedural Graphics (enhanced), not full skeletal animation packs
- No Phase 4 real inventory art pipeline

## Owner check

```bash
pnpm dev:api
pnpm dev:game
# http://127.0.0.1:3001/demo
```
