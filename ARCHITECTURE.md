# Palm Pay — Architecture

Technical reference for the Palm Pay codebase. Start here if you're contributing or auditing the code.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Data Flow](#data-flow)
3. [Invoice Lifecycle](#invoice-lifecycle)
4. [Payment Verification](#payment-verification)
5. [Security Considerations](#security-considerations)
6. [Environment & Configuration](#environment--configuration)
7. [Key Design Decisions](#key-design-decisions)

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout: fonts, WalletProvider, nav header
│   ├── page.tsx                    # Landing page (5 sections + footer)
│   ├── dashboard/page.tsx          # Merchant dashboard (wallet-gated)
│   ├── demo-store/page.tsx         # Demo e-commerce store
│   ├── pay/[invoiceId]/page.tsx    # Customer checkout page
│   └── api/
│       ├── invoices/
│       │   ├── route.ts            # POST (create), GET (list)
│       │   └── [invoiceId]/
│       │       ├── route.ts        # GET (single)
│       │       └── verify/route.ts # POST (on-chain verification)
│       └── reserves/route.ts       # PUSD circulation proxy (5-min cache)
│
├── components/
│   ├── WalletProvider.tsx          # Solana wallet adapter context
│   ├── WalletButton.tsx            # Connect/disconnect button
│   ├── ReservesBadge.tsx           # Live PUSD reserves widget
│   ├── checkout/
│   │   ├── CheckoutCard.tsx        # Invoice display + countdown
│   │   ├── PayButton.tsx           # Build + submit SPL transfer
│   │   ├── PaymentStatus.tsx       # idle → signing → confirming → done
│   │   └── TrustIndicators.tsx     # Non-freeze, no-blacklist badges
│   └── dashboard/
│       ├── CreateInvoice.tsx       # Invoice creation form
│       ├── TransactionHistory.tsx  # Invoice table with status badges
│       └── Settings.tsx            # Wallet info + PUSD balance
│
├── hooks/
│   ├── usePUSDBalance.ts           # PUSD token balance for connected wallet
│   └── useTransaction.ts           # SPL transfer builder + sender
│
├── lib/
│   ├── constants.ts                # Mint addresses, network, API base URLs
│   ├── solana.ts                   # Singleton Connection + PublicKey helpers
│   ├── invoice-store.ts            # In-memory invoice CRUD (Map-backed)
│   ├── verify-payment.ts           # On-chain transaction verification
│   └── palm-api.ts                 # Palm USD API client with 5-min cache
│
├── types/
│   └── invoice.ts                  # Invoice interface + JSON serialiser
│
└── scripts/
    ├── setup-devnet.ts             # Create mock PUSD mint on devnet
    └── fund-wallet.ts              # Send mock PUSD to a wallet
```

---

## Data Flow

### Invoice Creation

```
Browser (Dashboard)
  │
  ├─▶ POST /api/invoices
  │     body: { merchantWallet, merchantName, amount, description }
  │
  │   API Route
  │     ├─ Validate: Solana address, positive amount, required fields
  │     ├─ invoice-store.createInvoice()
  │     │     - UUID generated for id + memo
  │     │     - amountLamports = amount × 10^6 (6 decimals)
  │     │     - expiresAt = now + 30 minutes
  │     │     - status = "pending"
  │     └─ Returns invoice JSON (BigInt serialised as string)
  │
  └─▶ Dashboard displays: payment link + QR code
```

### Customer Payment

```
Browser (Checkout /pay/:id)
  │
  ├─▶ GET /api/invoices/:id          (fetch invoice on page load)
  │
  ├─ Display: amount, merchant, description, countdown timer
  │
  ├─ Customer clicks "Pay with PUSD"
  │     useTransaction hook:
  │       ├─ getOrCreateAssociatedTokenAccount (customer's ATA)
  │       ├─ Build SPL createTransferCheckedInstruction:
  │       │     source:      customer's PUSD ATA
  │       │     destination: merchant's PUSD ATA
  │       │     mint:        getPUSDMint() (devnet or mainnet)
  │       │     amount:      invoice.amountLamports
  │       │     decimals:    6
  │       ├─ Append MemoProgram instruction (invoice.memo = invoice.id)
  │       └─ sendTransaction via wallet adapter
  │
  ├─▶ POST /api/invoices/:id/verify
  │     body: { txSignature }
  │
  └─ Display: Solscan link + receipt
```

### Reserves Badge

```
Client component (ReservesBadge)
  │
  ├─▶ GET /api/reserves
  │     (server-side, cached 5 min via unstable_cache)
  │     │
  │     └─▶ GET https://api.palmusd.com/v1/circulation
  │               Normalises field names: circulation / total / totalSupply / amount
  │               Returns: { ok, circulation, updatedAt }
  │
  └─ Renders: circulation figure, "1:1 backed", ISAE attestation, "Verified" badge
```

---

## Invoice Lifecycle

```
                    ┌──────────┐
          create    │          │
─────────────────▶  │ PENDING  │
                    │          │
                    └────┬─────┘
                         │
           ┌─────────────┼──────────────┐
           │             │              │
     verify success  expiry check   cancel
           │             │              │
           ▼             ▼              ▼
       ┌──────┐     ┌─────────┐   ┌──────────┐
       │ PAID │     │ EXPIRED │   │CANCELLED │
       └──────┘     └─────────┘   └──────────┘
           │
     (terminal — no further transitions)
```

**State rules:**
- Only `pending` invoices can be verified. `paid`, `expired`, and `cancelled` invoices reject verification with a 400.
- Expiry is stored as an ISO timestamp (`expiresAt`). The checkout page calculates remaining time client-side and shows a countdown. Server-side expiry enforcement is not implemented in MVP — the 30-minute window is advisory.
- The in-memory store is process-scoped. Invoices are lost on server restart. Supabase persistence is planned for Phase 2.

---

## Payment Verification

`src/lib/verify-payment.ts` — `verifyPUSDPayment(txSignature, merchantWallet, expectedAmountLamports)`

### Steps

1. **Fetch parsed transaction** from Solana RPC via `getParsedTransaction` with `commitment: confirmed`.

2. **Check for on-chain errors** — `tx.meta.err` must be null.

3. **Compute merchant ATA** — `getAssociatedTokenAddressSync(pusdMint, merchantPubkey)`.

4. **Scan all instructions** (top-level + inner instructions from `meta.innerInstructions`). For each SPL-token instruction:
   - Skip if not `transfer` or `transferChecked`
   - Check `destination` === merchant ATA
   - For `transferChecked`: also verify `mint` === PUSD mint
   - Extract `transferAmount` from `tokenAmount.amount` (as BigInt)

5. **Amount check** — allow ±1 lamport tolerance for floating-point rounding edge cases.

6. **Resolve payer wallet**:
   - Primary: look up the `source` token account's owner in `preTokenBalances` / `postTokenBalances`
   - Fallback: use `authority` field from the instruction info

7. **Return** `{ valid: true, payerWallet }` on success, or `{ valid: false, error }` on any failure.

### Why Both `transfer` and `transferChecked`?

Most wallets use `transferChecked` (the recommended instruction that includes mint and decimal verification). Some older integrations or wrappers use the legacy `transfer` instruction. Supporting both maximises wallet compatibility. When `transfer` is matched, the mint is validated implicitly via the destination ATA (which is deterministically derived from the PUSD mint).

---

## Security Considerations

### No Private Keys in the Application

Palm Pay never handles merchant or customer private keys. All signing is done inside the user's wallet (Phantom/Solflare). The server only reads public chain data.

### ATA Validation

The merchant's destination address is computed server-side using `getAssociatedTokenAddressSync(pusdMint, merchantPubkey)`. This is a deterministic, program-derived address — it cannot be spoofed. Any transfer to a different token account is rejected.

### Mint Validation

For `transferChecked` instructions, the `mint` field in the parsed instruction must equal the PUSD mint address. This prevents an attacker from paying with a different SPL token to a compatible ATA.

For `transfer` instructions (legacy), the mint is validated implicitly: the merchant ATA is derived from the PUSD mint, so a transfer to that account must involve PUSD.

### Amount Validation

`expectedAmountLamports` (computed as `amount × 10^6`) is compared to the on-chain `tokenAmount.amount`. A ±1 lamport tolerance accounts for rounding when the frontend converts between float and integer representations. No fractional underpayment is accepted.

### Invoice Status Idempotency

The verify endpoint checks `invoice.status === 'paid'` before processing. A second verification request on an already-paid invoice returns 400, preventing double-processing.

### Memo Instruction

The checkout page appends a `MemoProgram` instruction with the invoice UUID. This is informational — it lets merchants match on-chain transactions to their internal invoices via Solscan or their own indexers. The server verification does not currently require the memo to match (it verifies by txSignature + amount + destination). This is intentional: memo enforcement would require reading the memo instruction from the parsed tx, adding complexity without security benefit (the txSignature already uniquely identifies the payment).

### No Custodial Risk

PUSD transfers go directly from the customer's ATA to the merchant's ATA. Palm Pay's server is never in the token transfer path. Even if the Palm Pay server is compromised, no funds can be redirected or frozen.

---

## Environment & Configuration

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_NETWORK` | Client + Server | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_RPC_URL` | Client + Server | Solana RPC endpoint |
| `NEXT_PUBLIC_PUSD_MINT_DEVNET` | Client + Server | Devnet mock PUSD mint address |
| `NEXT_PUBLIC_DEMO_MERCHANT_WALLET` | Client | Demo store merchant wallet |
| `PALM_USD_API_BASE` | Server only | Override for Palm USD API URL (optional) |

`getPUSDMint()` in `constants.ts` selects between devnet and mainnet mint automatically based on `NEXT_PUBLIC_NETWORK`.

---

## Key Design Decisions

### No Anchor Program

Palm Pay uses direct SPL token transfers via `@solana/spl-token` rather than a custom Anchor program. This keeps the on-chain surface area minimal (no program deployment, no IDL, no upgrade authority risk) and makes the code auditable by anyone familiar with SPL tokens.

### In-Memory Invoice Store

For MVP, invoices live in a `Map<string, Invoice>` in the Next.js server process. This means invoices are lost on server restart (Vercel cold starts). Phase 2 will add Supabase for persistence. The design is intentionally simple to ship fast.

### Server-Side Reserves Proxy

Rather than calling `api.palmusd.com` directly from the browser (CORS risk, API key exposure), the `/api/reserves` route proxies the request server-side and caches the result for 5 minutes using Next.js `unstable_cache`. The client only ever talks to its own origin.

### BigInt Serialisation

`Invoice.amountLamports` is a `BigInt` (required for safe integer arithmetic with large PUSD amounts). `JSON.stringify` cannot serialise BigInt natively, so `invoiceToJSON()` in `types/invoice.ts` converts it to a string before returning from API routes.

### `transferChecked` vs `transfer`

The checkout `PayButton` always sends `transferChecked` (the modern, safer instruction). The server verifier accepts both to remain compatible with payments made by third-party tools or future integrations.
