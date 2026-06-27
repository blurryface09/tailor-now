'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { AlertTriangle, CheckCircle, User, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

type Dispute = {
  id: string
  reason: string
  description: string
  status: string
  admin_notes: string | null
  created_at: string
  resolved_at: string | null
  order: {
    id: string
    title: string
    agreed_price: number | null
    deposit_amount: number | null
    customer: { full_name: string; email: string } | null
    tailor: { business_name: string } | null
  } | null
  raiser: { full_name: string; role: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  open:               'text-red-700 bg-red-50 border-red-200',
  under_review:       'text-blue-700 bg-blue-50 border-blue-200',
  resolved_customer:  'text-green-700 bg-green-50 border-green-200',
  resolved_tailor:    'text-violet-700 bg-violet-50 border-violet-200',
  refunded:           'text-amber-700 bg-amber-50 border-amber-200',
}

const RESOLUTIONS = [
  { value: 'resolved_customer', label: 'Resolve in favor of Customer (refund)' },
  { value: 'resolved_tailor',   label: 'Resolve in favor of Tailor (release funds)' },
  { value: 'refunded',          label: 'Full Refund' },
]

export default function AdminDisputesPage() {
  const supabase = createClient()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { fetchDisputes() }, [])

  async function fetchDisputes() {
    const { data } = await supabase
      .from('disputes')
      .select(`
        *,
        order:orders(id, title, agreed_price, deposit_amount,
          customer:profiles!orders_customer_id_fkey(full_name, email),
          tailor:tailor_profiles(business_name)
        ),
        raiser:profiles!disputes_raised_by_fkey(full_name, role)
      `)
      .order('created_at', { ascending: false })
    setDisputes((data as Dispute[]) || [])
    setLoading(false)
  }

  async function resolve(disputeId: string, resolution: string) {
    setUpdating(disputeId)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('disputes').update({
      status: resolution,
      admin_notes: notes[disputeId] || null,
      resolved_by: user?.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', disputeId)

    if (error) {
      toast.error('Could not update dispute')
    } else {
      toast.success('Dispute resolved')
      setDisputes(d => d.map(x => x.id === disputeId ? { ...x, status: resolution } : x))
      setExpanded(null)
    }
    setUpdating(null)
  }

  async function markUnderReview(disputeId: string) {
    await supabase.from('disputes').update({ status: 'under_review' }).eq('id', disputeId)
    setDisputes(d => d.map(x => x.id === disputeId ? { ...x, status: 'under_review' } : x))
    toast.success('Marked as under review')
  }

  const open = disputes.filter(d => d.status === 'open').length

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
      <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Disputes</h1>
            <p className="text-sm text-gray-500 mt-1">Mediate order disputes between customers and tailors</p>
          </div>
          {open > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-red-700">{open} open</span>
            </div>
          )}
        </div>

        {disputes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <p className="font-bold text-gray-900">No disputes</p>
            <p className="text-sm text-gray-400 mt-1">All orders are running smoothly.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map(dispute => (
              <div key={dispute.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === dispute.id ? null : dispute.id)}
                  className="w-full text-left px-6 py-4 flex items-start justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[dispute.status] || STATUS_COLORS.open}`}>
                        <AlertTriangle size={11} /> {dispute.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-gray-900 truncate">{dispute.order?.title}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User size={11} /> Raised by: {dispute.raiser?.full_name} ({dispute.raiser?.role})</span>
                      <span>{new Date(dispute.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{dispute.reason}</p>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 ml-3 mt-1 transition-transform ${expanded === dispute.id ? 'rotate-180' : ''}`} />
                </button>

                {expanded === dispute.id && (
                  <div className="border-t border-gray-100 px-6 py-5 space-y-5">
                    {/* Order info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Customer</p>
                        <p className="font-medium text-gray-900">{dispute.order?.customer?.full_name}</p>
                        <p className="text-xs text-gray-500">{dispute.order?.customer?.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Tailor</p>
                        <p className="font-medium text-gray-900">{dispute.order?.tailor?.business_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Order Value</p>
                        <p className="font-bold text-gray-900">₦{(dispute.order?.agreed_price || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">Deposit Held</p>
                        <p className="font-bold text-amber-600">₦{(dispute.order?.deposit_amount || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Complaint */}
                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-red-700 mb-1">Reason: {dispute.reason}</p>
                      <p className="text-sm text-red-800 leading-relaxed">{dispute.description}</p>
                    </div>

                    {/* Admin notes */}
                    {['open','under_review'].includes(dispute.status) && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Admin notes (optional)</label>
                        <textarea
                          value={notes[dispute.id] || ''}
                          onChange={e => setNotes(n => ({ ...n, [dispute.id]: e.target.value }))}
                          rows={3}
                          placeholder="Internal notes about the resolution..."
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    {dispute.status === 'open' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => markUnderReview(dispute.id)}
                          className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-xl font-semibold hover:bg-blue-100 transition-colors">
                          Mark Under Review
                        </button>
                      </div>
                    )}

                    {dispute.status === 'under_review' && (
                      <div className="flex flex-wrap gap-2">
                        {RESOLUTIONS.map(r => (
                          <button
                            key={r.value}
                            disabled={!!updating}
                            onClick={() => resolve(dispute.id, r.value)}
                            className={`px-4 py-2 text-sm rounded-xl font-semibold transition-colors disabled:opacity-50 ${
                              r.value === 'resolved_customer' ? 'bg-green-50 text-green-700 hover:bg-green-100' :
                              r.value === 'resolved_tailor'   ? 'bg-violet-50 text-violet-700 hover:bg-violet-100' :
                              'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}>
                            {updating === dispute.id ? 'Saving...' : r.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {dispute.admin_notes && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Admin notes</p>
                        <p className="text-sm text-gray-700">{dispute.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
