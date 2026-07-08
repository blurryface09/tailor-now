import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateServiceCharge } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { orderId, amount, email, type } = await req.json()
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    return NextResponse.json({ error: 'Paystack is not configured yet.' }, { status: 503 })
  }

  if (!orderId || !amount || !email) {
    return NextResponse.json({ error: 'Missing payment details.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, customer_id, agreed_price, status, deposit_paid')
    .eq('id', orderId)
    .single()

  if (orderError || !order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  if (order.customer_id !== user.id) return NextResponse.json({ error: 'You can only pay for your own order.' }, { status: 403 })
  if (order.status !== 'accepted') return NextResponse.json({ error: 'This order is not ready for payment yet.' }, { status: 400 })
  if (order.deposit_paid) return NextResponse.json({ error: 'This order has already been paid.' }, { status: 400 })
  if (!order.agreed_price || Number(order.agreed_price) !== Number(amount)) {
    return NextResponse.json({ error: 'Payment amount no longer matches the order price.' }, { status: 400 })
  }

  const { serviceCharge, totalCharged } = calculateServiceCharge(amount)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    new URL(req.url).origin

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(totalCharged * 100),
      reference: `TN-${orderId}-${type}-${Date.now()}`,
      callback_url: `${appUrl}/api/payments/verify`,
      metadata: {
        orderId,
        type,
        platform: 'tailornow',
        payout_model: 'platform_collects_then_manual_payout',
        agreed_price: amount,
        service_charge: serviceCharge,
        custom_fields: [
          { display_name: 'Order ID', variable_name: 'order_id', value: orderId },
          { display_name: 'Service Charge', variable_name: 'service_charge', value: serviceCharge },
        ],
      },
    }),
  })

  const data = await res.json()
  if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 })
  return NextResponse.json({ ...data.data, serviceCharge, totalCharged })
}
