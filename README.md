# Palm Pay

> Censorship-resistant PUSD merchant checkout on Solana

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945ff)](https://solana.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Built for the **Palm USD × Superteam UAE Hackathon** (Frontier Track).

**[Live Demo](https://palm-pay-weld.vercel.app)** | **[Demo Video](https://youtu.be/5Mui1qe38Hc)** | **[Pitch Deck](https://gamma.app/docs/PALM-PAY-glwi1gyre7aiklk)**

---

## Overview

Palm Pay is a Solana Pay-compatible checkout system built around **PUSD** - the non-freezable, USD-pegged stablecoin backed 1:1 by AED + SAR reserves.

Unlike USDC or USDT, PUSD has **no admin freeze function, no address blacklist, and no pause mechanism**. Palm Pay gives merchants the first checkout that guarantees settlement finality - your funds land directly in your wallet and stay there.

**Target users:** Online merchants in MENA, emerging markets, and crypto-native commerce who need stablecoin payments without custodial risk.

---

## Features

| Feature | Details |
|---|---|
| Invoice creation | One-click from merchant dashboard |
| QR code checkout | Solana Pay-compatible QR for mobile wallets |
| Browser wallet payment | Phantom, Solflare, and all Wallet Adapter wallets |
| On-chain verification | SPL transfer + memo checked server-side |
| Live reserves badge | Real-time PUSD circulation from Palm USD API |
| Demo store | Full end-to-end flow for testing |
| Non-custodial | Palm Pay never holds funds - direct peer-to-peer |

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                        PALM PAY                            │
├─────────────────┬──────────────────┬──────────────────────┤
│  Landing Page   │  Merchant        │  Customer            │
│  /              │  Dashboard /dash │  Checkout /pay/:id   │
│                 │                  │                      │
│  • Hero         │  • Create Invoice│  • CheckoutCard      │
│  • How It Works │  • Tx History    │  • PayButton         │
│  • Why PUSD     │  • Settings      │  • QR Code           │
│  • Reserves     │  • PUSD Balance  │  • Payment Status    │
│  • For Devs     │                  │  • TrustIndicators   │
└────────┬────────┴────────┬─────────┴──────────┬───────────┘
         │                 │                    │
         │                 ▼                    ▼
         │    ┌────────────────────┐   ┌─────────────────────┐
         │    │  API Routes        │   │  Solana RPC          │
         │    │  /api/invoices     │   │  devnet / mainnet    │
         │    │  /api/reserves     │   │                     │
         │    └────────┬───────────┘   └──────────┬──────────┘
         │             │                          │
         │    ┌────────▼───────────┐              │
         │    │  In-Memory Store   │   ┌──────────▼──────────┐
         │    │  invoice-store.ts  │   │  PUSD SPL Mint      │
         │    └────────────────────┘   │  (SPL Token Prog.)  │
         │                            └─────────────────────┘
         ▼
┌─────────────────────┐
│  Palm USD API       │
│  api.palmusd.com    │
│  /v1/circulation    │
└─────────────────────┘
```

### Payment Flow

```
Merchant                   API                     Customer
   │                        │                          │
   │── POST /api/invoices ──▶│                          │
   │◀── { id, paymentUrl } ─│                          │
   │                        │                          │
   │ share /pay/:id ─────────────────────────────────▶ │
   │                        │                          │
   │                        │◀── GET /api/invoices/:id─│
   │                        │─── invoice data ────────▶│
   │                        │                          │
   │                        │    wallet signs SPL tx   │
   │                        │    transfer + memo       │
   │                        │                          │
   │                        │◀─ POST /api/invoices/:id/verify (txSig)
   │                        │                          │
   │                        │── getParsedTransaction ──▶ Solana RPC
   │                        │◀─ parsed tx ─────────────│
   │                        │                          │
   │                        │── update status=paid ──▶ Store
   │                        │                          │
   │                        │── { status: "paid" } ───▶│
   │                        │                          │
   ◀──── next poll ──────────│─── invoice.status=paid ─│
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Solana | @solana/web3.js + @solana/spl-token |
| Wallets | @solana/wallet-adapter-react |
| QR codes | qrcode.react |
| IDs | uuid |
| Encoding | bs58 |
| Deployment | Vercel |

---

## PUSD Token Details

| Property | Value |
|---|---|
| **Mainnet Mint** | `CZzgUBvxaMLwMhVSLgqJn3npmxoTo6nzMNQPAnwtHF3s` |
| **Decimals** | 6 |
| **Chain** | Solana |
| **Freeze authority** | None |
| **Blacklist** | None |
| **Pause** | None |
| **Backing** | 1:1 AED + SAR |
| **Attestation** | Monthly ISAE 3000 |
| **Reserves API** | `https://api.palmusd.com/v1/circulation` |

PUSD compliance is enforced at the **mint and redemption layer only** - not at the token level. Once issued, tokens are freely transferable with no issuer intervention possible.

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- A Solana wallet (Phantom or Solflare recommended)
- Git

### 1. Clone and install

```bash
git clone https://github.com/nanda-1-wq/palm-pay.git
cd palm-pay
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Solana network: "devnet" for testing, "mainnet-beta" for production
NEXT_PUBLIC_NETWORK=devnet

# RPC endpoint - use a reliable provider for production
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com

# Devnet mock PUSD mint (generated by setup-devnet script)
# Leave blank to fall back to mainnet mint address
NEXT_PUBLIC_PUSD_MINT_DEVNET=<your-devnet-mint>

# Demo store merchant wallet (receives PUSD in demo purchases)
NEXT_PUBLIC_DEMO_MERCHANT_WALLET=<your-wallet-address>
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Set up devnet PUSD (for testing)

PUSD may not exist on devnet, so Palm Pay includes a script to create a mock SPL token with the same properties:

```bash
# Create mock PUSD mint on devnet and save keypair to .keys/
npm run setup-devnet
```

The script outputs the devnet mint address. Copy it into `NEXT_PUBLIC_PUSD_MINT_DEVNET` in `.env.local`.

```bash
# Fund your Phantom wallet with 1000 mock PUSD
npm run fund-wallet <your-wallet-address>
```

### 5. Full test flow

1. Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
2. Connect your Phantom wallet (devnet)
3. Create an invoice - set an amount ≤ your PUSD balance
4. Copy the payment link, open it in a new tab
5. Connect wallet → Pay with PUSD → confirm transaction
6. Watch the status update to "Paid" with a Solscan link

---

## API Reference

All routes are under `/api`. Amounts are in human-readable PUSD (e.g. `25.50`).

### `POST /api/invoices`

Create a payment invoice.

**Request body:**

```json
{
  "merchantWallet": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
  "merchantName": "My Shop",
  "amount": 29.99,
  "description": "Order #1042"
}
```

**Response `201`:**

```json
{
  "id": "uuid",
  "merchantWallet": "...",
  "merchantName": "My Shop",
  "amount": 29.99,
  "description": "Order #1042",
  "status": "pending",
  "createdAt": "2026-05-01T12:00:00.000Z",
  "expiresAt": "2026-05-01T12:30:00.000Z",
  "memo": "uuid",
  "paymentUrl": "/pay/uuid"
}
```

---

### `GET /api/invoices`

List all invoices, or filter by merchant.

```bash
GET /api/invoices
GET /api/invoices?merchant=<wallet-address>
```

---

### `GET /api/invoices/:id`

Fetch a single invoice by ID.

---

### `POST /api/invoices/:id/verify`

Verify a payment on-chain. Called by the checkout page after the wallet signs the transaction.

**Request body:**

```json
{ "txSignature": "5eykt4UsFv8P..." }
```

**Response `200`** (on success):

```json
{
  "id": "uuid",
  "status": "paid",
  "paidAt": "2026-05-01T12:05:00.000Z",
  "payerWallet": "...",
  "txSignature": "5eykt4UsFv8P..."
}
```

---

### `GET /api/reserves`

Proxy for the Palm USD circulation API, cached 5 minutes server-side.

```json
{
  "ok": true,
  "circulation": 12500000,
  "updatedAt": "2026-05-01T00:00:00.000Z"
}
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run setup-devnet` | Create mock PUSD mint on devnet (run once) |
| `npm run fund-wallet <address>` | Send 1000 mock PUSD to a wallet |

---

## Demo

- **Live app:** [palm-pay-weld.vercel.app](https://palm-pay-weld.vercel.app)
- **Demo video:** [youtu.be/5Mui1qe38Hc](https://youtu.be/5Mui1qe38Hc)
- **Pitch deck:** [gamma.app/docs/PALM-PAY-glwi1gyre7aiklk](https://gamma.app/docs/PALM-PAY-glwi1gyre7aiklk)
- **Dashboard:** [palm-pay-weld.vercel.app/dashboard](https://palm-pay-weld.vercel.app/dashboard)
- **Demo store:** [palm-pay-weld.vercel.app/demo-store](https://palm-pay-weld.vercel.app/demo-store)

---

## Roadmap

| Phase | Scope |
|---|---|
| **Phase 1 (current)** | MVP: invoice creation, SPL transfer, on-chain verification, demo store |
| **Phase 2** | Persistent database (Supabase) - invoices survive server restarts |
| **Phase 3** | Merchant SDK - `npm install palm-pay-sdk` for any JS/TS project |
| **Phase 4** | Mobile SDK + POS integration for physical retail |
| **Phase 5** | Multi-stablecoin support (EURC, other non-freezable tokens) |

---

## Contributing

PRs welcome. Run `npm run lint` and `npm run build` before opening a pull request.

---

## Team

Built by ADNAN ([@nanda-1-wq](https://github.com/nanda-1-wq))

**Prior shipped projects:**
- [Birdeye Token Radar](https://birdeye-token-radar.vercel.app) - Solana token intelligence dashboard (Birdeye Data BIP Competition)
- PrivatePayroll - Confidential payroll system on Solana (Umber x Superteam Frontier Hackathon)

---

## License

MIT

---

*Built with Solana, PUSD, and Next.js. Submitted to the Palm USD × Superteam UAE Hackathon.*
