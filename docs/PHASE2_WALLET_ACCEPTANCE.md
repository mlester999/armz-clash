# Phase 2 / 2.1 — Wallet acceptance guide

## Local cookie vs hosted cookie

| Setting        | Local HTTP development                      | Hosted / production-like                                         |
| -------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Session cookie | HttpOnly, SameSite=Lax, Path=/              | HttpOnly, **Secure**, SameSite=Lax, Path=/                       |
| Secure flag    | `false` when `ARMZ_ENVIRONMENT=development` | `true` when not development, or `ARMZ_FORCE_SECURE_COOKIES=true` |
| CSRF cookie    | Readable by JS for double-submit            | Same                                                             |
| Domain         | Host-only (no Domain attr)                  | Optional `ARMZ_COOKIE_DOMAIN` (never `*`)                        |

**Note:** Browsers share host-only cookies across ports on `localhost`. Admin UI must not call player auth APIs with credentials. CORS allowlist excludes admin origin.

## Manual wallet checklist

1. Start `pnpm dev:api`, `pnpm dev:web`, `pnpm dev:game`.
2. Connect Phantom (Devnet) → Sign in.
3. Confirm session survives refresh.
4. Disconnect wallet → session revoked / UI clears.
5. Switch wallet account → prior profile cleared; new sign-in required.
6. Reject signature → no session.
7. Zero SOL wallet can still sign in.
8. Admin app has no Connect Wallet.
9. No Staking navigation.
10. Mobile: modal fits viewport; menu does not overflow.

Classify each wallet result as PASSED MANUALLY / PENDING OWNER TEST / FAILED.

## Automated security suite

```bash
pnpm dev:api
RUN_HOSTED_SUPABASE_TESTS=true pnpm test:auth:security
RUN_HOSTED_SUPABASE_TESTS=true pnpm test:rls:auth:hosted
```

## Sign-in message guarantees

Message states authentication only:

- No blockchain transaction
- No SOL cost
- No token spending approval

Binds domain, URI, wallet, Devnet chain, nonce, challenge ID, issued/expiry, request ID.
