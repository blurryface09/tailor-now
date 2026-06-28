'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/ui/star-rating'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatCurrency, formatDate, formatRelativeTime, calculateCommission } from '@/lib/utils'
import { MessageSquare, CheckCircle, AlertCircle, Clock, AlertTriangle, Images } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Order, Rating } from '@/types'
import Link from 'next/link'

const TRACKING_STEPS = [
  { status: 'pending', label: 'Order placed', icon: '📋' },
  { status: 'accepted', label: 'Accepted by creative', icon: '🤝' },
  { status: 'measuring', label: 'Taking measurements', icon: '📏' },
  { status: 'in_progress', label: 'Being sewn', icon: '✂️' },
  { status: 'ready', label: 'Ready', icon: '🎉' },
  { status: 'out_for_delivery', label: 'Out for delivery', icon: '🚚' },
  { status: 'delivered', label: 'Delivered', icon: '📦' },
  { status: 'completed', label: 'Completed', icon: '⭐' },
]

function OrderDetailContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [order, setOrder] = useState<Order | null>(null)
  const [myRating, setMyRating] = useState<Rating | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [ratingVal, setRatingVal] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [confirmingDelivery, setConfirmingDelivery] = useState(false)
  const [counterPrice, setCounterPrice] = useState('')
  const [showCounter, setShowCounter] = useState(false)
  const [sendingCounter, setSendingCounter] = useState(false)

  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') toast.success('Payment successful!')
    else if (payment === 'failed') toast.error('Payment failed. Please try again.')

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    fetchOrder()
    const channel = supabase.channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => fetchOrder())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  const fetchOrder = async () => {
    const { data } = await supabase.from('orders').select(`
      *, customer:profiles(*), tailor:tailor_profiles(*, profile:profiles(*))
    `).eq('id', id).single()
    if (data) setOrder(data)
    if (data && userId) {
      const { data: rating } = await supabase.from('ratings').select('*').eq('order_id', id).eq('reviewer_id', userId).single()
      setMyRating(rating)
    }
  }

  const acceptCreativePrice = async () => {
    if (!order?.agreed_price) return
    setSendingCounter(true)
    await supabase.from('orders').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', id)
    toast.success('Price accepted! Proceeding to payment...')
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id, amount: order.agreed_price, email: user?.email || '', type: 'full' }),
    })
    const { authorization_url } = await res.json()
    if (authorization_url) window.location.href = authorization_url
    setSendingCounter(false)
  }

  const sendCounter = async () => {
    const price = Number(counterPrice)
    if (!price || price <= 0) { toast.error('Enter a valid price'); return }
    setSendingCounter(true)
    await supabase.from('orders').update({
      customer_offer: price,
      agreed_price: null,
      status: 'pending',
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>).eq('id', id)
    toast.success('Counter sent! Waiting for creative.')
    setShowCounter(false)
    setCounterPrice('')
    fetchOrder()
    setSendingCounter(false)
  }

  const payAgreedPrice = async () => {
    if (!order?.agreed_price) return
    setSendingCounter(true)
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id, amount: order.agreed_price, email: user?.email || '', type: 'full' }),
    })
    const { authorization_url } = await res.json()
    if (authorization_url) window.location.href = authorization_url
    setSendingCounter(false)
  }

  const confirmDelivery = async () => {
    if (!order) return
    setConfirmingDelivery(true)

    const { data: orderData } = await supabase.from('orders').select('agreed_price, tailor_id').eq('id', id).single()
    const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', id)
    if (error) { toast.error(error.message); setConfirmingDelivery(false); return }

    // Create payout record if not already exists
    if (orderData?.agreed_price) {
      const { commission, net } = calculateCommission(orderData.agreed_price)
      await supabase.from('payouts').upsert({
        tailor_id: orderData.tailor_id,
        order_id: id,
        gross_amount: orderData.agreed_price,
        commission_rate: 0.20,
        commission_amount: commission,
        net_amount: net,
        status: 'pending',
      }, { onConflict: 'order_id' })
    }

    toast.success('Delivery confirmed! Payment released to creative.')
    fetchOrder()
    setConfirmingDelivery(false)
  }

  const submitRating = async () => {
    if (!order || !userId) return
    setSubmittingRating(true)
    const revieweeId = order.customer_id === userId
      ? order.tailor?.user_id
      : order.customer_id

    const { error } = await supabase.from('ratings').insert({
      order_id: id,
      reviewer_id: userId,
      reviewee_id: revieweeId,
      reviewer_role: order.customer_id === userId ? 'customer' : 'tailor',
      rating: ratingVal,
      comment: ratingComment || null,
    })
    if (error) { toast.error(error.message); setSubmittingRating(false); return }
    toast.success('Rating submitted!')
    fetchOrder()
    setSubmittingRating(false)
  }

  if (!order) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" /></div>
    </div>
  )

  const currentStepIdx = TRACKING_STEPS.findIndex(s => s.status === order.status)
  const isTailor = order.tailor?.user_id === userId
  const isCustomer = order.customer_id === userId
  const canConfirmDelivery = isCustomer && order.status === 'delivered'
  const canRate = (order.status === 'completed' || order.status === 'delivered') && !myRating

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{order.title}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Order #{id.slice(0, 8).toUpperCase()}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-500">Tailor</p>
              <p className="font-medium text-gray-900">{order.tailor?.business_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Placed</p>
              <p className="font-medium text-gray-900">{formatDate(order.created_at)}</p>
            </div>
            {order.agreed_price && (
              <div>
                <p className="text-gray-500">Total price</p>
                <p className="font-bold text-violet-700">{formatCurrency(order.agreed_price)}</p>
              </div>
            )}
            {order.deadline && (
              <div>
                <p className="text-gray-500">Deadline</p>
                <p className="font-medium text-gray-900 flex items-center gap-1"><Clock size={13} />{formatDate(order.deadline)}</p>
              </div>
            )}
          </div>

          {order.style_reference_urls?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                <Images size={13} /> Style references
              </p>
              <div className="flex gap-2 flex-wrap">
                {order.style_reference_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`Ref ${i + 1}`} className="w-20 h-20 rounded-xl object-cover border border-gray-100 hover:opacity-90 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link href={`/chat?order=${id}&tailor=${order.tailor_id}`}
              className="flex items-center gap-2 px-4 py-2 border border-violet-700 text-violet-700 rounded-xl text-sm font-medium hover:bg-violet-50 transition-colors">
              <MessageSquare size={16} /> Chat with {isTailor ? 'Customer' : 'Creative'}
            </Link>
            {canConfirmDelivery && (
              <Button onClick={confirmDelivery} loading={confirmingDelivery} size="md">
                <CheckCircle size={16} /> Confirm Delivery
              </Button>
            )}
            {isCustomer && !['completed','cancelled','disputed'].includes(order.status) && order.deposit_paid && (
              <Link href={`/orders/${id}/dispute`}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
                <AlertTriangle size={16} /> Raise Dispute
              </Link>
            )}
          </div>
        </div>

        {/* Price negotiation card — visible while pending (no payment yet) */}
        {isCustomer && order.status === 'pending' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Price negotiation</h2>

            {/* Customer's sent offer */}
            {order.customer_offer && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100 text-sm mb-3">
                <span className="text-gray-500">Your offer</span>
                <span className="font-semibold text-gray-900">{formatCurrency(order.customer_offer)}</span>
              </div>
            )}

            {/* Creative has countered */}
            {order.agreed_price && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100 text-sm mb-4">
                <span className="text-gray-500">Creative&apos;s counter</span>
                <span className="font-bold text-violet-700">{formatCurrency(order.agreed_price)}</span>
              </div>
            )}

            {order.agreed_price && !showCounter ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-3">The creative has proposed a price. Accept to proceed to payment, or counter with your own offer.</p>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={acceptCreativePrice} loading={sendingCounter}>
                    <CheckCircle size={14} /> Accept & Pay {formatCurrency(order.agreed_price)}
                  </Button>
                  <button onClick={() => setShowCounter(true)}
                    className="flex items-center gap-1.5 text-sm text-amber-700 border border-amber-200 bg-amber-50 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors">
                    Counter offer
                  </button>
                </div>
              </div>
            ) : !order.agreed_price ? (
              <p className="text-sm text-gray-500 italic">Waiting for the creative to respond to your offer...</p>
            ) : null}

            {showCounter && (
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₦</span>
                  <input type="number" min="0" placeholder="Your counter price"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-amber-300 focus:border-violet-500 focus:outline-none text-base font-semibold"
                    value={counterPrice} onChange={e => setCounterPrice(e.target.value)} autoFocus />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCounter(false)} className="flex-1 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
                  <Button className="flex-1" size="sm" loading={sendingCounter} onClick={sendCounter}>Send counter</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pay now card — when accepted but not yet paid */}
        {isCustomer && order.status === 'accepted' && !order.deposit_paid && order.agreed_price && (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Ready to pay</h2>
              <span className="text-lg font-black text-violet-700">{formatCurrency(order.agreed_price)}</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">The creative has accepted your order. Pay now to get started.</p>
            <Button className="w-full" size="lg" loading={sendingCounter} onClick={payAgreedPrice}>
              Pay {formatCurrency(order.agreed_price)} via Paystack
            </Button>
          </div>
        )}

        {/* Order tracking */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-6">Order tracking</h2>
          <div className="space-y-1">
            {TRACKING_STEPS.filter(s => !['cancelled', 'disputed'].includes(s.status)).map((s, i) => {
              const done = i < currentStepIdx
              const active = s.status === order.status
              return (
                <div key={s.status} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${done ? 'bg-violet-700 text-white' : active ? 'bg-violet-100 border-2 border-violet-700 text-violet-700' : 'bg-gray-100 text-gray-400'}`}>
                      {done ? '✓' : s.icon}
                    </div>
                    {i < TRACKING_STEPS.length - 2 && <div className={`w-0.5 h-6 mt-0.5 ${done ? 'bg-violet-700' : 'bg-gray-200'}`} />}
                  </div>
                  <div className={`pb-4 ${active ? 'text-violet-700 font-semibold' : done ? 'text-gray-900' : 'text-gray-400'}`}>
                    <p className="text-sm leading-tight mt-2">{s.label}</p>
                    {active && <p className="text-xs text-violet-500 mt-0.5">{formatRelativeTime(order.updated_at)}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment details */}
        {order.agreed_price && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total price</span>
                <span className="font-bold text-violet-700">{formatCurrency(order.agreed_price)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium flex items-center gap-1 ${order.deposit_paid ? 'text-green-600' : 'text-amber-600'}`}>
                  {order.deposit_paid ? <><CheckCircle size={14} /> Paid</> : <><AlertCircle size={14} /> Awaiting payment</>}
                </span>
              </div>
              {order.deposit_paid && !['completed'].includes(order.status) && (
                <p className="text-xs text-gray-400">Payment held securely — released to creative after you confirm delivery</p>
              )}
            </div>
          </div>
        )}

        {/* Rating */}
        {canRate && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">
              Rate {isTailor ? 'this customer' : 'this creative'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">Your feedback helps build trust on the platform</p>
            <div className="mb-4">
              <StarRating value={ratingVal} onChange={setRatingVal} size="lg" />
            </div>
            <textarea
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
              placeholder="Leave a comment (optional)"
              rows={3}
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
            />
            <Button onClick={submitRating} loading={submittingRating}>Submit Rating</Button>
          </div>
        )}

        {myRating && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-2 text-green-800 text-sm">
            <CheckCircle size={16} /> You rated this order {myRating.rating}/5 stars
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" />
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  )
}
