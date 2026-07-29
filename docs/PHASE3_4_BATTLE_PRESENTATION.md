# Phase 3.4 Battle Presentation

**Engineering status:** superseded by the implemented Phase 3.4A contract repair
**Final battle art:** BLOCKED — layered rig, arena, complete table, pad, and effect files are missing
**Owner visual acceptance:** PENDING OWNER TEST

## Composition

The battle view is a dedicated viewport-sized scene rather than a page section. The fixed shell is included in the height calculation, and mobile/tablet bottom navigation is excluded from the usable arena area.

The camera presets keep:

- Grip near the horizontal visual center
- Both forearms dominant in the frame
- Elbows visibly connected to pads
- Table and pin pads readable without competing with the hands
- HUD above the action and presentation controls in a lower corner
- No document scrolling during active battle

Desktop emphasizes table width and both silhouettes. Tablet uses the same central grip with tighter side cropping. Mobile rotates emphasis vertically, enlarges the forearms, and keeps the event cue below the two compact fighter HUD cards.

Phase 3.4A removes final `battle-side` art. Each fighter now has four required articulated layers and
two optional polish layers. The premium renderer activates only when all eight required layers for
both fighters are final and loaded. Both rigs share one world-space grip, keep their elbows planted,
and independently articulate upper arm, forearm, wrist, and hand. If the pair is incomplete, both
fighters remain on the Phase 3.3B layered rig. The current repository uses and labels that fallback.

The background now preserves source aspect ratio with focal-point-aware cover cropping. The table is
an atomic `table-surface` + `table-frame` pack, so complete final table art removes both legacy table
textures instead of mixing a final surface with an old frame.

## HUD

Player side:

- Rookie Brawler portrait
- Your ARMZ label and fighter name
- Current Control number and semantic meter
- Cyan Control treatment

Opponent side:

- Practice Automaton portrait
- Easy label and fighter name
- Current Control number and semantic meter
- Enemy-orange Control treatment

Center:

- Current timeline cue
- Current event title
- Subtle directional/momentum line

Controls:

- Sound effects
- Music
- Reduced motion
- Skip to result while playback is active

All controls have accessible names, pressed state, touch-sized targets, focus styling, and persistent preferences. The HUD has no pointer events so it cannot block the grip or battle controls.

## Timeline and pacing

The server creates the authoritative timeline and final values. The renderer consumes it without changing the winner.

Targets:

- Total battle: 8–12 seconds
- Average: near 11 seconds
- Grip lock: near 2.2 seconds
- Active struggle: near 3 seconds
- Final slam and hold: short, decisive, and completed before result presentation

The one-million simulation gate checks duration bounds, timeline ordering, event integrity, and winner/final-Control invariants. Reduced motion changes animation amplitude and transition style, not cue order, duration truth, or result.

## Cue mapping

| Cue                | Presentation intent                                | Audio intent            |
| ------------------ | -------------------------------------------------- | ----------------------- |
| Approach           | Hands converge without early contact               | Low anticipation pulse  |
| Grip               | Contact flash/friction cue, grip alignment         | Grip lock click/thump   |
| Light/heavy strain | Controlled table vibration and tension             | Layered strain          |
| Push               | Directional streak and readable Control movement   | Forward pressure accent |
| Counter            | Reverse-momentum burst with clear direction change | Distinct reversal hit   |
| Critical           | Stronger impact and lighting accent                | Higher-energy impact    |
| Recovery           | Controlled form reset, not magical healing         | Short recovery cue      |
| Fatigue            | Reduced amplitude and tension cue                  | Lower strained pulse    |
| Final slam         | Pin-pad impact, table shock, final hold            | Decisive slam           |
| Victory/defeat     | Lighting sweep or respectful dim                   | Outcome sting           |

VFX spawns now carry direction, rotation, flip, scale, intensity, opacity, lifetime, velocity, blend
mode, z-index, origin, and optional destination. Player/opponent pressure travel toward the correct
pin; counter reverses momentum; final slam is substantially larger than normal push. Current legacy
effect textures remain temporary and inherit the new directional spawn behavior.

## Audio implementation

Audio is synthesized at runtime with the Web Audio API. It does not use downloaded songs, copyrighted recordings, or owner-supplied audio files.

- One audio manager/context per active renderer
- No audio before a user gesture
- Separate SFX and music/atmosphere controls
- Preferences persist in local storage
- Timeline cues trigger grip, push/strain, counter, critical, recovery, final slam, victory, and defeat sounds
- Renderer destruction disconnects nodes and prevents duplicate contexts/cues

This implementation is honest original synthesis; it is not a mastered premium soundtrack. A future audio-asset contract would require separate owner approval and a new manifest version.

## Renderer lifecycle and performance

`BattleRenderer` owns its Pixi application, scene graph, texture references, event callbacks, resize listener, animation loop, and audio manager. On React cleanup it:

- Stops playback
- Removes the resize listener
- Cancels animation work
- Destroys rig/sprite references
- Destroys the Pixi application and removes its canvas
- Disconnects audio resources
- Clears callback references

Only needed battle assets are loaded. The layered pair and table pair commit atomically after all
minimum textures load; slow or failed loads leave the complete fallback active. Large route-independent
art is not packed into a global atlas. Responsive 1×/2× files avoid forcing desktop resolution onto phones.

## Truth boundary

The renderer may interpolate Control and poses between timeline events, but it may not determine the result. On completion or skip, React synchronizes directly to:

- `battle.playerFinalStrength`
- `battle.opponentFinalStrength`
- `battle.outcome`

Result UI is mounted only after `done && finalSynced && integrityValid`. See [PHASE3_4_RESULT_UX.md](PHASE3_4_RESULT_UX.md).

## Current limitation

The repaired rig, pose, shared-grip, pin-arc, responsive arena, atomic table, directional VFX, HUD,
cue routing, persistence, and final-asset hooks are implemented. The displayed fighter layers, table,
arena, and effects are still Phase 3.3B fallbacks because the final owner pack is **0/33 required**.
Premium battle-art completion is **BLOCKED**, visual acceptance is **PENDING OWNER TEST**, and Phase 4
has not started.
