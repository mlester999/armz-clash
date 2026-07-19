# Phase 3 Asset Manifest

## Skill usage

| Skill                      | How applied                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| game-asset-core            | Procedural fighters isolated on dark arena; no historical screenshot assets; stable canvas size; transparent-equivalent clean edges via Graphics |
| game-animation-frames      | Timeline-driven cues: idle, entrance, approach, grip, strain__, push__, counter, critical, recovery, fatigue, winning_slam, defeated             |
| game-character-consistency | Six Common presets with fixed palette (skin/cloth/accent/glove) across all cues                                                                  |
| game-tilesets              | Arena background band tiling + table material bands                                                                                              |
| game-ui-icons              | Strength meters, Common/Demo badges, disclosure icons as UI chrome (no baked text in sprites)                                                    |

## Presets (temporary Common ARMZ)

| key               | displayName       | cosmeticVariant  | animationSetKey  |
| ----------------- | ----------------- | ---------------- | ---------------- |
| rookie_brawler    | Rookie Brawler    | leather_wrap     | common_player_v1 |
| dockhand          | Dockhand          | work_glove       | common_player_v1 |
| street_challenger | Street Challenger | athletic_wrap    | common_player_v1 |
| iron_apprentice   | Iron Apprentice   | metal_bracer     | common_player_v1 |
| desert_grappler   | Desert Grappler   | cloth_wraps      | common_player_v1 |
| arena_recruit     | Arena Recruit     | tournament_glove | common_player_v1 |

## Opponent

| key                | displayName        | difficulty | animationSetKey  |
| ------------------ | ------------------ | ---------- | ---------------- |
| practice_automaton | Practice Automaton | easy       | easy_opponent_v1 |

## Animation cues

See `packages/game-core/src/demo/timeline.ts` — `ANIMATION_CUES`, `SOUND_CUES`, `VFX_CUES`.

## Rendering approach

- **Primary:** PixiJS v8 procedural Graphics (multi-segment arms, metallic table, particles)
- **Why not full sprite sheets in Phase 3:** deterministic CI builds, zero unlicensed art, consistent anchors
- **Future Phase 4+:** replace procedural limbs with validated sprite sheets while keeping the same cue names

## Validation checklist

- [x] No historical screenshot assets in public game paths
- [x] Common-only demo pool (6 presets)
- [x] Anchored elbow/shoulder segments (not single-pivot)
- [x] Palette stable per preset
- [x] Reduced-motion path shortens timeline scale and disables shake/particles
- [x] Strength bars use numeric labels (not color alone)
