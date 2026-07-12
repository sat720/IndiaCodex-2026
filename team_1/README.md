# TrustTrail – Trustless Escrow with On-Chain Reputation

> **Team 1** | IndiaCodex Cardano Hackathon 2026

---

## 📌 Project Overview

**TrustTrail** is a decentralized escrow application built on the Cardano blockchain. It eliminates the need for centralized intermediaries by locking ADA in Aiken smart contracts. When predefined conditions are cryptographically met, the contract automatically releases the funds — and mints an immutable **Reputation NFT Receipt** on-chain, powering a tamper-proof **Trust Score** for every participant.

---

## 🚨 Problem We Are Solving

Online commerce between buyers and sellers relies entirely on trust in a third party:

- **Centralized escrow platforms** charge 2–5% fees and hold funds with no transparency.
- **No verifiable reputation** — anyone can fake reviews; there is no provable track record.
- **Disputes have no neutral mechanism** — resolutions are subjective and opaque.

---

## 💡 Our Solution

TrustTrail replaces the middleman with code:

1. **Buyer** locks ADA in the Escrow Validator smart contract.
2. **Seller** completes the work.
3. **Buyer** approves → contract releases ADA to Seller + mints a **Receipt NFT**.
4. **Dispute?** → A pre-agreed Arbiter signs to resolve in favor of buyer or seller.
5. **Refund** → If the deadline passes with no resolution, the Buyer can reclaim funds.

Every completed escrow mints an on-chain NFT that powers a **0–100 Trust Score** — unlike star ratings, this reputation is immutable and verifiable by anyone.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | **Aiken** (Plutus V3) |
| Escrow Logic | Aiken Spending Validator |
| Reputation NFTs | Aiken Parameterized Minting Policy |
| Frontend Framework | React + Vite + TypeScript |
| Blockchain Interaction | Lucid (Transaction Builder) |
| Wallet Integration | CIP-30 (Lace, Eternl, Nami) |
| Network | Cardano Preprod Testnet |

---

## 🏗️ Architecture

```
User (Browser)
    ↓
React Frontend (Vite + TypeScript)
    ↓
Lucid Transaction Builder
    ↓
┌──────────────────────────┐    ┌──────────────────────────┐
│  Escrow Validator (Aiken) │ ←→ │  NFT Minting Policy (Aiken)│
│  Guards the locked ADA    │    │  Mints only on valid escrow│
└──────────────────────────┘    └──────────────────────────┘
    ↓
Cardano Preprod Testnet
```

**Key architectural insight:** The Minting Policy is parameterized with the Escrow Validator's script hash — it can **only** mint NFTs when funds are simultaneously unlocked from the escrow, enforced at the protocol level.

---

## 🎮 Demo

### Screenshots

| Screen | Description |
|---|---|
| **Landing Page** | Dark glassmorphism login — "Connect Lace Wallet" |
| **Dashboard** | Live wallet address, balance, Trust Score header |
| **Create Escrow** | Form to enter seller address + ADA amount to lock |
| **Active Escrows** | Cards showing locked escrows with "Release Funds" button |
| **Reputation NFTs** | Grid of minted NFT receipts with escrow details |

### Project Demo Video
🔗 **[Watch Project Demo Video](https://drive.google.com/file/d/1yuldoL9LTJR5BFO3UAMUPtBajGcoLcLE/view?usp=sharing)**

---

## 🚀 Live Project

> The contract is live on **Cardano Preprod Testnet**.
>
> Contract Address is derived deterministically from the compiled Aiken CBOR:
> - **Escrow Validator Hash:** `5793a9b0a3a96285aea060774f2f598210a055c1a56c6934f56064bb`
> - **NFT Minting Policy Hash:** `2bd4ecd115bc116b61f057eb4220021a1e229b09d7cc8c1cfdfb502e`

**Run locally:**
```bash
# Install Aiken, then compile contracts
aiken build

# Start frontend
cd escrow-validator/frontend
npm install
npm run dev
```
Open `http://localhost:5173` with Lace wallet installed (set to Preprod testnet).

---

## 📊 Presentation

🔗 **[View Project PPT on Gamma AI](https://gamma.app/docs/Trustless-Escrow-On-Chain-Reputation-Powered-by-Cardano-9hknqfogpbrixd9)**

---

## 👥 Team Members

| Name | Role |
|---|---|
| Satvik | Full Stack Developer & Smart Contract Engineer |
| Jayant Acharya | Developer |
| Rishil | Developer |

---

## 📁 Repository Structure

```
team_1/
├── README.md                    ← This file
├── escrow-validator/            ← Full project
│   ├── aiken.toml               ← Aiken configuration
│   ├── plutus.json              ← Compiled smart contracts
│   ├── validators/
│   │   ├── escrow.ak            ← Escrow Validator
│   │   └── receipt_mint.ak      ← NFT Minting Policy
│   ├── lib/trusttrail/
│   │   └── types.ak             ← Shared types (Datum, Redeemer)
│   └── frontend/
│       ├── src/
│       │   ├── App.tsx          ← Main UI
│       │   ├── services/
│       │   │   ├── EscrowService.ts  ← Lucid transaction builder
│       │   │   └── TrustService.ts   ← Trust Score calculator
│       │   └── components/
│       │       ├── TrustDashboard.tsx
│       │       └── EscrowManager.tsx
│       └── package.json
```
