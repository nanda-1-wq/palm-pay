export const PUSD_MINT_MAINNET = "CZzgUBvxaMLwMhVSLgqJn3npmxoTo6nzMNQPAnwtHF3s";
export const PUSD_MINT_DEVNET = process.env.NEXT_PUBLIC_PUSD_MINT_DEVNET;
export const PUSD_DECIMALS = 6;
export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_NETWORK as "devnet" | "mainnet-beta") || "devnet";
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
export const PALM_USD_API = "https://api.palmusd.com/v1";
// Demo store merchant wallet — receives PUSD in demo purchases
// Override via NEXT_PUBLIC_DEMO_MERCHANT_WALLET env var
export const DEMO_MERCHANT_WALLET =
  process.env.NEXT_PUBLIC_DEMO_MERCHANT_WALLET ||
  "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1";

/**
 * Return the appropriate PUSD mint address for the current network.
 * On devnet, uses the mock mint from NEXT_PUBLIC_PUSD_MINT_DEVNET (falls back to mainnet address).
 * On mainnet-beta, always returns the canonical PUSD mainnet mint.
 */
export function getPUSDMint(): string {
  if (SOLANA_NETWORK === "devnet") {
    return PUSD_MINT_DEVNET || PUSD_MINT_MAINNET;
  }
  return PUSD_MINT_MAINNET;
}
