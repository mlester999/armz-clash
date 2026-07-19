# Phase 2 credentials readiness checklist

Complete these before starting Phase 2 (wallet connection and signed authentication).

## Repository

- [ ] Private GitHub repository `armz-clash` exists
- [ ] Local origin points to Armz Clash (not Atlas Game Studio)
- [ ] Branch pushed and GitHub Actions green

## Supabase development project

- [ ] Hosted project named for development (for example `armz-clash-dev`)
- [ ] Phase 1 foundation migration applied
- [ ] Feature flags remain safe (real-value flags false)
- [ ] RLS probes pass
- [ ] No default admin assignment
- [ ] Service-role key stored only in local `.env` / secret manager

## Wallet / Reown

- [ ] Reown / WalletConnect Cloud project created
- [ ] Project ID available as `NEXT_PUBLIC_REOWN_PROJECT_ID`
- [ ] Solana Devnet enabled in the Reown project
- [ ] Domain allowlist prepared for local + staging origins

## Security secrets for Phase 2 (not yet used)

Generate strong random values and store server-side only:

- [ ] `ARMZ_WALLET_NONCE_SECRET`
- [ ] `ARMZ_SESSION_SIGNING_SECRET`

Do not put these in client env or `.env.example`.

## Solana Devnet

- [ ] Devnet RPC URL decided (`SOLANA_RPC_URL`)
- [ ] Mainnet remains disabled (`ARMZ_MAINNET_ENABLED=false`)

## Explicit non-goals until later phases

- [ ] Real mint still disabled
- [ ] Real rewards still disabled
- [ ] Claims still disabled
- [ ] Marketplace settlement still disabled
- [ ] No staking

## Owner approval gate

- [ ] Owner approves starting Phase 2 implementation only after the items above are ready
