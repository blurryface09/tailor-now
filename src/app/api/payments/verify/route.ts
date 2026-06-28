import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateCommission } from '@/lib/utils'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

async function markOrderPaid(orderId: string, reference: string, amount: number) {
  const supabase = await createClient()

  await supabase.from('orders').update({
    deposit_paid: true,
    balance_paid: true,
    paystack_ref: reference,
  }).eq('id', orderId)

  const { data: order } = await supabase
    .from('orders')
    .select('agreed_price, tailor_id')
    .eq('id', orderId)
    .single()

  if (order) {
    const gross = order.agreed_price || amount
    const { commission, net } = calculateCommission(gross)
    await supabase.from('payouts').upsert({
      tailor_id: order.tailor_id,
      order_id: orderId,
      gross_amount: gross,
      commission_rate: 0.20,
      commission_amount: commission,
      net_amount: net,
      status: 'pending',
    }, { onConflict: 'order_id' })
  }
}

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
    await markOrderPaid(orderId, reference, amount / 100)
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

  await markOrderPaid(orderId, reference, amount)

  return redirect(`/orders/${orderId}?payment=success`)
}
