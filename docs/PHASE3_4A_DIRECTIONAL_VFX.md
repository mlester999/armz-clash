# Phase 3.4A Directional VFX

## Spawn contract

Each VFX spawn carries direction, rotation, horizontal flip, scale, intensity tier, opacity, lifetime,
velocity, blend mode, z-index, origin, and optional destination. Production uses bounded counts and a
32-sprite live cap.

Intensity tiers:

| Tier       | Scale | Intended use            |
| ---------- | ----: | ----------------------- |
| `light`    |  0.75 | minor pressure          |
| `medium`   |  1.00 | grip/recovery           |
| `heavy`    |  1.35 | strong pressure/counter |
| `critical` |  1.75 | critical impact         |
| `final`    |  2.60 | terminal slam           |

## Direction behavior

- Player pressure travels right toward the opponent pin.
- Opponent pressure travels left toward the player pin.
- Left-moving directional art rotates 180 degrees and flips horizontally.
- Counter uses the inverse of the previous momentum direction.
- Grip/recovery/outcome cues remain centered.
- Final slam receives the pin destination and is not restricted to tiny particle sizing.

The final-slam contract starts at 170 pixels and permits up to 360 pixels, while normal push starts at
90 pixels and caps at 180. Unit tests enforce final-slam dominance.

## Production mapping

Phase 3.4A IDs continue to replace the Phase 3.3B texture-map aliases while fallbacks are active:

- `grip-lock` → `grip-flash`
- `push-streak` → `momentum-streak`
- `counter-burst` → `pressure-ring`
- `recovery-cue` → `recovery-glow`
- `final-slam` → `slam-impact`
- victory/defeat transitions → their legacy accent aliases

Result accents remain separate full-result assets and are not duplicated by these battle-transition
sprites.
