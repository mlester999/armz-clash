# Phase 3.4 Asset Pipeline

**Manifest version:** `phase3-4-owner-drop-v1`
**Required slots:** 27
**Integrated final slots:** 0
**Missing-final slots:** 27
**Owner asset status:** `awaiting-owner-assets`
**Premium asset completion:** BLOCKED

No owner-approved PNG/WebP files were attached or found in the repository. The manifest, builder, runtime resolver, preloader, Pixi mapping, responsive variants, and fallback states are implemented; the legacy art visible in the current build is explicitly temporary.

## Source and output separation

Owner source files:

```text
apps/game/assets/phase3-4/final/<source-stem>.png
# or
apps/game/assets/phase3-4/final/<source-stem>.webp
```

Generated runtime files:

```text
apps/game/public/assets/game/phase3-4/final/<runtime-stem>@1x.webp
apps/game/public/assets/game/phase3-4/final/<runtime-stem>@2x.webp
apps/game/public/assets/game/phase3-4/final/<runtime-stem>@1x.png
apps/game/public/assets/game/phase3-4/final/<runtime-stem>@2x.png
```

Generated manifests:

```text
apps/game/public/assets/game/phase3-4/manifests/asset-manifest.json
apps/game/public/assets/game/phase3-4/manifests/version-manifest.json
```

Temporary Phase 3.3B files stay under their existing `phase3-3b` paths and are never copied into the Phase 3.4 `final` directory.

## Exact owner drop contract

Provide **one** source format per stem. Supplying both `.png` and `.webp` for the same stem is a build error. Dimensions below are the emitted 2× canvas; 1× is half size. Transparent sources should preserve clean alpha with no baked background, glow crop, text, or UI frame.

|   # | Asset ID                            | Required source stem                         |   2× size | Alpha | Current fallback            |
| --: | ----------------------------------- | -------------------------------------------- | --------: | :---: | --------------------------- |
|   1 | `rookie-brawler/hero`               | `fighters/rookie-brawler/hero`               | 1600×2000 |  Yes  | Phase 3.3B reveal raster    |
|   2 | `rookie-brawler/portrait`           | `fighters/rookie-brawler/portrait`           | 1200×1200 |  Yes  | Phase 3.3B portrait raster  |
|   3 | `rookie-brawler/versus`             | `fighters/rookie-brawler/versus`             | 1400×1900 |  Yes  | Phase 3.3B versus raster    |
|   4 | `rookie-brawler/battle-side`        | `fighters/rookie-brawler/battle-side`        | 1800×1600 |  Yes  | Phase 3.3B sprite rig       |
|   5 | `rookie-brawler/result-victory`     | `fighters/rookie-brawler/result-victory`     | 1400×1900 |  Yes  | Phase 3.3B result raster    |
|   6 | `rookie-brawler/result-defeat`      | `fighters/rookie-brawler/result-defeat`      | 1400×1900 |  Yes  | Phase 3.3B result raster    |
|   7 | `practice-automaton/hero`           | `fighters/practice-automaton/hero`           | 1600×2000 |  Yes  | Phase 3.3B portrait raster  |
|   8 | `practice-automaton/portrait`       | `fighters/practice-automaton/portrait`       | 1200×1200 |  Yes  | Phase 3.3B portrait raster  |
|   9 | `practice-automaton/versus`         | `fighters/practice-automaton/versus`         | 1400×1900 |  Yes  | Phase 3.3B versus raster    |
|  10 | `practice-automaton/battle-side`    | `fighters/practice-automaton/battle-side`    | 1800×1600 |  Yes  | Phase 3.3B sprite rig       |
|  11 | `practice-automaton/result-victory` | `fighters/practice-automaton/result-victory` | 1400×1900 |  Yes  | Phase 3.3B result raster    |
|  12 | `practice-automaton/result-defeat`  | `fighters/practice-automaton/result-defeat`  | 1400×1900 |  Yes  | Phase 3.3B result raster    |
|  13 | `arena/background`                  | `arena/background`                           | 2560×1440 |  No   | Phase 3.3B arena raster     |
|  14 | `arena/table`                       | `arena/table`                                |  2200×760 |  Yes  | Phase 3.3B table raster     |
|  15 | `arena/elbow-pad`                   | `arena/elbow-pad`                            |   640×360 |  Yes  | Phase 3.3B elbow-pad raster |
|  16 | `arena/pin-pad`                     | `arena/pin-pad`                              |   480×720 |  Yes  | Phase 3.3B pin-pad raster   |
|  17 | `effects/grip-lock`                 | `effects/grip-lock`                          | 1024×1024 |  Yes  | Phase 3.3B grip flash       |
|  18 | `effects/push-streak`               | `effects/push-streak`                        | 1024×1024 |  Yes  | Phase 3.3B momentum streak  |
|  19 | `effects/counter-burst`             | `effects/counter-burst`                      | 1024×1024 |  Yes  | Phase 3.3B pressure ring    |
|  20 | `effects/critical-impact`           | `effects/critical-impact`                    | 1024×1024 |  Yes  | Phase 3.3B critical impact  |
|  21 | `effects/recovery-cue`              | `effects/recovery-cue`                       | 1024×1024 |  Yes  | Phase 3.3B recovery glow    |
|  22 | `effects/final-slam`                | `effects/final-slam`                         | 1024×1024 |  Yes  | Phase 3.3B slam impact      |
|  23 | `effects/victory-sweep`             | `effects/victory-sweep`                      | 1024×1024 |  Yes  | Phase 3.3B victory accent   |
|  24 | `effects/defeat-dim`                | `effects/defeat-dim`                         | 1024×1024 |  Yes  | Phase 3.3B defeat accent    |
|  25 | `result/victory-accent`             | `result/victory-accent`                      |  1600×900 |  Yes  | Phase 3.3B victory accent   |
|  26 | `result/defeat-accent`              | `result/defeat-accent`                       |  1600×900 |  Yes  | Phase 3.3B defeat accent    |
|  27 | `ui/championship-corner`            | `ui/championship-corner`                     | 1024×1024 |  Yes  | Explicit empty slot         |

