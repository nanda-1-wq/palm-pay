import { Connection, PublicKey } from "@solana/web3.js";
import { getPUSDMint, SOLANA_RPC_URL } from "./constants";

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(SOLANA_RPC_URL, "confirmed");
  }
  return _connection;
}

export function getPUSDMintPublicKey(): PublicKey {
  return new PublicKey(getPUSDMint());
}
