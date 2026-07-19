# Database migrations

Phase 1 uses timestamped SQL migrations under `supabase/migrations/`.

## Workflow (hosted Supabase)

1. Owner provisions a **development** Supabase project.
2. Copy project URL, anon key, and service-role key into a local `.env` (never commit).
3. Link with Supabase CLI when ready:
   ```bash
   pnpm exec supabase link --project-ref <PROJECT_REF>
   ```
4. Apply migrations only after explicit approval:
   ```bash
   SUPABASE_REMOTE_WRITES_APPROVED=true pnpm exec supabase db push
   ```

## Safety

- `SUPABASE_REMOTE_WRITES_APPROVED` defaults to `false`.
- `RUN_HOSTED_SUPABASE_TESTS` defaults to `false`.
- Phase 1 does **not** auto-migrate hosted databases from CI.

## Generated types (later)

When the hosted schema is available:

```bash
pnpm exec supabase gen types typescript --project-id <PROJECT_REF> > packages/database/src/generated.ts
```

Keep hand-written domain types in `types.ts` until generation is wired.
