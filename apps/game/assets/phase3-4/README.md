# Phase 3.4 owner asset drop

Place owner-approved PNG or WebP source files under `final/` using the exact Phase 3.4A stems in
`docs/PHASE3_4A_IMAGE_GENERATION_HANDOFF.md`, then run:

```text
pnpm build:assets:phase34
```

The build emits responsive WebP/PNG variants and runtime manifests. It never promotes a missing
file to `final`. Tier A contains 21 required functional assets, Tier B contains 12 required polish
assets, and Tier C contains 5 optional assets. The paired fighter minimum and table surface/frame load
atomically; declared Phase 3.3B art remains temporary until each complete replacement pack exists.

Do not put secrets, licenses, prompts containing private data, or unrelated files in this folder.
