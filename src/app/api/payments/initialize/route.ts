import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { orderId, amount, email, type } = await req.json()

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Paystack uses kobo
      reference: `TN-${orderId}-${type}-${Date.now()}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify`,
      metadata: { orderId, type, custom_fields: [{ display_name: 'Order ID', variable_name: 'order_id', value: orderId }] },
    }),
  })

  const data = await res.json()
  if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 })
  return NextResponse.json(data.data)
}
