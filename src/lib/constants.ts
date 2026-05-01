export const PUSD_MINT_MAINNET = "CZzgUBvxaMLwMhVSLgqJn3npmxoTo6nzMNQPAnwtHF3s";
export const PUSD_DECIMALS = 6;
export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_NETWORK as "devnet" | "mainnet-beta") || "devnet";
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
export const PALM_USD_API = "https://api.palmusd.com/v1";

export function getPUSDMint(): string {
  return process.env.NEXT_PUBLIC_PUSD_MINT || PUSD_MINT_MAINNET;
}
