# Phase 3.4A Arena and Table Repair

## Arena background

The arena background now uses aspect-preserving cover layout. Source aspect ratio is never changed.
Its normalized source focal point is aligned to a responsive viewport focus and then clamped so the
viewport remains covered.

Viewport focus presets:

| Viewport | Focus          |
| -------- | -------------- |
| Desktop  | `(0.50, 0.42)` |
| Tablet   | `(0.50, 0.38)` |
| Mobile   | `(0.50, 0.32)` |

Cropping is expected. Stretching is forbidden. Unit coverage includes every required desktop,
tablet, and mobile viewport from the owner matrix.

## Atomic table pack

Chosen contract:

- `arena/table-surface` — `2200×760`, transparent
- `arena/table-frame` — `2200×900`, transparent
- `arena/elbow-pad` — `640×360`, transparent
- `arena/pin-pad` — `480×720`, transparent

Surface and frame are Tier A and load atomically. If either file is missing or fails to load, both
Phase 3.3B table textures stay active. A complete premium pair replaces both legacy table textures;
there is no hidden old-frame dependency. Pads are Tier B and upgrade independently because they are
explicitly visible, separate assets.

## Responsive placement

The renderer recomputes arena sprite layout when its canvas dimensions change. Background cover,
table/frame scale, elbow centers, and pin-pad baselines follow the current scene geometry. The table
and frame preserve their individual source aspect ratios.
