import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-paystack-signature')
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(body).digest('hex')

  if (hash !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  const event = JSON.parse(body)

  if (event.event === 'charge.success') {
    // Additional server-side payment confirmation logic can go here
    // The verify route handles the primary flow; this is a backup
    console.log('Paystack webhook:', event.data.reference)
  }

  return NextResponse.json({ status: 'ok' })
}
