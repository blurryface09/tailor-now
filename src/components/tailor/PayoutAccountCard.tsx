'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

type Bank = { name: string; code: string; slug: string }

interface PayoutAccountCardProps {
  initialBankCode: string | null
  initialAccountNumber: string | null
  initialAccountName: string | null
  hasSubaccount: boolean
}

export function PayoutAccountCard({ initialBankCode, initialAccountNumber, initialAccountName, hasSubaccount }: PayoutAccountCardProps) {
  const [banks, setBanks] = useState<Bank[]>([])
  const [bankCode, setBankCode] = useState(initialBankCode || '')
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber || '')
  const [accountName, setAccountName] = useState(initialAccountName || '')
  const [connected, setConnected] = useState(hasSubaccount)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/paystack/banks').then(res => res.json()).then(data => {
      if (data.banks) setBanks(data.banks)
    })
  }, [])

  const save = async () => {
    if (!bankCode || accountNumber.length < 10) { toast.error('Select your bank and enter a valid account number'); return }
    setSaving(true)
    const bankName = banks.find(b => b.code === bankCode)?.name || ''
    const res = await fetch('/api/tailor/payout-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankCode, bankName, accountNumber }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error || 'Could not verify that account'); return }
    setAccountName(data.account_name)
    setConnected(true)
    toast.success('Payout account connected — you\'ll now be paid automatically!')
  }

  return (
    <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-white flex items-center gap-2"><Landmark size={16} className="text-violet-400" /> Payout Account</h2>
        {connected && <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={12} /> Connected</span>}
      </div>
      <p className="text-sm text-zinc-500">
        Connect your bank account to get paid automatically the moment a customer pays — no more waiting for a manual transfer.
      </p>

      {connected ? (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
          <p className="text-sm font-semibold text-green-300">{accountName}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{accountNumber} · {banks.find(b => b.code === bankCode)?.name || ''}</p>
          <p className="text-xs text-zinc-600 mt-2">To change this, enter new details below and save again.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Bank</label>
          <select
            className="w-full rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={bankCode}
            onChange={e => setBankCode(e.target.value)}
          >
            <option value="">Select your bank</option>
            {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Account number</label>
          <input
            className="w-full rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={accountNumber}
            onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="0123456789"
            inputMode="numeric"
          />
        </div>
      </div>

      <Button type="button" onClick={save} loading={saving} disabled={saving}>
        {connected ? 'Update payout account' : 'Verify & connect account'}
      </Button>
    </div>
  )
}
