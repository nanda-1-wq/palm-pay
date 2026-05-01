import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";

const DEVNET_URL = "https://api.devnet.solana.com";
const KEYS_DIR = path.join(process.cwd(), ".keys");
const AUTHORITY_PATH = path.join(KEYS_DIR, "devnet-authority.json");
const ENV_LOCAL_PATH = path.join(process.cwd(), ".env.local");

async function main() {
  const connection = new Connection(DEVNET_URL, "confirmed");

  // a. Generate or load the authority keypair
  let authority: Keypair;
  if (fs.existsSync(AUTHORITY_PATH)) {
    const raw = JSON.parse(fs.readFileSync(AUTHORITY_PATH, "utf-8"));
    authority = Keypair.fromSecretKey(new Uint8Array(raw));
    console.log("Loaded existing authority:", authority.publicKey.toBase58());
  } else {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
    authority = Keypair.generate();
    fs.writeFileSync(AUTHORITY_PATH, JSON.stringify(Array.from(authority.secretKey)));
    console.log("Generated new authority:", authority.publicKey.toBase58());
  }

  // b. Check balance; skip airdrop if already funded
  const balance = await connection.getBalance(authority.publicKey);
  const balanceSOL = balance / LAMPORTS_PER_SOL;
  console.log(`Authority balance: ${balanceSOL} SOL`);
  if (balanceSOL > 0.5) {
    console.log("Sufficient balance — skipping airdrop.");
  } else {
    console.log("Requesting airdrop of 2 SOL...");
    const sig = await connection.requestAirdrop(
      authority.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: sig, ...latestBlockhash });
    console.log("Airdrop confirmed.");
  }

  // c. Create SPL token mint with 6 decimals
  console.log("Creating mock PUSD mint...");
  const mint = await createMint(
    connection,
    authority,
    authority.publicKey, // mint authority
    authority.publicKey, // freeze authority
    6                    // decimals
  );

  // d. Mint 1,000,000 tokens to authority's ATA
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    mint,
    authority.publicKey
  );
  await mintTo(
    connection,
    authority,
    mint,
    ata.address,
    authority,
    1_000_000 * 10 ** 6
  );
  console.log("Minted 1,000,000 mock PUSD to authority ATA:", ata.address.toBase58());

  // e. Print mint address
  const mintAddress = mint.toBase58();
  console.log("\nMock PUSD Mint:", mintAddress);

  // f. Save mint address to .env.local
  const key = "NEXT_PUBLIC_PUSD_MINT_DEVNET";
  let envContent = fs.existsSync(ENV_LOCAL_PATH)
    ? fs.readFileSync(ENV_LOCAL_PATH, "utf-8")
    : "";

  const lineRegex = new RegExp(`^${key}=.*$`, "m");
  if (lineRegex.test(envContent)) {
    envContent = envContent.replace(lineRegex, `${key}=${mintAddress}`);
  } else {
    envContent = envContent.trimEnd() + `\n${key}=${mintAddress}\n`;
  }
  fs.writeFileSync(ENV_LOCAL_PATH, envContent);
  console.log(`Saved ${key} to .env.local`);
  console.log("\nDevnet setup complete. Restart `npm run dev` to pick up the new mint.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
