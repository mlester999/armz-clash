# Economy safety — Armz Clash

## Core principles

- **No guaranteed ROI**
- **No guaranteed rewards**
- **No fixed daily earnings**
- **No promised mint-cost recovery**
- **No new-player-funded obligations** to earlier players

Armz Clash is a blockchain-enabled game with **probabilistic gameplay rewards** funded by a **limited and transparent reward treasury** (when enabled in later phases).

## Reward treasury concept

When real rewards are eventually enabled:

- Rewards are budgeted
- Liabilities are tracked
- New rewards cannot exceed configured budgets
- If the treasury cannot safely support new liabilities, real-value battles must reduce, restrict, or pause

## Liability tracking

Future systems must account for:

- Claimable outstanding rewards
- In-flight claims
- Budget remaining
- Pause thresholds

## Treasury states

| State        | Meaning                           |
| ------------ | --------------------------------- |
| `healthy`    | Within normal operating budgets   |
| `caution`    | Approaching limits                |
| `restricted` | Reduced reward eligibility        |
| `paused`     | Real-value rewards/battles halted |

Demo Mode should remain available when real-value systems are paused.

## Emergency pause

Feature flags and admin controls (later) must be able to disable:

- Real mint
- Real rewards
- Claims
- Marketplace settlement
- Mainnet

## Versioned configuration

Economy and rarity settings must be versioned (`app_config_versions`) and auditable. Silent production changes are forbidden.

## Testnet-first

- Default network: **Solana Devnet**
- Mainnet requires explicit owner approval and safety gates

## Language guidance

Prefer:

- Probabilistic gameplay rewards
- Reward eligibility
- Limited reward treasury
- No guaranteed rewards

Avoid:

- Guaranteed profit / ROI / payback
- Passive income
- Risk-free earnings
- Fixed income promises
