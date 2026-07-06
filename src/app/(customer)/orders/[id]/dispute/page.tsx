'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const DISPUTE_REASONS = [
  'Creative did not deliver my order',
  'Order quality is unacceptable',
  'Measurements were wrong',
  'Creative is unresponsive',
  'Delivered item is different from what was agreed',
  'Creative is requesting off-platform payment',
  'Other',
]

export default function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [order, setOrder] = useState<{ title: string; status: string } | null>(null)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [existing, setExisting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: o } = await supabase
        .from('orders')
        .select('title, status')
        .eq('id', orderId)
        .single()
      setOrder(o)

      const { data: d } = await supabase
        .from('disputes')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle()
      if (d) setExisting(true)
    }
    load()
  }, [orderId])

  async function submit() {
    if (!reason || description.trim().length < 20) {
      toast.error('Please select a reason and describe the issue (min 20 characters)')
      return
    }
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: disputeErr } = await supabase.from('disputes').insert({
      order_id: orderId,
      raised_by: user.id,
      reason,
      description: description.trim(),
    })

    if (disputeErr) {
      toast.error('Could not raise dispute. Please try again.')
      setSubmitting(false)
      return
    }

    await supabase.from('orders').update({ status: 'disputed' }).eq('id', orderId)

    toast.success('Dispute raised. Our team will review within 24 hours.')
    router.push(`/orders/${orderId}`)
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8 page-enter">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-zinc-500 mb-6 hover:text-zinc-300 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 mb-6">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Your payment is protected</p>
            <p className="text-xs text-amber-400 mt-0.5 leading-relaxed">
              When you raise a dispute, funds are held by TailorNow until our team resolves the issue. Do not make any payments outside the app.
            </p>
          </div>
        </div>

        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-sm p-6">
          <h1 className="text-xl font-black text-white mb-1">Raise a Dispute</h1>
          <p className="text-sm text-zinc-500 mb-6">Order: <span className="font-semibold text-zinc-300">{order.title}</span></p>

          {existing ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <p className="font-bold text-white mb-1">Dispute already raised</p>
              <p className="text-sm text-zinc-500">Our team is reviewing your dispute. You will be notified within 24 hours.</p>
              <button onClick={() => router.back()} className="mt-4 px-6 py-2.5 bg-violet-700 text-white text-sm font-semibold rounded-xl hover:bg-violet-800 transition-colors">
                Go back to order
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <label className="text-sm font-semibold text-zinc-300 mb-2 block">What is the issue?</label>
                <div className="space-y-2">
                  {DISPUTE_REASONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        reason === r
                          ? 'border-violet-500 bg-violet-500/10 text-violet-200 font-semibold'
                          : 'border-white/[0.1] text-zinc-300 hover:border-gray-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-semibold text-zinc-300 mb-2 block">
                  Describe the problem in detail
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explain exactly what happened, when it happened, and any evidence you have (e.g. photos, chat messages)..."
                  rows={5}
                  className="w-full border border-white/[0.1] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                />
                <p className={`text-xs mt-1 text-right ${description.length < 20 ? 'text-zinc-600' : 'text-green-400'}`}>
                  {description.length} characters {description.length < 20 ? `(${20 - description.length} more needed)` : ''}
                </p>
              </div>

              <button
                disabled={submitting || !reason || description.trim().length < 20}
                onClick={submit}
                className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Raising dispute...' : 'Raise Dispute'}
              </button>
              <p className="text-xs text-center text-zinc-600 mt-3">
                False disputes may result in account suspension.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
