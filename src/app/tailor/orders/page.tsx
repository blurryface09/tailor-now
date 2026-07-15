'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Order } from '@/types'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, ChevronRight, Send, Navigation } from 'lucide-react'

const STATUS_ACTIONS: Record<string, { next: string; label: string }> = {
  accepted: { next: 'measuring', label: 'Start Measuring' },
  measuring: { next: 'in_progress', label: 'Begin Sewing' },
  in_progress: { next: 'ready', label: 'Mark as Ready' },
  ready: { next: 'out_for_delivery', label: 'Out for Delivery' },
  out_for_delivery: { next: 'delivered', label: 'Mark Delivered' },
}

interface QuoteModal { orderId: string; currentBudget: number | null }

export default function TailorOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<string>('active')
  const [updating, setUpdating] = useState<string | null>(null)
  const [quoteModal, setQuoteModal] = useState<QuoteModal | null>(null)
  const [quotePrice, setQuotePrice] = useState('')
  const [sendingQuote, setSendingQuote] = useState(false)
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    loadOrders()
  }, [filter])

  const loadOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: tailor } = await supabase.from('tailor_profiles').select('id').eq('user_id', user.id).single()
    if (!tailor) return

    let query = supabase.from('orders').select('*, customer:profiles(full_name, phone, avatar_url)')
      .eq('tailor_id', tailor.id).order('created_at', { ascending: false })

    if (filter === 'active') query = query.not('status', 'in', '(completed,cancelled,disputed)')
    else if (filter === 'completed') query = query.eq('status', 'completed')
    else if (filter === 'pending') query = query.eq('status', 'pending')

    const { data } = await query
    setOrders(data || [])
  }

  const openQuoteModal = (order: Order) => {
    setQuoteModal({ orderId: order.id, currentBudget: (order as Order & { customer_offer?: number }).customer_offer || order.agreed_price || null })
    setQuotePrice('')
  }

  const acceptOffer = async (orderId: string, price: number) => {
    setSendingQuote(true)
    const { error } = await supabase.from('orders').update({
      agreed_price: price,
      status: 'accepted',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId)
    if (error) { toast.error(error.message); setSendingQuote(false); return }
    fetch('/api/notifications/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, event: 'order_accepted' }),
    }).catch(() => {})
    toast.success('Offer accepted! Customer will now pay.')
    setSendingQuote(false)
    loadOrders()
  }

  const sendQuote = async () => {
    if (!quoteModal) return
    const price = Number(quotePrice)
    if (!price || price <= 0) { toast.error('Enter a valid price'); return }
    setSendingQuote(true)
    const { error } = await supabase.from('orders').update({
      agreed_price: price,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }).eq('id', quoteModal.orderId)
    if (error) { toast.error(error.message); setSendingQuote(false); return }
    fetch('/api/notifications/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: quoteModal.orderId, event: 'order_accepted' }),
    }).catch(() => {})
    toast.success('Counter sent! Waiting for customer.')
    setSendingQuote(false)
    setQuoteModal(null)
    setQuotePrice('')
    loadOrders()
  }

  const updateQuote = async (orderId: string) => {
    const price = Number(quotePrice)
    if (!price || price <= 0) { toast.error('Enter a valid price'); return }
    setSendingQuote(true)
    const { error } = await supabase.from('orders').update({
      agreed_price: price,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId)
    if (error) { toast.error(error.message); setSendingQuote(false); return }
    toast.success('Price updated!')
    setSendingQuote(false)
    setQuoteModal(null)
    setQuotePrice('')
    loadOrders()
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    const { error } = await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Order marked as ${ORDER_STATUS_LABELS[newStatus]}!`)
      fetch('/api/notifications/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, event: 'status_update' }),
      }).catch(() => {})
      loadOrders()
    }
    setUpdating(null)
  }

  const startDeliveryTracking = async (orderId: string) => {
    if (!navigator.geolocation) { toast.error('GPS not supported on this device'); return }
    await supabase.from('orders').update({ is_delivering: true }).eq('id', orderId)
    setTrackingOrderId(orderId)
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        await supabase.from('delivery_locations').upsert({
          order_id: orderId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'order_id' })
      },
      () => toast.error('GPS error — keep app open for tracking'),
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    toast.success('Live tracking started — keep this page open')
  }

  const stopDeliveryTracking = async (orderId: string) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    await supabase.from('orders').update({ is_delivering: false, status: 'delivered' }).eq('id', orderId)
    await supabase.from('delivery_locations').delete().eq('order_id', orderId)
    setTrackingOrderId(null)
    toast.success('Delivery confirmed!')
    loadOrders()
  }

  const rejectOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to reject this order?')) return
    await updateStatus(orderId, 'cancelled')
  }

  const tabs = ['active', 'pending', 'completed']

  return (
    <div className="min-h-screen bg-[#140F1E]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Orders</h1>

        <div className="flex gap-1 bg-white/[0.05] backdrop-blur-xl rounded-xl border border-white/[0.08] p-1 mb-6 w-fit">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={cn('px-5 py-2 text-sm font-medium rounded-lg capitalize transition-colors', filter === t ? 'bg-violet-700 text-white' : 'text-zinc-500 hover:text-zinc-300')}>
              {t}
            </button>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08]">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-zinc-500">No {filter} orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const o = order as Order & { customer?: { full_name: string }; customer_offer?: number }
              const action = STATUS_ACTIONS[order.status]
              const isPending = order.status === 'pending'
              const customerOffer = o.customer_offer
              const myCounter = isPending && order.agreed_price && order.agreed_price !== customerOffer
              const waitingForCustomer = myCounter
              return (
                <div key={order.id} className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-400 font-bold">
                        {o.customer?.full_name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{order.title}</p>
                        <p className="text-sm text-zinc-500">{o.customer?.full_name} • {formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{order.description}</p>

                  {/* Price negotiation strip */}
                  {isPending && (
                    <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-3 text-sm flex-wrap">
                      {customerOffer ? (
                        <span className="text-amber-300">Customer offers <strong>{formatCurrency(customerOffer)}</strong></span>
                      ) : (
                        <span className="text-amber-400">No price proposed yet</span>
                      )}
                      {myCounter && (
                        <span className="text-zinc-500">→ Your counter: <strong>{formatCurrency(order.agreed_price!)}</strong> — waiting for customer</span>
                      )}
                    </div>
                  )}
                  {order.status === 'accepted' && order.agreed_price && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl mb-3 text-sm">
                      <CheckCircle size={14} className="text-green-400" />
                      <span className="text-green-800">Agreed price: <strong>{formatCurrency(order.agreed_price)}</strong></span>
                      {!order.deposit_paid && <span className="text-green-400 ml-auto">Waiting for payment</span>}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-zinc-600 mb-3">
                    <span>{order.delivery_type === 'pickup_delivery' ? '🚚 Pickup & Delivery' : '🏪 Visit Shop'}</span>
                    {order.deadline && <span>• Deadline: {formatDate(order.deadline)}</span>}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/orders/${order.id}`}
                      className="flex items-center gap-1.5 text-sm text-violet-400 border border-violet-500/30 px-3 py-2 rounded-xl hover:bg-violet-500/10 transition-colors">
                      Details <ChevronRight size={13} />
                    </Link>
                    <Link href={`/tailor/chat?order=${order.id}`}
                      className="text-sm text-zinc-400 border border-white/[0.1] px-3 py-2 rounded-xl hover:bg-white/[0.06] transition-colors">
                      💬 Chat
                    </Link>

                    {isPending && !waitingForCustomer && customerOffer && (
                      <Button size="sm" onClick={() => acceptOffer(order.id, customerOffer)} loading={sendingQuote}>
                        <CheckCircle size={13} /> Accept {formatCurrency(customerOffer)}
                      </Button>
                    )}

                    {isPending && !waitingForCustomer && (
                      <button onClick={() => openQuoteModal(order)}
                        className="flex items-center gap-1.5 text-sm text-amber-400 border border-amber-500/20 bg-amber-500/10 px-3 py-2 rounded-xl hover:bg-amber-500/15 transition-colors">
                        <Send size={13} /> Counter
                      </button>
                    )}

                    {order.status === 'accepted' && order.deposit_paid && action && action.next !== 'out_for_delivery' && action.next !== 'delivered' && (
                      <Button size="sm" onClick={() => updateStatus(order.id, action.next)} loading={updating === order.id}>
                        <CheckCircle size={13} /> {action.label}
                      </Button>
                    )}
                    {order.status === 'ready' && order.deposit_paid && (
                      <Button size="sm" onClick={() => { updateStatus(order.id, 'out_for_delivery'); startDeliveryTracking(order.id) }} loading={updating === order.id}>
                        <Navigation size={13} /> Start Delivery + Track
                      </Button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <Button size="sm" onClick={() => stopDeliveryTracking(order.id)} loading={updating === order.id}>
                        <CheckCircle size={13} /> Confirm Delivered
                      </Button>
                    )}

                    {isPending && (
                      <button onClick={() => rejectOrder(order.id)}
                        className="flex items-center gap-1.5 text-sm text-red-500 border border-red-500/20 px-3 py-2 rounded-xl hover:bg-red-500/10 transition-colors">
                        <XCircle size={13} /> Reject
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quote modal */}
      {quoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQuoteModal(null)}>
          <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-white text-lg mb-1">Send a counter offer</h2>
            <p className="text-sm text-zinc-500 mb-5">
              {quoteModal.currentBudget
                ? `Customer offered: ${formatCurrency(quoteModal.currentBudget)}`
                : 'No offer from customer yet'}
            </p>
            <div className="relative mb-5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-medium text-sm">₦</span>
              <input
                type="number"
                min="0"
                placeholder="e.g. 45000"
                className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-white/[0.1] focus:border-violet-500 focus:outline-none text-lg font-semibold"
                value={quotePrice}
                onChange={e => setQuotePrice(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setQuoteModal(null)}
                className="flex-1 py-2.5 text-sm font-medium text-zinc-400 border border-white/[0.1] rounded-xl hover:bg-white/[0.06] transition-colors">
                Cancel
              </button>
              <Button className="flex-1" loading={sendingQuote}
                onClick={() => orders.find(o => o.id === quoteModal.orderId)?.status === 'pending'
                  ? sendQuote()
                  : updateQuote(quoteModal.orderId)
                }>
                <Send size={14} />
                {orders.find(o => o.id === quoteModal.orderId)?.status === 'pending' ? 'Send Quote' : 'Update Price'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
