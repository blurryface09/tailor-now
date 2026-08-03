const PAYSTACK_BASE_URL = 'https://api.paystack.co'

function authHeaders() {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error('Paystack is not configured')
  return { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }
}

export type PaystackBank = { name: string; code: string; slug: string }

export type PaystackTransaction = {
  status: string
  reference: string
  amount: number
  metadata?: unknown
}

// Paystack hands metadata back as an object most of the time, but as a JSON
// string on some channels (and as '' when it was never set). Normalise it so a
// settled payment is never dropped just because of the shape it came back in.
function readMetadata(metadata: unknown): Record<string, unknown> | null {
  if (!metadata) return null
  if (typeof metadata === 'object') return metadata as Record<string, unknown>
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata)
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  return null
}

// References are minted as `TN-<orderId>-<type>-<timestamp>` at initialize time,
// so the order is recoverable from the reference alone when metadata is absent.
const REFERENCE_PATTERN =
  /^TN-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i

export function orderIdFromReference(reference: string | null | undefined): string | null {
  const match = typeof reference === 'string' ? reference.match(REFERENCE_PATTERN) : null
  return match ? match[1].toLowerCase() : null
}

/** Resolve the order a transaction belongs to, metadata first then the reference. */
export function orderIdFromTransaction(tx: PaystackTransaction | null | undefined): string | null {
  if (!tx) return null
  const fromMetadata = readMetadata(tx.metadata)?.orderId
  if (typeof fromMetadata === 'string' && fromMetadata) return fromMetadata
  return orderIdFromReference(tx.reference)
}

/**
 * Search recent successful charges for one belonging to `orderId`.
 *
 * Recovery path for orders paid before the reference was persisted at
 * initialize time — there is nothing stored to verify against, so the
 * transaction has to be found from Paystack's side instead.
 */
export async function findSuccessfulTransactionForOrder(
  orderId: string,
  maxPages = 5
): Promise<PaystackTransaction | null> {
  const wanted = orderId.toLowerCase()

  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(
      `${PAYSTACK_BASE_URL}/transaction?status=success&perPage=100&page=${page}`,
      { headers: authHeaders(), cache: 'no-store' }
    )
    const data = await res.json()
    if (!data?.status || !Array.isArray(data.data) || data.data.length === 0) return null

    for (const tx of data.data as PaystackTransaction[]) {
      if (tx.status !== 'success') continue
      if (orderIdFromTransaction(tx)?.toLowerCase() === wanted) return tx
    }

    if (data.data.length < 100) return null
  }

  return null
}

export async function verifyTransaction(reference: string): Promise<PaystackTransaction | null> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeaders(),
    cache: 'no-store',
  })
  const data = await res.json()
  if (!data?.status || !data.data) return null
  return data.data as PaystackTransaction
}

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
