@AGENTS.md
# CLAUDE.md — Palm Pay

## Project Identity
- **Name:** Palm Pay
- **Repo:** github.com/nanda-1-wq/palm-pay
- **Builder:** Nanda (GitHub: nanda-1-wq)
- **Bounty:** Palm USD x Superteam UAE - Solana Builders (Frontier Hackathon Track)
- **Prize:** 10,000 PUSD — 1st: 5,000 / 2nd: 3,000 / 3rd: 2,000
- **Deadline:** Winners announced May 26, 2026
- **Submission:** Superteam Earn (link Colosseum: arena.colosseum.org/projects/explore/privatepayroll)

---

## What Is Palm Pay

A Solana Pay-compatible PUSD merchant checkout with non-custodial, censorship-resistant settlement.

**One-liner:** Drop-in checkout widget that lets any online store accept PUSD on Solana with instant settlement, zero freeze risk, and live reserve proof.

**Core narrative:** "USDC can freeze your funds. PUSD can't. Palm Pay gives merchants the first checkout that guarantees settlement finality — no admin keys, no blacklist, no pause."

**Target user:** Online merchants in MENA, emerging markets, and crypto-native commerce who need stablecoin payments without custodial risk.

---

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- @solana/web3.js + @solana/spl-token
- @solana/wallet-adapter-react + wallet-adapter-react-ui + wallet-adapter-wallets
- qrcode.react (QR codes)
- uuid (invoice IDs)
- bs58 (base58 encoding)
- Vercel (deployment)

---

## PUSD Token Details
- **Solana SPL Mint (mainnet):** CZzgUBvxaMLwMhVSLgqJn3npmxoTo6nzMNQPAnwtHF3s
- **Decimals:** 6
- **Properties:** Non-freezable, no blacklist, no pause. Compliance enforced at mint/redeem layer only.
- **Reserves:** 1:1 backed by AED + SAR, monthly ISAE 3000 attestations
- **Palm USD API:** https://api.palmusd.com/v1/circulation
- **No proprietary SDK** — use @solana/web3.js + @solana/spl-token directly
- **PUSD may not exist on devnet** — we create a mock mint for testing (see T6)

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   PALM PAY                        │
├──────────────┬───────────────┬────────────────────┤
│  Merchant    │  Checkout     │  On-Chain          │
│  Dashboard   │  Widget       │  Layer             │
│  (Next.js)   │  (Embeddable) │  (SPL Transfers)   │
├──────────────┼───────────────┼────────────────────┤
│ - Register   │ - QR code     │ - SPL transfer     │
│ - API keys   │ - Pay button  │ - Memo instruction  │
│ - Tx history │ - Status poll │ - ATA management    │
│ - Analytics  │ - Receipt     │ - Tx verification   │
│ - Reserves   │               │                    │
│   badge      │               │                    │
└──────────────┴───────────────┴────────────────────┘
         │              │               │
         └──────────────┴───────────────┘
                        │
              Solana RPC + PUSD SPL Mint
         CZzgUBvxaMLwMhVSLgqJn3npmxoTo6nzMNQPAnwtHF3s
