import { createAdminClient } from '@/lib/supabase/admin'
import { calculateCommission } from '@/lib/utils'

type PaidOrder = {
  agreed_price: number | null
  tailor_id: string
}

type TailorPayoutAccount = {
  paystack_subaccount_code: string | null
  bank_name: string | null
  account_number: string | null
  account_name: string | null
}

export async function markOrderPaid(orderId: string, reference: string, amountPaid: number) {
  const admin = createAdminClient()

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('agreed_price, tailor_id')
    .eq('id', orderId)
    .single<PaidOrder>()

  if (orderError || !order) {
    throw new Error(orderError?.message || 'Order not found')
  }

  const { data: tailor } = await admin
    .from('tailor_profiles')
    .select('paystack_subaccount_code, bank_name, account_number, account_name')
    .eq('id', order.tailor_id)
    .single<TailorPayoutAccount>()

  const gross = order.agreed_price || amountPaid
  const { commission, net } = calculateCommission(gross)
  const isSplit = !!tailor?.paystack_subaccount_code

  const { error: updateError } = await admin.from('orders').update({
    deposit_paid: true,
    balance_paid: true,
    paystack_ref: reference,
    updated_at: new Date().toISOString(),
  }).eq('id', orderId)

  if (updateError) throw new Error(updateError.message)

  const { error: payoutError } = await admin.from('payouts').upsert({
    tailor_id: order.tailor_id,
    order_id: orderId,
    gross_amount: gross,
    commission_rate: 0.20,
    commission_amount: commission,
    net_amount: net,
    method: isSplit ? 'split' : 'manual',
    status: isSplit ? 'paid' : 'pending',
    paid_at: isSplit ? new Date().toISOString() : null,
    bank_name: tailor?.bank_name ?? null,
    account_number: tailor?.account_number ?? null,
    account_name: tailor?.account_name ?? null,
  }, { onConflict: 'order_id' })

  if (payoutError) throw new Error(payoutError.message)
}