## Battle-side alignment

Battle-side art is one transparent side-view presentation per fighter. The runtime applies pose translation/rotation/scale around the typed anchor points while preserving server cue timing.

| Fighter            | Anchor         | Pivot          | Grip point     | Elbow point    |
| ------------------ | -------------- | -------------- | -------------- | -------------- |
| Rookie Brawler     | `(0.50, 0.58)` | `(0.50, 0.66)` | `(0.82, 0.22)` | `(0.58, 0.68)` |
| Practice Automaton | `(0.50, 0.58)` | `(0.50, 0.66)` | `(0.18, 0.22)` | `(0.42, 0.68)` |

Coordinates are normalized from the top-left of the transparent source. Both grip points should describe the center of hand contact in the neutral grip pose. Elbow points should land at the visible pad-contact center. Required pose usages are `ready`, `grip`, `light-advantage`, `strong-advantage`, `counter`, `critical`, `recovery`, and `final-slam`.

If later owner art requires separately authored pose frames instead of transform-driven presentation, extend the manifest version and contract explicitly; do not overload filenames silently.

## Build behavior

```bash
pnpm build:assets:phase34
pnpm assets:validate
```

The builder:

1. Verifies every write remains inside the Phase 3.4 generated output root.
2. Clears only the generated `phase3-4/final` runtime directory.
3. Finds exactly one PNG or WebP source per declared stem.
4. Resizes transparent art with `contain` and backgrounds with `cover`.
5. Emits WebP at quality 88/alpha 95 plus lossless-compatible PNG fallback.
6. Computes SHA-256 for each supplied source.
7. Writes sorted deterministic manifests with no timestamps.
8. Marks supplied files `final` and missing files `missing-final`.
9. Reports the exact integrated/required count.

With the current repository, expected output is:

```text
Phase 3.4 assets: 0/27 final; 27 awaiting owner files.
```

## Runtime behavior

- `PremiumAssetProvider` starts with a compiled missing-final contract so SSR/hydration and a failed manifest fetch remain safe.
- The generated manifest is fetched once and upgrades slots individually.
- Desktop/tablet resolve to 2×; mobile resolves to 1×.
- Critical landing/reveal art is preloaded after manifest resolution.
- React surfaces use the same fighter asset IDs across landing, reveal, collection, versus, history, and result.
- Pixi maps final arena, effects, and both `battle-side` slots when available.
- A battle-side pair upgrades atomically; otherwise both fighters stay on the visibly temporary sprite-rig fallback to avoid mixed identities.
- A final URL load failure falls back only to the slot’s declared fallback.
- `ui/championship-corner` has no fallback and renders an explicit missing owner slot.

Large independent hero/arena images are intentionally not packed into an atlas. An atlas would force unrelated route assets into one download and make individual owner replacement/versioning harder. Effect sprites may move to a versioned atlas after the final effect pack is supplied and measured; no empty or fake atlas is emitted now.

## Validation rules

`pnpm assets:validate` verifies:

- Exactly 27 unique contract and manifest slots
- Valid public runtime paths and source paths
- Honest `0 final / 27 missing-final` status while files are absent
- Required fallback state, including sprite-rig battle fallback and explicit no-fallback UI slot
- Manifest/version-manifest count and version agreement
- Density, viewport, dimensions, normalized anchors, grip points, and elbow points

Final premium-art completion remains **BLOCKED** until all owner-approved files are supplied, built, visually inspected, and approved. Owner acceptance remains **PENDING OWNER TEST**.
