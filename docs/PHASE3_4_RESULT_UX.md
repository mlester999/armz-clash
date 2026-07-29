# Phase 3.4 Result UX and Integrity

**Implementation status:** implemented
**Final result artwork:** BLOCKED — Phase 3.4A owner files missing
**Owner visual acceptance:** PENDING OWNER TEST

## Non-negotiable result gate

The client never derives, swaps, or “improves” the server outcome. A result can render only when:

```ts
showResult = done && finalSynced && integrityValid;
```

`integrityValid` is defined as:

```text
Victory → opponentFinalStrength === 0 && playerFinalStrength > 0
Defeat  → playerFinalStrength === 0 && opponentFinalStrength > 0
```

If these conditions are not satisfied, the result overlay does not mount. No reward or training message can appear early.

## Sequence

Normal playback:

1. The Pixi timeline reaches the authoritative final event.
2. The renderer completes the final slam and short hold.
3. React copies both final Control values from the server payload.
4. `finalSynced` becomes true.
5. `done` becomes true.
6. The integrity invariant is evaluated.
7. The result title receives focus with `preventScroll`.
8. One assertive screen-reader message announces outcome and final Control.

Skip:

1. The renderer pauses.
2. No local winner is calculated.
3. Both Control values are replaced with the server’s final values.
4. The same synchronization/integrity gate and result component are used.

Refresh after completion:

1. A valid battle payload is stored in `sessionStorage` with `resultReady: false` when received.
2. The flag becomes true only when normal completion or truthful skip reaches the result gate.
3. A direct refresh reads the payload only for the current demo session.
4. Schema shape, outcome, timeline, both final values, and zero/non-zero invariant are revalidated.
5. Invalid JSON, malformed data, invalid final values, and cross-session data are rejected.
6. A valid completed payload restores the result directly; it does not replay and does not call the battle API again.

Collection, Arena, and replay actions deliberately clear the stored result. Replay obtains a new authoritative battle after the cooldown.

## Victory presentation

- Dominant **VICTORY** title
- Rookie Brawler winner art and Practice Automaton defeated art
- Final player/opponent Control values
- Simulated Demo $ARMZ reward only when present in the server payload
- No monetary value, not claimable, not withdrawable, not transferable
- Battle identifier prefix, authoritative duration, and server-authoritative label
- Replay, Collection, Return to Arena actions

## Defeat presentation

- Dominant **DEFEAT** title
- Rookie Brawler pinned art and Practice Automaton winner art
- Final player/opponent Control values
- No fake reward card
- Training feedback instead of reward copy
- Replay, Collection, Return to Arena actions

## Viewport behavior

The result is an absolute layer inside the fixed battle arena, not a document section. It uses three grid rows: header, flexible body, actions.

- Desktop: player art, center result summary, opponent art
- Tablet: the same composition with reduced spacing and type scale
- Mobile: two fighter panels above a full-width Control/reward or training summary
- Actions stay in the final grid row and never rely on page scrolling
- Result focus does not move the document under the sticky shell
- Phone/tablet bottom navigation is outside the calculated arena height

Automated E2E checks assert the result bounding box is fully inside the current viewport and then reload the page to verify restoration.

## Accessibility

- `role="dialog"`, `aria-modal="true"`, and labelled result title
- Result heading is programmatically focused once without scrolling
- One concise assertive announcement after synchronization
- Semantic Control meters remain available behind the presentation
- Victory/Defeat uses title, text, values, and fighter labels rather than color alone
- Buttons retain keyboard activation, focus-visible state, disabled replay state, and touch targets
- Reduced motion preserves the same data gate and final content
- Per-frame Control changes are not announced

## Duplicate-event protection

- A single `BattleRenderer` owns the active battle ID.
- Renderer cleanup invalidates old callbacks when the battle changes or unmounts.
- `resultAnnounced` prevents repeated final announcements.
- The result component is a pure view of one immutable battle payload plus synchronized UI state.
- The session-storage key holds only one last battle and is replaced atomically.

## Validation coverage

- Unit tests reject malformed, cross-session, or impossible completed payloads.
- Unit tests accept truthful Victory and Defeat finals.
- E2E uses Skip, checks the synchronized result, checks all actions, checks viewport containment, reloads, and checks the final announcement.
- One-million simulation validates that every generated Victory/Defeat satisfies the zero/non-zero invariant.
- Normal live-browser playback was observed through final slam and automatic result.

## Current art limitation

The result flow and layout are unchanged by the contract repair. Rookie Brawler victory/defeat,
Practice Automaton victory/defeat, and both Tier B result accents remain missing and use declared
Phase 3.3B fallbacks. Skip now applies the authoritative final pin pose before this same
`done && finalSynced && integrityValid` result mounts. Final result-art quality is **BLOCKED**; owner
acceptance remains **PENDING OWNER TEST**. Phase 4 has not started.
