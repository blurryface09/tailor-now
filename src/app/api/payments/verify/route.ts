import { NextRequest, NextResponse } from 'next/server'
import { markOrderPaid } from '@/lib/payments'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

// Paystack webhook — called server-to-server after every successful charge
export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'misconfigured' }, { status: 500 })

  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const expected = crypto.createHmac('sha512', secret).update(body).digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true })
  }

  const { reference, amount, metadata } = event.data
  const orderId = metadata?.orderId
  if (orderId && reference) {
    try {
      await markOrderPaid(orderId, reference, amount / 100)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Could not record payment' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  if (!reference) return redirect('/browse')

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const data = await res.json()

  if (!data.status || data.data.status !== 'success') {
    return redirect(`/orders?payment=failed`)
  }

  const { orderId } = data.data.metadata
  const amount = data.data.amount / 100

  if (!orderId) return redirect('/browse')

  try {
    await markOrderPaid(orderId, reference, amount)
  } catch {
    return redirect(`/orders/${orderId}?payment=recording_failed`)
  }

  return redirect(`/orders/${orderId}?payment=success`)
}
