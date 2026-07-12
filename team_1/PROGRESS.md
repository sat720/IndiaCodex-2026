# TrustTrail — Progress Log

## Context

Building for **Cardano India Codex 2026 — General Track**, submission due
within a 3-hour window (started 2026-07-12). Chose the General Track over
Masumi/Midnight because those need ~10 days and can't be scoped down safely.

## Idea selection (how we got here)

Considered 5 ideas for the General Track, scored on build speed / judge
appeal / risk for a 3hr budget:

| Idea | Score |
|---|---|
| Time-locked vault | 7.5 |
| **Escrow with arbiter** | **9 (chosen)** |
| Deterministic raffle | 6 |
| Payment streaming | 5 |
| POAP-style mint | 6.5 |

Looked at India Codex 2025 General Track winners for pattern-matching:
1st NFT gift cards, 2nd IoT+ADA payments, 3rd AI transaction dashboard,
4th AI+governance, 5th social/creator dual-token platform. Pattern: a
recognizable **product** + one differentiating layer (often AI or a
real-world hook), not a bare financial primitive.

Decision: keep escrow (safest core, still a real trust-primitive story),
but strengthen it toward the winning pattern by adding:
- **NFT receipt** minted on successful trade completion (proof-of-trade,
  seed of an on-chain reputation system)
- **On-chain reputation dashboard** ("TrustTrail" — trust score passport)
  instead of an AI layer, to avoid an external API dependency risk during
  a live demo.

## Final locked design

**Project name:** TrustTrail — trustless escrow with an on-chain
reputation passport.

**Stack decisions (all confirmed with user):**
- On-chain language: **Aiken** (not Plutus — faster to write/compile)
- Off-chain/frontend: **Lucid + React** (Vite scaffold)
- Network: **Preview/Preprod testnet**
- Arbiter model: **single fixed arbiter** wallet (not per-trade)
- Demo style: **real multi-wallet demo** — 3 separate funded Preview
  wallets for buyer / seller / arbiter roles, not simulated role toggles
- Trust score: **count + volume + tenure + disputes**, exact formula below
- Dispute tracking: receipts are tagged with an `outcome` field
  (`clean` / `favor_buyer` / `favor_seller`); a wallet's dispute count =
  receipts where it was the losing party in a `Resolve`
- Tenure start: `tenureDays = now - timestamp of wallet's oldest receipt
  NFT` (no signup step, so first receipt is the only available anchor)
- Escrow amount: no min/max cap; demo with small amounts (5–50 ADA range)

### Trust Score Formula (0–100)

```
score = min(100, max(0,
  50
  + (completedEscrows * 2)
  + (totalVolumeADA / 100)
  + (tenureDays / 30)
  - (disputes * 10)
))
```
- Base score: 50
- +2 per completed escrow
- +1 per 100 ADA successfully traded
- +1 per 30 days of tenure
- -10 per dispute
- Clamped to [0, 100]

### On-chain architecture

**1. Escrow validator** — datum:
`{ buyer, seller, arbiter (fixed), amount, deadline }`. Redeemers:
- `Release` — requires buyer AND seller signatures → pays seller
- `Refund` — requires buyer signature alone, only after deadline → refunds buyer
- `Resolve { favor_seller: Bool }` — requires arbiter signature → pays winner

**2. NFT receipt minting policy** — parameterized by the escrow script
hash. Only mintable in the same transaction that spends an escrow UTXO via
`Release`/`Resolve` (checked via matching `OutputReference` + payment
credential in `self.inputs`). One receipt token minted per party;
descriptive fields (amount, timestamp, counterparty, outcome) are attached
as off-chain CIP-25/721-style transaction metadata during minting (Plutus
V3 minting policies can't natively carry rich on-chain metadata — only
enforce authorization/quantity), so the dashboard reads token names +
tx metadata, not on-chain datums, for receipt details.

### Off-chain flows (Lucid + React)

