import { ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { getConnection, getPUSDMintPublicKey } from './solana'

interface VerifyResult {
  valid: boolean
  payerWallet?: string
  error?: string
}

type ParsedTokenTransferChecked = {
  type: 'transferChecked'
  info: {
    mint: string
    source: string
    destination: string
    authority: string
    tokenAmount: { amount: string; decimals: number; uiAmount: number }
  }
}

type ParsedTokenTransfer = {
  type: 'transfer'
  info: {
    source: string
    destination: string
    authority: string
    amount: string
  }
}

function getOwnerOfTokenAccount(
  tx: ParsedTransactionWithMeta,
  tokenAccountAddress: string
): string | undefined {
  const accountKeys = tx.transaction.message.accountKeys
  const accountIndex = accountKeys.findIndex(
    (key) => key.pubkey.toBase58() === tokenAccountAddress
  )
  if (accountIndex === -1) return undefined

  const allTokenBalances = [
    ...(tx.meta?.preTokenBalances ?? []),
    ...(tx.meta?.postTokenBalances ?? []),
  ]
  return allTokenBalances.find((b) => b.accountIndex === accountIndex)?.owner
}

function checkTransfer(
  parsed: ParsedTokenTransferChecked | ParsedTokenTransfer,
  merchantATA: PublicKey,
  pusdMint: PublicKey,
  expectedAmountLamports: bigint
): { match: boolean; transferAmount?: bigint; sourceAccount?: string; authority?: string } {
  if (parsed.type === 'transferChecked') {
    const { mint, destination, source, authority, tokenAmount } = parsed.info
    if (mint !== pusdMint.toBase58()) return { match: false }
    if (destination !== merchantATA.toBase58()) return { match: false }
    return {
      match: true,
      transferAmount: BigInt(tokenAmount.amount),
      sourceAccount: source,
      authority,
    }
  }

  if (parsed.type === 'transfer') {
    const { destination, source, authority, amount } = parsed.info
    if (destination !== merchantATA.toBase58()) return { match: false }
    return {
      match: true,
      transferAmount: BigInt(amount),
      sourceAccount: source,
      authority,
    }
  }

  return { match: false }
}

export async function verifyPUSDPayment(
  txSignature: string,
  expectedMerchant: string,
  expectedAmountLamports: bigint
): Promise<VerifyResult> {
  const connection = getConnection()

  let tx: ParsedTransactionWithMeta | null
  try {
    tx = await connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    })
  } catch {
    return { valid: false, error: 'Failed to fetch transaction from Solana' }
  }

  if (!tx) {
    return { valid: false, error: 'Transaction not found on-chain' }
  }

  if (tx.meta?.err) {
    return { valid: false, error: 'Transaction failed on-chain' }
  }

  const pusdMint = getPUSDMintPublicKey()

  let merchantPubkey: PublicKey
  try {
    merchantPubkey = new PublicKey(expectedMerchant)
  } catch {
    return { valid: false, error: 'Invalid merchant wallet address' }
  }

  const merchantATA = getAssociatedTokenAddressSync(pusdMint, merchantPubkey)

  // Gather all instructions (top-level + inner)
  const topLevel = tx.transaction.message.instructions
  const inner = (tx.meta?.innerInstructions ?? []).flatMap((i) => i.instructions)
  const allInstructions = [...topLevel, ...inner]

  for (const ix of allInstructions) {
    if (!('parsed' in ix) || !ix.parsed) continue
    if (ix.program !== 'spl-token') continue

    const parsed = ix.parsed as { type: string; info: Record<string, unknown> }
    if (parsed.type !== 'transfer' && parsed.type !== 'transferChecked') continue

    const result = checkTransfer(
      parsed as ParsedTokenTransferChecked | ParsedTokenTransfer,
      merchantATA,
      pusdMint,
      expectedAmountLamports
    )

    if (!result.match) continue

    const { transferAmount, sourceAccount, authority } = result

    // Allow ±1 lamport tolerance for rounding
    if (
      transferAmount! < expectedAmountLamports - 1n ||
      transferAmount! > expectedAmountLamports + 1n
    ) {
      return {
        valid: false,
        error: `Amount mismatch: expected ${expectedAmountLamports}, got ${transferAmount}`,
      }
    }

    // Resolve payer: for transferChecked use token balance owner; for transfer use authority
    const payerWallet =
      (sourceAccount ? getOwnerOfTokenAccount(tx, sourceAccount) : undefined) ??
      authority

    return { valid: true, payerWallet }
  }

  return { valid: false, error: 'No valid PUSD transfer to merchant found in transaction' }
}
