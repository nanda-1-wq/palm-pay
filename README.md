# Palm Pay

PUSD payment infrastructure on Solana — merchant dashboard, invoice creation, and customer checkout.

## Development Setup

### Prerequisites

- Node.js 18+
- A [Phantom](https://phantom.app/) wallet set to **devnet**

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file:

```bash
cp .env.example .env.local
```

Set the network to devnet in `.env.local`:

```
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
```

### 3. Create mock PUSD on devnet

This generates a devnet authority keypair (stored in `.keys/devnet-authority.json`), airdrops 2 SOL, creates an SPL token mint with 6 decimals, mints 1,000,000 tokens, and writes `NEXT_PUBLIC_PUSD_MINT_DEVNET` to `.env.local`.

```bash
npm run setup-devnet
```

### 4. Fund your Phantom wallet

Replace `<your-phantom-wallet>` with your devnet wallet address (visible in Phantom → copy address).

```bash
npm run fund-wallet <your-phantom-wallet>
```

Your wallet now holds 1000 mock PUSD on devnet.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Testing the payment flow

1. **Dashboard** → Settings → verify PUSD balance shows 1000
2. **Dashboard** → Create Invoice → fill in amount and description
3. Share the invoice link (or open `/pay/<invoiceId>`)
4. Connect Phantom on the payment page → click **Pay** → approve the transaction
5. Payment status updates to confirmed

---

## Scripts

| Command | Description |
|---|---|
| `npm run setup-devnet` | Create mock PUSD mint on devnet (run once) |
| `npm run fund-wallet <address>` | Send 1000 mock PUSD to a wallet |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |

---

## Project structure

```
src/
  app/           Next.js App Router pages and API routes
  components/    UI components (dashboard, checkout)
  hooks/         usePUSDBalance and other hooks
  lib/           Solana helpers, constants, invoice store
  scripts/       Devnet setup and funding utilities
  types/         Shared TypeScript types
```
