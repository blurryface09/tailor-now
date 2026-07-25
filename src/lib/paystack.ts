const PAYSTACK_BASE_URL = 'https://api.paystack.co'

function authHeaders() {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('Paystack is not configured')
  return { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }
}

export type PaystackBank = { name: string; code: string; slug: string }

export async function listBanks(): Promise<PaystackBank[]> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria&currency=NGN`, {
    headers: authHeaders(),
    next: { revalidate: 86400 },
  })
  const data = await res.json()
  if (!data.status) throw new Error(data.message || 'Could not load bank list')
  return data.data.map((b: { name: string; code: string; slug: string }) => ({ name: b.name, code: b.code, slug: b.slug }))
}

export async function resolveAccountNumber(accountNumber: string, bankCode: string): Promise<{ account_name: string; account_number: string }> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
    headers: authHeaders(),
  })
  const data = await res.json()
  if (!data.status) throw new Error(data.message || 'Could not verify that account number')
  return data.data
}

export async function createSubaccount(params: {
  businessName: string
  bankCode: string
  accountNumber: string
}): Promise<{ subaccount_code: string }> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      business_name: params.businessName,
      settlement_bank: params.bankCode,
      account_number: params.accountNumber,
      // Platform's cut is charged explicitly per-transaction via `transaction_charge`
      // at initialize time, so this default is just a Paystack-required fallback.
      percentage_charge: 20,
    }),
  })
  const data = await res.json()
  if (!data.status) throw new Error(data.message || 'Could not create payout account')
  return data.data
}
