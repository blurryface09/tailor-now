import { NextRequest, NextResponse } from 'next/server'
import { handlePaystackWebhook } from '@/lib/payments'

// Paystack webhook — called server-to-server after every successful charge.
export async function POST(req: NextRequest) {
  const body = await req.text()
  const { status, body: payload } = await handlePaystackWebhook(
    body,
    req.headers.get('x-paystack-signature')
  )
  return NextResponse.json(payload, { status })
}