```

**Key architectural decision:** No Anchor program. Palm Pay uses direct SPL token transfers with memo instructions. Simpler, faster to ship, and still scores high on Technical Execution. Invoice state is managed off-chain (in-memory store for MVP, Supabase in roadmap).

---

## Folder Structure

```
palm-pay/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with WalletProvider
│   │   ├── page.tsx                # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Merchant dashboard
│   │   ├── pay/
│   │   │   └── [invoiceId]/
│   │   │       └── page.tsx        # Customer checkout page
│   │   ├── demo-store/
│   │   │   └── page.tsx            # Demo e-commerce store
│   │   └── api/
│   │       └── invoices/
│   │           ├── route.ts        # POST (create) + GET (list)
│   │           └── [invoiceId]/
│   │               ├── route.ts    # GET (single invoice)
│   │               └── verify/
│   │                   └── route.ts # POST (verify payment on-chain)
│   ├── components/
│   │   ├── WalletProvider.tsx
│   │   ├── WalletButton.tsx
│   │   ├── ReservesBadge.tsx
│   │   ├── ui/                     # Reusable UI components
│   │   ├── checkout/
│   │   │   ├── CheckoutCard.tsx
│   │   │   ├── PayButton.tsx
│   │   │   ├── PaymentStatus.tsx
│   │   │   └── TrustIndicators.tsx
│   │   └── dashboard/
│   │       ├── CreateInvoice.tsx
│   │       ├── TransactionHistory.tsx
│   │       └── Settings.tsx
│   ├── hooks/
│   │   ├── usePUSDBalance.ts
│   │   └── useTransaction.ts
│   ├── lib/
│   │   ├── constants.ts            # PUSD mint, network, API URLs
│   │   ├── solana.ts               # Connection helper
│   │   ├── invoice-store.ts        # In-memory invoice storage
│   │   ├── verify-payment.ts       # On-chain payment verification
│   │   └── palm-api.ts             # Palm USD API client
│   ├── types/
│   │   └── invoice.ts              # Invoice interface
│   └── scripts/
│       ├── setup-devnet.ts         # Create mock PUSD on devnet
│       └── fund-wallet.ts          # Send test PUSD to a wallet
├── .env.local
├── .env.example
├── .gitignore
├── README.md
├── ARCHITECTURE.md
├── CLAUDE.md                       # This file
├── package.json
└── tsconfig.json
```

---

## Invoice Data Model

```typescript
interface Invoice {
  id: string;                    // UUID
  merchantWallet: string;        // Solana public key (base58)
  merchantName: string;          // Display name
  amount: number;                // PUSD amount (human-readable, e.g. 25.50)
  amountLamports: bigint;        // amount * 10^6 (PUSD has 6 decimals)
  description: string;           // What the payment is for
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  createdAt: string;             // ISO timestamp
  expiresAt: string;             // ISO timestamp (default: 30 min from creation)
  paidAt?: string;               // ISO timestamp
  payerWallet?: string;          // Who paid
  txSignature?: string;          // Solana transaction signature
  memo: string;                  // Invoice ID used as memo in SPL transfer
}
```

---

## Payment Flow

1. **Merchant** creates invoice in dashboard → POST /api/invoices → gets payment link `/pay/<invoiceId>`
2. **Customer** opens payment link → sees checkout card with amount, merchant, description
3. **Customer** connects wallet → clicks "Pay with PUSD" → wallet signs SPL transfer + memo
4. **Transaction** confirmed on Solana → backend verifies via POST /api/invoices/<id>/verify
5. **Both** see success: green checkmark, Solscan link, receipt

---

## Judging Criteria (What to Optimize For)

| Criterion | Weight | What We Do |
|---|---|---|
| Technical Execution | 35% | Real SPL transfers with PUSD mint, clean TypeScript, on-chain verification, deployed on Vercel |
| Product & Use Case | 30% | Clear user (MENA merchants), real pain (freeze risk), working demo store |
| Innovation | 15% | Lean into non-freezable narrative — "what USDC literally cannot do" |
| Traction | 10% | Get 5-10 test users, waitlist, demo transactions |
| Team | 10% | Show GitHub history, prior shipped projects (Birdeye Token Radar, PrivatePayroll) |

---

## Submission Checklist

- [ ] GitHub repo (public): github.com/nanda-1-wq/palm-pay
- [ ] Deployed on Vercel: palm-pay.vercel.app
- [ ] Demo video (Loom, 3-5 min)
- [ ] Pitch deck (max 12 slides, 5 min)
- [ ] Colosseum link: arena.colosseum.org/projects/explore/privatepayroll
- [ ] Superteam Earn form submitted
- [ ] README complete with architecture + setup instructions
- [ ] All flows working end-to-end on devnet

---

## Pitch Deck Structure (12 slides)

1. Title — Palm Pay: Censorship-Resistant Checkout for PUSD
2. Problem — Merchants using USDC/USDT face freeze risk
3. Solution — Palm Pay: non-custodial PUSD checkout on Solana
4. How It Works — 3-step flow: create invoice → customer pays → instant settlement
5. Demo — Screenshots / GIF of checkout + dashboard
6. PUSD Advantage — Non-freezable, ISAE-attested, no blacklist
7. Architecture — SPL transfers + API + widget diagram
8. Market — TAM of stablecoin payments in MENA/EM
9. Traction — Test users, transactions, waitlist numbers
10. Roadmap — MVP → fiat on-ramp → multi-merchant → mobile SDK
11. Team — Background, GitHub, prior shipped projects
12. Ask — Partnership with Palm USD, merchant pilots

---

## Build Rules

- **Step by step.** Complete one task, verify it works, then move to the next. Do not rush.
- **Dark theme throughout.** bg-gray-950 background, gray-900 cards, white text.
- **No Anchor program.** Direct SPL transfers + memo. Keep it simple.
- **In-memory invoice store.** No database for MVP. Mention Supabase in roadmap.
- **Mock PUSD on devnet.** Create a test mint. Document the mainnet swap clearly.
- **All env vars in .env.local.** Never hardcode secrets. Use NEXT_PUBLIC_ prefix for client vars.
- **Add CLAUDE.md to .gitignore.** Do not commit this file.
- **Responsive design.** Everything must work on mobile.
- **Professional UI.** This goes in a demo video. No placeholder jank.

---

## Task Sequence (execute in order)

### T1 — Project Scaffolding
- Initialize Next.js 16 project with TypeScript + Tailwind
- Create folder structure (see above)
- Create constants.ts with PUSD mint, decimals, network, API URLs
- Create .env.local and .env.example
- Build landing page with hero, CTAs (Dashboard + Demo Store), feature grid
- **Verify:** `npm run dev` → landing page loads at localhost:3000

### T2 — Wallet Connection
- Create solana.ts with getConnection() helper
- Create WalletProvider.tsx (Phantom + Solflare adapters)
- Create WalletButton.tsx with truncated address display
- Update layout.tsx: wrap with WalletProvider, add header with WalletButton
- Create usePUSDBalance.ts hook (getAssociatedTokenAddress + getAccount)
- **Verify:** Connect Phantom → address shows in header

### T3 — Invoice API Routes
- Create types/invoice.ts with Invoice interface
- Create lib/invoice-store.ts (in-memory Map with CRUD functions)
- Create API routes:
  - POST /api/invoices (create invoice)
  - GET /api/invoices (list, optional ?merchant= filter)
  - GET /api/invoices/[invoiceId] (get single)
  - POST /api/invoices/[invoiceId]/verify (verify payment on-chain)
- Create lib/verify-payment.ts (fetch parsed tx, check SPL transfer, verify mint + amount + destination)
- **Verify:** curl POST to create invoice → GET returns it with status "pending"

### T4 — Merchant Dashboard
- Create /dashboard page (wallet-gated)
- Sidebar tabs: Create Invoice, Transactions, Settings
- CreateInvoice.tsx: form → POST /api/invoices → show payment link + QR code
- TransactionHistory.tsx: table of invoices with status badges + Solscan links
- Settings.tsx: wallet address, PUSD balance, network info
- **Verify:** Connect wallet → create invoice → see payment link + QR → switch to Transactions → see pending invoice

### T5 — Customer Checkout Page
- Create /pay/[invoiceId] page
- CheckoutCard.tsx: merchant name, description, amount, countdown timer
- PayButton.tsx: build SPL transfer + memo → send via wallet adapter → verify on-chain
- PaymentStatus.tsx: idle → signing → confirming → success/error states
- Solana Pay QR code with polling (check invoice status every 5 seconds)
- TrustIndicators.tsx: non-freezable, no blacklist, instant settlement, 1:1 backed
- **Verify:** Create invoice → open payment link → connect wallet → pay → see success + Solscan link (will fail without PUSD tokens — that's expected, T6 fixes this)

### T6 — Devnet Mock PUSD & Testing
- Create scripts/setup-devnet.ts: generate keypair, airdrop SOL, create mock SPL mint (6 decimals), mint 1M tokens
- Create scripts/fund-wallet.ts: transfer 1000 mock PUSD to any wallet
- Update constants.ts: getPUSDMint() returns devnet or mainnet mint based on env
- Update all code to use getPUSDMint()
- Add npm scripts: "setup-devnet" and "fund-wallet"
- **Verify:** Run setup-devnet → fund your Phantom wallet → dashboard shows balance → create invoice → pay → full flow works on devnet

### T7 — Demo Store
- Create /demo-store page with 4-6 fake products (name, price in PUSD, image placeholder)
- "Buy with PUSD" button → auto-creates invoice → opens checkout flow (modal or redirect)
- Success: "Order confirmed!" with Solscan link
- Devnet banner: "Demo store running on Solana devnet. No real money exchanged."
- **Verify:** Browse products → buy one → pay with devnet PUSD → see confirmation

### T8 — Reserves Badge & Palm USD API
- Create lib/palm-api.ts: fetchPUSDCirculation() with 5-min cache
- Create ReservesBadge.tsx: circulation figure, "1:1 backed", ISAE attestation, verified indicator
- Create TrustIndicators.tsx: non-freezable, no blacklist, instant settlement, reserves badge
- Add ReservesBadge to: checkout page, dashboard settings, landing page
- Graceful fallback if API is down
- **Verify:** Reserves badge appears on checkout, dashboard, and landing page

### T9 — Landing Page Polish
- Full landing page with 5 sections:
  1. Hero: headline + subheading + CTAs
  2. How It Works: 3-step visual
  3. Why PUSD: comparison table vs USDC/USDT
  4. For Developers: API snippet
  5. Live Reserves: ReservesBadge
- Footer: GitHub, Demo, Palm USD, Solana links
- Responsive design, meta tags, favicon
- **Verify:** Polished landing page, all sections, mobile responsive

### T10 — README, Docs & Cleanup
- Comprehensive README.md (overview, features, architecture, tech stack, PUSD integration, setup, API reference, demo links, roadmap)
- ARCHITECTURE.md (data flow, invoice lifecycle, payment verification, security)
- Code cleanup: remove console.logs, strict TypeScript, JSDoc comments
- `npm run build` passes, `npm run lint` clean
- .env.example documented, .gitignore complete
- **Verify:** `npm run build` → no errors. README covers all sections.

### T11 — Deploy to Vercel
- Push to GitHub
- Connect to Vercel, set env vars
- Verify all pages and flows work on production URL
- Update README with live URL
- **Verify:** palm-pay.vercel.app loads, full flow testable

---

## Post-Build (Manual)

### Demo Video (Loom, 3-5 min)
1. Landing page → value prop
2. Connect as merchant → Dashboard → Create invoice
3. Copy payment link → open as customer → Pay with PUSD
4. On-chain confirmation + Solscan link
5. Demo Store → buy a product → full flow
6. Reserves badge
7. Architecture overview
8. Close: "Palm Pay — payments that can't be frozen."

### Pitch Deck
Build in Canva or Google Slides. 12 slides, 5 min pitch. See structure above.

### Earn Submission
- Title: Palm Pay
- Description: Solana Pay-compatible PUSD merchant checkout with censorship-resistant settlement
- GitHub: github.com/nanda-1-wq/palm-pay
- Website: palm-pay.vercel.app
- Colosseum: arena.colosseum.org/projects/explore/privatepayroll
- Demo video: [Loom link]
- Pitch deck: [link]

---

## Timeline

| Days | Tasks | What Gets Built |
|---|---|---|
| Day 1-2 | T1, T2, T3 | Scaffolding + wallet + API routes |
| Day 3-5 | T4, T5 | Dashboard + checkout page |
| Day 6-7 | T6, T7 | Devnet testing + demo store |
| Day 8-9 | T8, T9 | Reserves badge + landing polish |
| Day 10-11 | T10, T11 | Docs + cleanup + deploy |
| Day 12-14 | Manual | Demo video + pitch deck |
| Day 15-16 | Manual | Traction (test users, waitlist) |
| Day 17-18 | Manual | Submit on Earn |
| Day 19-25 | Buffer | Polish / respond to judges |