- Create escrow (buyer locks funds, sets seller address, deadline)
- Seller confirm delivery → buyer signs release
- Buyer refund after deadline (unilateral)
- Arbiter dashboard to resolve disputes (`Resolve`)
- Trust dashboard: scans a wallet's receipt NFTs → computes
  `completedEscrows`, `totalVolumeADA`, `tenureDays`, `disputes` → applies
  formula above, shows score + breakdown

## Code written so far

Repo scaffolded at `escrow-validator/` via `aiken new trusttrail/escrow-validator`.

- `escrow-validator/aiken.toml` — project manifest, `plutus = "v3"`,
  depends on `aiken-lang/stdlib` v1.5.0 (unresolved — see Blocker below)
- `escrow-validator/lib/trusttrail/types.ak` — shared types:
  `EscrowDatum`, `EscrowRedeemer` (`Release` / `Refund` / `Resolve`),
  `ReceiptOutcome` (`Clean` / `FavorBuyer` / `FavorSeller`),
  `ReceiptMintRedeemer`
- `escrow-validator/validators/escrow.ak` — escrow spend validator.
  Checks buyer+seller sigs for `Release`, buyer sig + deadline passed for
  `Refund`, arbiter sig for `Resolve`. **Not yet compiled/verified** —
  written against assumed stdlib v1.1.x/v3 API shape
  (`aiken/crypto`, `aiken/collection/list`, `cardano/transaction`); needs
  a real `aiken check` pass to confirm imports/field names are correct.
- `escrow-validator/validators/receipt_mint.ak` — minting policy draft.
  **Known bugs to fix on resume:**
  - `cardano/address.VerificationKeyCredential(...)` used inline without
    a proper `use cardano/address.{VerificationKeyCredential}` import
  - `dict.size` / `dict.values` called without `use aiken/collection/dict`
  - logic currently checks "at least 1 token, all qty 1" — needs
    tightening to "exactly the expected receipt count for this trade"
    once the exact mint-per-trade count is decided (2 receipts: one per
    party, or +1 extra for the losing party's dispute-flag receipt)
- Nothing built/tested yet — `aiken check` / `aiken build` have not
  successfully completed (see Blocker).

## Current blocker (why we paused)

`aiken check` / `aiken build` hang at "Resolving trusttrail/escrow-validator"
because Aiken needs to fetch the `aiken-lang/stdlib` package from GitHub,
and the **Apple Claude Code security sandbox is blocking outbound network
access** to `github.com` and `raw.githubusercontent.com` (confirmed via
direct `curl`, which returned an explicit sandbox-block message with
remediation steps). This is a sandbox config issue, not a code issue —
per standing instruction, stopped and asked the user to fix it rather than
work around it.

**To unblock:** allowlist `github.com`, `raw.githubusercontent.com`, and
likely `codeload.github.com` via either:
- `http://localhost:5362` → Domains → Add Domain, or
- add lines to `/Users/jayant99acharya/.claude/apple/dangerous_allowed_domains.csv`

## Remaining task list (tracked in TaskCreate/TaskList, IDs stable)

1. [in_progress] Scaffold Aiken validator project — mostly done, blocked
   on dependency resolution (see above)
2. [pending] Write escrow validator (Release/Refund/Resolve) — draft
   written, unverified
3. [pending] Write NFT receipt minting policy — draft written, has known
   bugs listed above, unverified
4. [pending] Write unit tests for validator + minting policy
5. [pending] Build and get validator script hashes / addresses
6. [pending] Scaffold Vite + React frontend
7. [pending] Implement create-escrow flow
8. [pending] Implement release/refund/resolve flows
9. [pending] Implement trust score dashboard
10. [pending] End-to-end test on Preview testnet with 3 wallets

## Next steps on resume

1. Confirm domain allowlist fix, then re-run `aiken check` inside
   `escrow-validator/` to surface real compiler errors.
2. Fix `receipt_mint.ak` per known bugs above once real error output is in
   hand (don't guess further at stdlib API shape — let the compiler drive it).
3. Decide exact mint count/shape per trade (2 vs 3 receipts) before
   finalizing the mint-quantity check.
4. Proceed through task list in order (tests → build/addresses → frontend
   → flows → dashboard → live multi-wallet test).
