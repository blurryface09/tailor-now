import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { handlePaystackWebhook, markOrderPaid } from '@/lib/payments'
import { orderIdFromReference, orderIdFromTransaction, verifyTransaction } from '@/lib/paystack'

// Same webhook Paystack posts to /api/payments/webhook — kept here because this
// URL may already be registered in the Paystack dashboard.
export async function POST(req: NextRequest) {
  const body = await req.text()
  const { status, body: payload } = await handlePaystackWebhook(
    body,
    req.headers.get('x-paystack-signature')
  )
  return NextResponse.json(payload, { status })
}

// Checkout `callback_url` — where Paystack sends the customer's browser back to.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference') || searchParams.get('trxref')
  if (!reference) redirect('/browse')

  // Fall back to the order encoded in the reference so a customer is always
  // returned to their own order, even if the verify call itself fails.
  const referenceOrderId = orderIdFromReference(reference)
  const backToOrder = (state: string) =>
    referenceOrderId ? `/orders/${referenceOrderId}?payment=${state}` : `/orders?payment=${state}`

  let transaction
  try {
    transaction = await verifyTransaction(reference)
  } catch (error) {
    console.error('[payments] verify call failed for', reference, error)
    redirect(backToOrder('unconfirmed'))
  }

  if (!transaction) redirect(backToOrder('unconfirmed'))
  if (transaction.status !== 'success') redirect(backToOrder('failed'))

  const orderId = orderIdFromTransaction(transaction) ?? referenceOrderId
  if (!orderId) redirect('/browse')

  try {
    await markOrderPaid(orderId, transaction.reference, (transaction.amount ?? 0) / 100)
  } catch (error) {
    console.error(`[payments] could not record payment for order ${orderId}:`, error)
    redirect(`/orders/${orderId}?payment=recording_failed`)
  }

  redirect(`/orders/${orderId}?payment=success`)
}
