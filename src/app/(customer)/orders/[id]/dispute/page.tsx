'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const DISPUTE_REASONS = [
  'Tailor did not deliver my order',
  'Order quality is unacceptable',
  'Measurements were wrong',
  'Tailor is unresponsive',
  'Delivered item is different from what was agreed',
  'Tailor is requesting off-platform payment',
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8 page-enter">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 mb-6 hover:text-gray-700 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mb-6">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Your payment is protected</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              When you raise a dispute, funds are held by TailorNow until our team resolves the issue. Do not make any payments outside the app.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-xl font-black text-gray-900 mb-1">Raise a Dispute</h1>
          <p className="text-sm text-gray-500 mb-6">Order: <span className="font-semibold text-gray-700">{order.title}</span></p>

          {existing ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <p className="font-bold text-gray-900 mb-1">Dispute already raised</p>
              <p className="text-sm text-gray-500">Our team is reviewing your dispute. You will be notified within 24 hours.</p>
              <button onClick={() => router.back()} className="mt-4 px-6 py-2.5 bg-violet-700 text-white text-sm font-semibold rounded-xl hover:bg-violet-800 transition-colors">
                Go back to order
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">What is the issue?</label>
                <div className="space-y-2">
                  {DISPUTE_REASONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        reason === r
                          ? 'border-violet-500 bg-violet-50 text-violet-800 font-semibold'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Describe the problem in detail
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explain exactly what happened, when it happened, and any evidence you have (e.g. photos, chat messages)..."
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                />
                <p className={`text-xs mt-1 text-right ${description.length < 20 ? 'text-gray-400' : 'text-green-600'}`}>
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
              <p className="text-xs text-center text-gray-400 mt-3">
                False disputes may result in account suspension.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
