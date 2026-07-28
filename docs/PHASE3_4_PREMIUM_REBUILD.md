# Phase 3.4 Premium Rebuild

**Implementation status:** PASSED LOCALLY
**Final premium asset gate:** BLOCKED — 0/27 owner assets supplied
**Owner visual acceptance:** PENDING OWNER TEST
**Phase 4:** Not started

## Objective

Phase 3.4 resets the owner-reviewable experience around one coherent flagship matchup: **Rookie Brawler versus Practice Automaton**. It replaces the dashboard-like flow with a dense, cinematic game presentation while preserving the existing server-authoritative simulation, short battle pacing, Demo Mode safety, and real-value feature boundaries.

The implementation is ready to consume transparent owner-generated PNG/WebP artwork. Legacy Phase 3.3B raster textures and the sprite rig remain visibly labeled temporary fallbacks because no owner-approved final pack was attached or present in the repository.

## Baseline audit

The running Phase 3.3B build was inspected before implementation across landing, reveal/session restore, collection, versus, live battle, result, desktop, tablet, and mobile.

### Kept because it was structurally strong

- Server-authoritative battle payload and final Control values
- Existing 8–12 second timeline generation and cue vocabulary
- `done && finalSynced` result gate
- Pixi renderer lifecycle and reduced-motion pathway
- Demo session, cooldown, history, and simulated reward safety data
- Web Audio synthesis and autoplay-safe controls
- Phase 3.3B textures only as explicit temporary compatibility fallbacks

### Rebuilt because it was visually or ergonomically weak

- Generic landing and card-grid hierarchy
- Crowded/wrapping header navigation
- Random Common identity in the flagship flow
- Procedural React portrait component
- Collection page with excessive height and weak mobile CTA placement
- Two-step fight confirmation and low-energy matchup framing
- Battle camera with too much dead space and hands below the primary focal area
- HUD and result controls that could move outside a phone viewport
- Result composition whose title/actions could be clipped after focus or scroll
- Asset status that did not distinguish final art from fallback art strongly enough

### Deleted

- `apps/game/src/features/demo/art/ArmzPortrait.tsx`
- Its procedural portrait regression test

The renderer’s old sprite rig was not deleted because it is the required battle fallback until final battle-side art arrives. It is labeled temporary in both manifest and UI.

## Design system

The shared UI tokens and game styles now define:

- Deep navy, graphite, near-black surfaces
- Muted championship gold and premium cyan energy accents
- Enemy orange/red, success, danger, and readable neutral ramps
- Denser page spacing with phone/tablet safe-area variables
- Game panels with restrained gradients, rim lighting, and atmospheric shadows
- Display typography roles for hero, fighter, event, and result titles
- Compact metadata/safety roles that cannot overpower gameplay content
- Primary, secondary, ghost, danger, cyan, and icon button states
- Premium badges, stat boards, Control bars, nav tabs, and result cards
- Visible focus, pointer/not-allowed cursors, loading, pressed, and disabled behavior
- A code-native SVG icon set for Arena, Collection, Battle, History, wallet, sound, music, motion, replay, skip, and lock actions

## Surface rebuild

### Landing

- Three-part Rookie Brawler / central message / Practice Automaton hero
- One primary **Play Demo** CTA and one real wallet-access CTA
- Concise Demo Mode and no-value safety copy
- Flagship matchup band and cinematic atmosphere
- Below-the-fold reveal-to-slam explanation, optional wallet section, and locked roadmap
- No generic dashboard card grid

### Shell and navigation

- Desktop: brand and mode left, centered live/future navigation, safety/wallet utility right
- Compact desktop breakpoint prevents nav/utility overlap
- Tablet: clean top utility plus centered bottom game nav
- Mobile: compact top bar plus four-item bottom nav with safe-area spacing
- Future Marketplace/Claims remain in the DOM as intentionally disabled desktop items
- No horizontal nav overflow

### Reveal

- Deterministic Rookie Brawler spotlight
- Three-step identity/stat synchronization sequence
- Common/Level 1/Demo Mode status and grouped fighter stats
- Continue CTA unlocks after the reveal sequence, immediately under reduced motion

### Collection

- Large fighter showcase, clear identity, stats, simulated balance, opponent preview, battles remaining, and history
- Phone layout compacts to art + 4×2 stat board with a fixed Fight CTA above bottom navigation
- Loading state says the contender is synchronizing rather than claiming no ARMZ exists

### Versus

- Full visual face-off with one-click **Start Battle**
- Estimated matchup, duration, simulated reward range, and battle count
- No redundant second confirmation after the disclosure

### Battle and result

- Viewport-sized arena, centered grip, stronger table scale, and responsive camera presets
- Premium HUD cards and event cue with sound/music/motion/skip controls
- Truthful skip, completed-result persistence, and focus without page scrolling
- Full-viewport Victory/Defeat composition with both fighter states, final Control, reward/training feedback, and all three actions

See [PHASE3_4_BATTLE_PRESENTATION.md](PHASE3_4_BATTLE_PRESENTATION.md) and [PHASE3_4_RESULT_UX.md](PHASE3_4_RESULT_UX.md).

## Asset-driven boundary

All primary surfaces render through typed Phase 3.4 asset IDs. At runtime:

1. A compiled missing-final manifest prevents hydration or fetch failure from breaking the UI.
2. The generated manifest upgrades individual slots only when the matching owner source exists.
3. Critical landing assets are preloaded for the active viewport.
4. Battle loading maps final arena/effect/battle-side assets into Pixi when available.
5. Missing slots resolve only to declared legacy fallbacks or an explicit owner-slot panel.
6. Every fallback can be identified through `data-asset-status="temporary-placeholder"` and visible status copy where appropriate.

Current status is **0/27 final**. Therefore the implementation/pipeline can pass engineering gates, but premium-art completion is **BLOCKED** and owner visual acceptance is **PENDING OWNER TEST**.

## Scope boundaries preserved

Not implemented or enabled:

- Phase 4
- Other five Common ARMZ expansion
- Real inventory, minting, rewards, claims, transfers, withdrawals, marketplace settlement, oracle pricing, mainnet, PvP, medium/hard active battles, or staking

Demo Mode remains on; every real-value flag remains off.
