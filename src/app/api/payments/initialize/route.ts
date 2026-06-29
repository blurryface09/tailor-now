import { NextRequest, NextResponse } from 'next/server'
import { calculateServiceCharge } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { orderId, amount, email, type } = await req.json()

  const { serviceCharge, totalCharged } = calculateServiceCharge(amount)

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(totalCharged * 100),
      reference: `TN-${orderId}-${type}-${Date.now()}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify`,
      metadata: {
        orderId, type,
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
