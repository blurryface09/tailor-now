'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { CheckCircle, Clock, XCircle, AlertCircle, Search, ChevronDown, Download } from 'lucide-react'
import toast from 'react-hot-toast'

type Payout = {
  id: string
  gross_amount: number
  commission_amount: number
  net_amount: number
  status: string
  bank_name: string | null
  account_number: string | null
  account_name: string | null
  paid_at: string | null
  created_at: string
  order: {
    id: string
    title: string
    agreed_price: number
  } | null
  tailor: {
    business_name: string
    profile: { full_name: string; email: string } | null
  } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'text-amber-700 bg-amber-50 border-amber-200',  icon: <Clock size={13} /> },
  processing: { label: 'Processing', color: 'text-blue-700 bg-blue-50 border-blue-200',    icon: <AlertCircle size={13} /> },
  paid:       { label: 'Paid',       color: 'text-green-700 bg-green-50 border-green-200', icon: <CheckCircle size={13} /> },
  failed:     { label: 'Failed',     color: 'text-red-700 bg-red-50 border-red-200',       icon: <XCircle size={13} /> },
}

export default function AdminPayoutsPage() {
  const supabase = createClient()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [showBankModal, setShowBankModal] = useState<Payout | null>(null)

  useEffect(() => {
    fetchPayouts()
  }, [])

  async function fetchPayouts() {
    const { data } = await supabase
      .from('payouts')
      .select(`
        *,
        order:orders(id, title, agreed_price),
        tailor:tailor_profiles(business_name, profile:profiles(full_name, email))
      `)
      .order('created_at', { ascending: false })
    setPayouts((data as Payout[]) || [])
    setLoading(false)
  }

  async function updateStatus(payoutId: string, newStatus: string) {
    setUpdating(payoutId)
    const update: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'paid') update.paid_at = new Date().toISOString()

    const { error } = await supabase.from('payouts').update(update).eq('id', payoutId)
    if (error) {
      toast.error('Update failed')
    } else {
      toast.success(`Payout marked as ${newStatus}`)
      setPayouts(p => p.map(x => x.id === payoutId ? { ...x, status: newStatus, paid_at: update.paid_at as string } : x))
    }
    setUpdating(null)
  }

  const filtered = payouts.filter(p => {
    const matchSearch = !search ||
      p.tailor?.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.order?.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.account_number?.includes(search)
    const matchFilter = filter === 'all' || p.status === filter
    return matchSearch && matchFilter
  })

  const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.net_amount, 0)
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.net_amount, 0)
  const totalCommission = payouts.reduce((s, p) => s + p.commission_amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Tailor Payouts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage earnings and approve bank transfers to tailors</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Pending Payouts</p>
            <p className="text-2xl font-black text-amber-600 mt-1">₦{totalPending.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">{payouts.filter(p => p.status === 'pending').length} orders awaiting transfer</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Paid Out</p>
            <p className="text-2xl font-black text-green-600 mt-1">₦{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">{payouts.filter(p => p.status === 'paid').length} orders completed</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Platform Commission</p>
            <p className="text-2xl font-black text-violet-600 mt-1">₦{totalCommission.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">10% on all completed orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tailor or order..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 font-medium"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors font-medium text-gray-600">
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tailor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net (Tailor)</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank Details</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400 text-sm">No payouts found</td>
                </tr>
              ) : filtered.map(payout => {
                const cfg = STATUS_CONFIG[payout.status] || STATUS_CONFIG.pending
                return (
                  <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{payout.tailor?.business_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{payout.tailor?.profile?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-700 max-w-[160px] truncate">{payout.order?.title}</p>
                      <p className="text-xs text-gray-400">{new Date(payout.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">₦{payout.gross_amount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right text-violet-600 font-medium">₦{payout.commission_amount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right font-bold text-green-600">₦{payout.net_amount.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      {payout.account_number ? (
                        <div>
                          <p className="font-medium text-gray-800">{payout.account_name}</p>
                          <p className="text-xs text-gray-400">{payout.account_number} · {payout.bank_name}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Not provided</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {payout.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            disabled={!!updating}
                            onClick={() => updateStatus(payout.id, 'processing')}
                            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50">
                            Mark Processing
                          </button>
                        </div>
                      )}
                      {payout.status === 'processing' && (
                        <div className="flex gap-2">
                          <button
                            disabled={!!updating}
                            onClick={() => updateStatus(payout.id, 'paid')}
                            className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-semibold hover:bg-green-100 transition-colors disabled:opacity-50">
                            {updating === payout.id ? 'Saving...' : 'Mark Paid'}
                          </button>
                          <button
                            disabled={!!updating}
                            onClick={() => updateStatus(payout.id, 'failed')}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition-colors disabled:opacity-50">
                            Failed
                          </button>
                        </div>
                      )}
                      {payout.status === 'paid' && payout.paid_at && (
                        <p className="text-xs text-gray-400">{new Date(payout.paid_at).toLocaleDateString('en-NG')}</p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showBankModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-4">Bank Details</h3>
            <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Account Name:</span> {showBankModal.account_name || 'N/A'}</p>
            <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Account Number:</span> {showBankModal.account_number || 'N/A'}</p>
            <p className="text-sm text-gray-600 mb-4"><span className="font-medium">Bank:</span> {showBankModal.bank_name || 'N/A'}</p>
            <button onClick={() => setShowBankModal(null)} className="w-full py-2.5 bg-gray-100 rounded-xl text-sm font-semibold hover:bg-gray-200">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
