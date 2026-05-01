import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import fs from "fs";
import path from "path";

const DEVNET_URL = "https://api.devnet.solana.com";
const KEYS_DIR = path.join(process.cwd(), ".keys");
const AUTHORITY_PATH = path.join(KEYS_DIR, "devnet-authority.json");
const ENV_LOCAL_PATH = path.join(process.cwd(), ".env.local");

function readEnvLocal(): Record<string, string> {
  if (!fs.existsSync(ENV_LOCAL_PATH)) return {};
  const vars: Record<string, string> = {};
  for (const line of fs.readFileSync(ENV_LOCAL_PATH, "utf-8").split("\n")) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) vars[match[1].trim()] = match[2].trim();
  }
  return vars;
}

async function main() {
  const walletAddress = process.argv[2];
  if (!walletAddress) {
    console.error("Usage: npm run fund-wallet <wallet-address>");
    process.exit(1);
  }

  const env = readEnvLocal();
  const mintAddress = env["NEXT_PUBLIC_PUSD_MINT_DEVNET"];
  if (!mintAddress) {
    console.error("NEXT_PUBLIC_PUSD_MINT_DEVNET not set in .env.local.");
    console.error("Run `npm run setup-devnet` first.");
    process.exit(1);
  }

  if (!fs.existsSync(AUTHORITY_PATH)) {
    console.error("Authority keypair not found at .keys/devnet-authority.json.");
    console.error("Run `npm run setup-devnet` first.");
    process.exit(1);
  }

  const connection = new Connection(DEVNET_URL, "confirmed");
  const raw = JSON.parse(fs.readFileSync(AUTHORITY_PATH, "utf-8"));
  const authority = Keypair.fromSecretKey(new Uint8Array(raw));
  const mint = new PublicKey(mintAddress);

  let recipient: PublicKey;
  try {
    recipient = new PublicKey(walletAddress);
  } catch {
    console.error("Invalid wallet address:", walletAddress);
    process.exit(1);
  }

  console.log("Fetching authority ATA...");
  const authorityATA = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    mint,
    authority.publicKey
  );

  console.log("Creating recipient ATA if needed...");
  const recipientATA = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    mint,
    recipient
  );

  const amount = 1000 * 10 ** 6; // 1000 PUSD (6 decimals)
  console.log(`Transferring 1000 mock PUSD to ${walletAddress}...`);
  const txSig = await transfer(
    connection,
    authority,
    authorityATA.address,
    recipientATA.address,
    authority,
    amount
  );

  console.log("Transfer confirmed:", txSig);
  console.log(`Recipient ATA: ${recipientATA.address.toBase58()}`);
  console.log("\nDone! Your wallet now has 1000 mock PUSD on devnet.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
