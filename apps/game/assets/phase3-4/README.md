# Phase 3.4 owner asset drop

Place owner-approved PNG or WebP source files under `final/` using the exact stems in
`docs/PHASE3_4_ASSET_PIPELINE.md`, then run:

```text
pnpm build:assets:phase34
```

The build emits responsive WebP/PNG variants and runtime manifests. It never promotes a missing
file to `final`; declared Phase 3.3B art remains a visibly temporary fallback until every required
owner asset is present.

Do not put secrets, licenses, prompts containing private data, or unrelated files in this folder.
