export interface Invoice {
  id: string
  merchantWallet: string
  merchantName: string
  amount: number
  amountLamports: bigint
  description: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  createdAt: string
  expiresAt: string
  paidAt?: string
  payerWallet?: string
  txSignature?: string
  memo: string
}

export type InvoiceJSON = Omit<Invoice, 'amountLamports'> & {
  amountLamports: string
}

export function invoiceToJSON(invoice: Invoice): InvoiceJSON {
  return {
    ...invoice,
    amountLamports: invoice.amountLamports.toString(),
  }
}
