# Security — Armz Clash

## Threat model foundation

| Threat                        | Mitigation (Phase 1+)                                 |
| ----------------------------- | ----------------------------------------------------- |
| Client-forged battle wins     | Server-authoritative combat (later)                   |
| Stolen service-role key       | Never ship to browser; secret scan; server isolation  |
| Feature flag accidents        | Explicit true/false parsing; unsafe combo fail-closed |
| Mainnet enablement by mistake | Default false; env safety checks                      |
| Audit log tampering           | Append-only intent + RLS deny updates/deletes         |
| Wallet address spoofing       | Signature verification (Phase 2)                      |
| Replay auth                   | Single-use nonces (Phase 2)                           |
| Over-allocation of rewards    | Treasury liability + pause (later)                    |

## Secret handling

- Use `.env.example` only in git
- Ignore `.env`, keys, pem, wallet JSON
- `pnpm secrets:scan` fails on common private-key patterns
- Never log full environment objects

## Environment separation

- `development` / `staging` / `production`
- Mainnet must not activate in development
- Hosted DB writes require `SUPABASE_REMOTE_WRITES_APPROVED=true`

## Mainnet safety

- `ARMZ_MAINNET_ENABLED` defaults to `false`
- Missing variable must never enable mainnet
- Blockchain package guards mainnet selection

## Service-role isolation

- `@armz-clash/database/server` is the only service-role factory
- Browser factory refuses service-role-looking keys
- Root package export does not re-export service-role helpers

## RLS principles

- Enable + force RLS on sensitive tables
- Closed by default: no policy ⇒ no access for anon/auth roles
- Public may read only intentionally public feature flags
- Admin authorization is not a client-controlled profile field

## Audit-log principles

- Append-oriented schema
- Ordinary roles must not update/delete
- Correlation IDs for request tracing

## Idempotency principles

- Future mutations accept idempotency keys
- Worker jobs record reconciliation runs with cursors

## Wallet-auth roadmap (Phase 2)

- Nonce issue → wallet sign → server verify → short session
- Bind session to pubkey; expire and rotate

## Transaction-verification roadmap

- Verify signatures, accounts, memos, and confirmation status server-side before granting

## Incident-response placeholders

1. Pause real-value feature flags
2. Rotate compromised secrets
3. Preserve audit logs
4. Communicate status via `/status`
5. Reconcile ledgers before re-enabling
