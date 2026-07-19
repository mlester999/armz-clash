# Reown AppKit setup — Armz Clash

## Public Project ID

`NEXT_PUBLIC_REOWN_PROJECT_ID` is **public client configuration** (not a server secret).
It must still not be printed unnecessarily in logs or reports.

## Where to set it

1. **Preferred:** monorepo root `.env`
2. **Optional app overrides:** `apps/web/.env.local` and `apps/game/.env.local` (client-safe values only)

Do not commit `.env` or `.env.local`.

## Why Next.js needs explicit env references

Next.js only embeds `NEXT_PUBLIC_*` values into browser bundles when they appear as
direct `process.env.NEXT_PUBLIC_*` expressions. Armz Clash loads them via
`readBundledPublicEnvironment()` in `packages/config/src/env/client.ts`.

After changing any `NEXT_PUBLIC_*` value:

```bash
pnpm clean:next
# then restart the Next app(s)
pnpm dev:web
# or
pnpm dev:game
```

## Local hostnames

Use **`127.0.0.1` only** for local development (web, game, admin, API origins).
Do not mix `localhost` and `127.0.0.1` under strict CORS.

## Verify

```bash
pnpm doctor
```

Expected when configured:

```
PASS Reown Project ID configured — present (value not printed)
```

In the browser console (development only):

```
[Armz Clash] Reown configuration: configured
```

When missing, the wallet UI shows a safe warning and does not crash.
