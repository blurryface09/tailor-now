import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateCommission, COMMISSION_RATE } from '@/lib/utils'
import { orderIdFromTransaction, type PaystackTransaction } from '@/lib/paystack'

type PaidOrder = {
  agreed_price: number | null
  tailor_id: string
  deposit_paid: boolean | null
}

type TailorPayoutAccount = {
  paystack_subaccount_code: string | null
  bank_name: string | null
  account_number: string | null
  account_name: string | null
}

export type MarkOrderPaidResult = {
  orderId: string
  /** True when the order was already flagged paid before this call. */
  alreadyPaid: boolean
  /** False when the order is paid but the payout row could not be written. */
  payoutRecorded: boolean
}

/**
 * Record a settled Paystack charge against an order.
 *
 * Safe to call repeatedly for the same reference — the webhook, the checkout
 * callback and the manual re-check all funnel through here and can race or
 * retry.
 */
export async function markOrderPaid(
  orderId: string,
  reference: string,
  amountPaid: number
): Promise<MarkOrderPaidResult> {
  const admin = createAdminClient()

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('agreed_price, tailor_id, deposit_paid')
    .eq('id', orderId)
    .single<PaidOrder>()

  if (orderError || !order) {
    throw new Error(orderError?.message || 'Order not found')
  }

  const alreadyPaid = !!order.deposit_paid

  // Flip the paid flags first and on their own. This is what the customer's
  // order page reads, so payout bookkeeping further down must never be able to
  // leave a settled payment still showing "Ready to pay".
  if (!alreadyPaid) {
    const { error: updateError } = await admin
      .from('orders')
      .update({
        deposit_paid: true,
        balance_paid: true,
        paystack_ref: reference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) throw new Error(updateError.message)
  }

  const payoutRecorded = await recordPayout(orderId, order, amountPaid)
  return { orderId, alreadyPaid, payoutRecorded }
}

/**
 * Write the tailor's payout row. Reports failure instead of throwing: the money
 * has already changed hands, so a bad payout row is an internal bookkeeping
 * problem to be retried, not a reason to tell Paystack the charge failed.
 */
async function recordPayout(orderId: string, order: PaidOrder, amountPaid: number): Promise<boolean> {
  const admin = createAdminClient()

  const { data: tailor } = await admin
    .from('tailor_profiles')
    .select('paystack_subaccount_code, bank_name, account_number, account_name')
    .eq('id', order.tailor_id)
    .single<TailorPayoutAccount>()

  const gross = order.agreed_price || amountPaid
  const { commission, net } = calculateCommission(gross)
  const isSplit = !!tailor?.paystack_subaccount_code

  const { error: payoutError } = await admin.from('payouts').upsert(
    {
      tailor_id: order.tailor_id,
      order_id: orderId,
      gross_amount: gross,
      commission_rate: COMMISSION_RATE,
      commission_amount: commission,
      net_amount: net,
      method: isSplit ? 'split' : 'manual',
      status: isSplit ? 'paid' : 'pending',
      paid_at: isSplit ? new Date().toISOString() : null,
      bank_name: tailor?.bank_name ?? null,
      account_number: tailor?.account_number ?? null,
      account_name: tailor?.account_name ?? null,
    },
    { onConflict: 'order_id' }
  )

  if (payoutError) {
    console.error(`[payments] order ${orderId} is paid but its payout row failed:`, payoutError.message)
    return false
  }

  return true
}

function signatureMatches(signature: string | null, expected: string): boolean {
  if (!signature) return false
  const a = Buffer.from(signature, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export type WebhookOutcome = {
  status: number
  body: Record<string, unknown>
}

/**
 * Shared Paystack webhook handler. Both `/api/payments/webhook` and the POST on
 * `/api/payments/verify` delegate here so whichever URL is registered in the
 * Paystack dashboard behaves identically.
 */
export async function handlePaystackWebhook(
  rawBody: string,
  signature: string | null
): Promise<WebhookOutcome> {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return { status: 500, body: { error: 'misconfigured' } }

  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  if (!signatureMatches(signature, expected)) {
    return { status: 401, body: { error: 'Invalid signature' } }
  }

  let event: { event?: string; data?: PaystackTransaction }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return { status: 400, body: { error: 'Invalid payload' } }
  }

  if (event?.event !== 'charge.success') {
    return { status: 200, body: { received: true } }
  }

  const orderId = orderIdFromTransaction(event.data)
  if (!orderId) {
    // Not one of our order payments — acknowledge so Paystack stops retrying.
    console.warn('[payments] charge.success with no resolvable order:', event.data?.reference)
    return { status: 200, body: { received: true, ignored: true } }
  }

  try {
    const result = await markOrderPaid(orderId, event.data!.reference, (event.data!.amount ?? 0) / 100)
    // A 5xx here is deliberate: it keeps the delivery marked failed in the
    // Paystack dashboard and earns a retry, rather than silently losing the
    // payout row behind a 200.
    if (!result.payoutRecorded) {
      return { status: 500, body: { error: 'Order marked paid but payout could not be recorded' } }
    }
  } catch (error) {
    console.error(`[payments] could not record payment for order ${orderId}:`, error)
    return {
      status: 500,
      body: { error: error instanceof Error ? error.message : 'Could not record payment' },
    }
  }

  return { status: 200, body: { received: true } }
}
