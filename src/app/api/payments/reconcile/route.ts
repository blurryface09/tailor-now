import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { markOrderPaid } from '@/lib/payments'
import { findSuccessfulTransactionForOrder, verifyTransaction } from '@/lib/paystack'

type ReconcileOrder = {
  id: string
  customer_id: string
  deposit_paid: boolean | null
  paystack_ref: string | null
}

/**
 * Re-check an order against Paystack and apply the charge if it settled.
 *
 * The safety net for when the webhook and the checkout callback both fail to
 * land: without this a customer who has genuinely paid is stuck looking at
 * "Ready to pay" with no way out.
 */
export async function POST(req: NextRequest) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: 'Paystack is not configured yet.' }, { status: 503 })
  }

  const { orderId } = await req.json().catch(() => ({ orderId: null }))
  if (!orderId) return NextResponse.json({ error: 'Missing order.' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, customer_id, deposit_paid, paystack_ref')
    .eq('id', orderId)
    .single<ReconcileOrder>()

  if (orderError || !order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  if (order.customer_id !== user.id) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'You can only check your own order.' }, { status: 403 })
    }
  }

  if (order.deposit_paid) {
    return NextResponse.json({ status: 'paid', recovered: false })
  }

  // The reference from the latest checkout attempt, when there is one.
  const attempted = order.paystack_ref ? await verifyTransaction(order.paystack_ref) : null

  // Fall back to searching Paystack directly. Covers orders paid before the
  // reference was persisted, and earlier attempts that succeeded after the
  // stored reference had already been overwritten by a later one.
  const transaction =
    attempted?.status === 'success' ? attempted : await findSuccessfulTransactionForOrder(order.id)

  if (!transaction) {
    if (attempted) {
      return NextResponse.json({ status: attempted.status === 'failed' ? 'failed' : 'pending' })
    }
    return NextResponse.json({ status: 'no_payment_found' })
  }

  try {
    const result = await markOrderPaid(order.id, transaction.reference, (transaction.amount ?? 0) / 100)
    return NextResponse.json({ status: 'paid', recovered: !result.alreadyPaid })
  } catch (error) {
    console.error(`[payments] reconcile failed for order ${order.id}:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not record payment' },
      { status: 500 }
    )
  }
}
