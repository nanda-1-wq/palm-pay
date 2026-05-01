import { NextRequest, NextResponse } from 'next/server'
import { getInvoice, updateInvoice } from '@/lib/invoice-store'
import { invoiceToJSON } from '@/types/invoice'
import { verifyPUSDPayment } from '@/lib/verify-payment'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const invoice = getInvoice(invoiceId)

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
    }

    if (invoice.status !== 'pending') {
      return NextResponse.json(
        { error: `Invoice is ${invoice.status}, cannot verify payment` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { txSignature } = body

    if (!txSignature || typeof txSignature !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: txSignature' },
        { status: 400 }
      )
    }

    const result = await verifyPUSDPayment(
      txSignature,
      invoice.merchantWallet,
      invoice.amountLamports
    )

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error ?? 'Payment verification failed' },
        { status: 400 }
      )
    }

    const updated = updateInvoice(invoiceId, {
      status: 'paid',
      paidAt: new Date().toISOString(),
      payerWallet: result.payerWallet,
      txSignature,
    })

    return NextResponse.json(invoiceToJSON(updated!))
  } catch (err) {
    const message = err instanceof Error ? err.message || err.name : String(err)
    console.error('POST /api/invoices/[invoiceId]/verify error:', message, err)
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 })
  }
}
