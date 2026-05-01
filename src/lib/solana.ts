import { Connection, PublicKey } from "@solana/web3.js";
import { getPUSDMint, SOLANA_RPC_URL } from "./constants";

let _connection: Connection | null = null;

/**
 * Return the singleton Solana Connection instance.
 * Lazily initialised on first call using SOLANA_RPC_URL with "confirmed" commitment.
 */
export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(SOLANA_RPC_URL, "confirmed");
  }
  return _connection;
}

/**
 * Return the PUSD SPL mint as a PublicKey.
 * Selects devnet or mainnet mint based on NEXT_PUBLIC_NETWORK.
 */
export function getPUSDMintPublicKey(): PublicKey {
  return new PublicKey(getPUSDMint());
}
