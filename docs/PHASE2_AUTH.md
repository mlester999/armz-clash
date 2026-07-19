# Phase 2 — Wallet authentication

## Overview

Armz Clash authenticates players by proving control of a Solana wallet on **Devnet only**.

Flow:

1. Connect wallet via Reown AppKit (Solana adapter, Devnet network only).
2. Request a server-built challenge message.
3. Sign the exact UTF-8 message in the wallet (no transaction, no SOL fee).
4. Server verifies Ed25519 signature.
5. Server creates/loads a player profile and issues an opaque HttpOnly session cookie.
6. CSRF double-submit cookie protects state-changing requests.

## Official packages

- `@reown/appkit`
- `@reown/appkit-adapter-solana`
- Networks: `solanaDevnet` only (no mainnet, no EVM)

Docs: https://docs.reown.com/appkit/next/core/installation

## Session cookies

| Cookie               | HttpOnly | Purpose                           |
| -------------------- | -------- | --------------------------------- |
| `armz_clash_session` | yes      | Opaque session token              |
| `armz_clash_csrf`    | no       | CSRF token for mutating API calls |

Localhost may use `Secure=false` for HTTP development. Hosted/production-like environments should set secure cookies.

## API

- `POST /api/v1/auth/challenge`
- `POST /api/v1/auth/verify`
- `GET /api/v1/auth/session`
- `POST /api/v1/auth/renew`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `PATCH /api/v1/me/profile`
- `GET /api/v1/wallet/balances`

## Manual owner tests

1. Connect Phantom / Solflare on Devnet.
2. Sign the Armz Clash message.
3. Confirm session survives refresh.
4. Switch wallet → previous session must not remain active for the new wallet.
5. Reject signature → safe error, no session.
6. Logout + disconnect.
7. Confirm admin app has no wallet login.
8. Confirm no Staking navigation.

## Non-goals

- Demo battles (Phase 3)
- Mint / rewards / claims / marketplace
- Mainnet
- Staking
