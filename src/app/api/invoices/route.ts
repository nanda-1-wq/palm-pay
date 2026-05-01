import { NextRequest, NextResponse } from 'next/server'
import { PublicKey } from '@solana/web3.js'
import { createInvoice, getInvoicesByMerchant, getAllInvoices } from '@/lib/invoice-store'
import { invoiceToJSON } from '@/types/invoice'

function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchantWallet, merchantName, amount, description } = body

    if (!merchantWallet || !merchantName || amount === undefined || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: merchantWallet, merchantName, amount, description' },
        { status: 400 }
      )
    }

    if (!isValidSolanaAddress(merchantWallet)) {
      return NextResponse.json(
        { error: 'Invalid Solana address for merchantWallet' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    const invoice = createInvoice({ merchantWallet, merchantName, amount, description })
    return NextResponse.json(invoiceToJSON(invoice), { status: 201 })
  } catch (err) {
    console.error('POST /api/invoices error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const merchant = request.nextUrl.searchParams.get('merchant')
    const invoices = merchant ? getInvoicesByMerchant(merchant) : getAllInvoices()
    return NextResponse.json(invoices.map(invoiceToJSON))
  } catch (err) {
    console.error('GET /api/invoices error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
