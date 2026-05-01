import { NextRequest, NextResponse } from 'next/server'
import { getInvoice } from '@/lib/invoice-store'
import { invoiceToJSON } from '@/types/invoice'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const invoice = getInvoice(invoiceId)

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoiceToJSON(invoice))
  } catch (err) {
    console.error('GET /api/invoices/[invoiceId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
