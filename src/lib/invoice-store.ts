import { v4 as uuidv4 } from 'uuid'
import { Invoice } from '@/types/invoice'

/** In-memory invoice store. Scoped to the server process — data is lost on restart. */
const store = new Map<string, Invoice>()

/**
 * Create a new invoice and persist it in the in-memory store.
 *
 * @param params.merchantWallet - Base58 Solana public key of the merchant
 * @param params.merchantName   - Display name shown on the checkout page
 * @param params.amount         - Human-readable PUSD amount (e.g. 25.50)
 * @param params.description    - Description of the purchase
 * @returns The newly created Invoice with status "pending" and a 30-minute expiry
 */
export function createInvoice(params: {
  merchantWallet: string
  merchantName: string
  amount: number
  description: string
}): Invoice {
  const id = uuidv4()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000)

  const invoice: Invoice = {
    id,
    merchantWallet: params.merchantWallet,
    merchantName: params.merchantName,
    amount: params.amount,
    amountLamports: BigInt(Math.round(params.amount * 1_000_000)),
    description: params.description,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    memo: id,
  }

  store.set(id, invoice)
  return invoice
}

/**
 * Retrieve a single invoice by its UUID.
 *
 * @param id - Invoice UUID
 * @returns The Invoice, or undefined if not found
 */
export function getInvoice(id: string): Invoice | undefined {
  return store.get(id)
}

/**
 * Apply a partial update to an existing invoice.
 *
 * @param id      - Invoice UUID
 * @param updates - Fields to merge into the invoice
 * @returns The updated Invoice, or undefined if the invoice does not exist
 */
export function updateInvoice(id: string, updates: Partial<Invoice>): Invoice | undefined {
  const invoice = store.get(id)
  if (!invoice) return undefined
  const updated = { ...invoice, ...updates }
  store.set(id, updated)
  return updated
}

/**
 * Return all invoices created for a given merchant wallet.
 *
 * @param merchantWallet - Base58 Solana public key of the merchant
 * @returns Array of Invoices (may be empty)
 */
export function getInvoicesByMerchant(merchantWallet: string): Invoice[] {
  return Array.from(store.values()).filter(
    (inv) => inv.merchantWallet === merchantWallet
  )
}

/** Return every invoice in the store, regardless of merchant or status. */
export function getAllInvoices(): Invoice[] {
  return Array.from(store.values())
}
