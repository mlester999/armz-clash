# Phase 3.4A Authored Pose Manifest

The Phase 3.4A pose manifest is typed in code and emitted as
`manifests/battle-pose-manifest.json`. The renderer interpolates complete paired poses with authored
curves and durations; random rotation is not the primary animation system.

## Required poses

1. `ready`
2. `approach`
3. `gripLock`
4. `neutral`
5. `playerLightAdvantage`
6. `playerStrongAdvantage`
7. `opponentLightAdvantage`
8. `opponentStrongAdvantage`
9. `playerCounter`
10. `opponentCounter`
11. `playerCritical`
12. `opponentCritical`
13. `playerRecovery`
14. `opponentRecovery`
15. `playerFatigue`
16. `opponentFatigue`
17. `playerFinalSlam`
18. `opponentFinalSlam`
19. `playerVictoryHold`
20. `opponentVictoryHold`
21. `playerDefeatHold`
22. `opponentDefeatHold`

Each pose defines separate player/opponent shoulder, upper-arm, forearm, wrist, and hand rotations;
elbow offset; arm scale; grip mode; table reaction; camera zoom/shake; VFX/audio cue; transition time;
hold time; and interpolation curve.

## Runtime selection

Server timeline cue, acting side, intensity, interpolated Control difference, event type, and latched
authoritative outcome select a pose. Player/opponent advantage, counter, critical, and recovery are
therefore visually distinct. Victory/defeat holds remain latched through reward/complete events rather
than returning to `ready` before result presentation.

## Final slam and skip

`playerFinalSlam` targets the opponent pin pad; `opponentFinalSlam` targets the player pin pad. The
timeline side chooses the pose, so animation never invents the winner. The shared grip follows a
quadratic arc, both elbows remain planted, and terminal poses hold 450 ms. Reduced motion reaches the
same target with a shorter transition. Skip applies the authoritative final pose and Control values
before React mounts the same integrity-gated result.
