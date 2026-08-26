import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateServiceCharge, calculateCommission } from '@/lib/utils'
import { checkReferralWaiver } from '@/lib/payments'

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
    .select('id, customer_id, tailor_id, agreed_price, status, deposit_paid')
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

  // If this tailor has a Paystack subaccount, split the payment automatically at
  // checkout instead of collecting it all and paying out manually later.
  const { data: tailor } = await supabase
    .from('tailor_profiles')
    .select('user_id, paystack_subaccount_code')
    .eq('id', order.tailor_id)
    .single()

  // Read-only check — must not consume the referral here. This only
  // decides what Paystack is told to split at checkout; the waiver is
  // actually marked used once the payment is confirmed via webhook.
  const waived = tailor
    ? await checkReferralWaiver(createAdminClient(), orderId, order.customer_id, order.tailor_id, tailor.user_id)
    : false

  const splitFields = tailor?.paystack_subaccount_code
    ? {
        subaccount: tailor.paystack_subaccount_code,
        bearer: 'account' as const,
        // Platform keeps its commission plus the full service charge;
        // the rest settles straight to the tailor's own bank account.
        // Waived referral orders pass through only the service charge.
        transaction_charge: Math.round(((waived ? 0 : calculateCommission(amount).commission) + serviceCharge) * 100),
      }
    : {}

  // Keep the order id in the reference itself so a settled charge can always be
  // traced back to its order, even if Paystack returns no usable metadata.
  const reference = `TN-${orderId}-${type}-${Date.now()}`

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(totalCharged * 100),
      reference,
      callback_url: `${appUrl}/api/payments/verify`,
      ...splitFields,
      metadata: {
        orderId,
        type,
        platform: 'tailornow',
        payout_model: tailor?.paystack_subaccount_code ? 'paystack_split' : 'platform_collects_then_manual_payout',
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

  // Record the attempted reference so the payment can be re-checked against
  // Paystack later if neither the webhook nor the callback lands. `deposit_paid`
  // stays the authoritative "this order is paid" flag.
  const { error: refError } = await createAdminClient()
    .from('orders')
    .update({ paystack_ref: reference })
    .eq('id', orderId)

  if (refError) console.error(`[payments] could not store reference for order ${orderId}:`, refError.message)

  return NextResponse.json({ ...data.data, serviceCharge, totalCharged })
}
