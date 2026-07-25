import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveAccountNumber, createSubaccount } from '@/lib/paystack'

export async function POST(req: NextRequest) {
  const { bankCode, bankName, accountNumber } = await req.json()
  if (!bankCode || !bankName || !accountNumber) {
    return NextResponse.json({ error: 'Bank and account number are required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: tailor, error: tailorError } = await admin
    .from('tailor_profiles')
    .select('id, business_name')
    .eq('user_id', user.id)
    .single()

  if (tailorError || !tailor) return NextResponse.json({ error: 'No creative profile found for this account.' }, { status: 404 })

  try {
    const resolved = await resolveAccountNumber(accountNumber, bankCode)
    const subaccount = await createSubaccount({
      businessName: tailor.business_name,
      bankCode,
      accountNumber,
    })

    const { error: updateError } = await admin.from('tailor_profiles').update({
      bank_code: bankCode,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: resolved.account_name,
      paystack_subaccount_code: subaccount.subaccount_code,
    }).eq('id', tailor.id)

    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ ok: true, account_name: resolved.account_name })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not set up payout account' }, { status: 400 })
  }
}
