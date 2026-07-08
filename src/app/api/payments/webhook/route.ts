import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { markOrderPaid } from '@/lib/payments'

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'misconfigured' }, { status: 500 })

  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature')
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')

  if (hash !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  const event = JSON.parse(body)

  if (event.event === 'charge.success') {
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
  }

  return NextResponse.json({ status: 'ok' })
}
