import { v4 as uuidv4 } from 'uuid'
import { Invoice } from '@/types/invoice'

const store = new Map<string, Invoice>()

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

export function getInvoice(id: string): Invoice | undefined {
  return store.get(id)
}

export function updateInvoice(id: string, updates: Partial<Invoice>): Invoice | undefined {
  const invoice = store.get(id)
  if (!invoice) return undefined
  const updated = { ...invoice, ...updates }
  store.set(id, updated)
  return updated
}

export function getInvoicesByMerchant(merchantWallet: string): Invoice[] {
  return Array.from(store.values()).filter(
    (inv) => inv.merchantWallet === merchantWallet
  )
}

export function getAllInvoices(): Invoice[] {
  return Array.from(store.values())
}
