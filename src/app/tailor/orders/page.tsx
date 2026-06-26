'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Order } from '@/types'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react'

const STATUS_ACTIONS: Record<string, { next: string; label: string }> = {
  pending: { next: 'accepted', label: 'Accept Order' },
  accepted: { next: 'measuring', label: 'Start Measuring' },
  measuring: { next: 'in_progress', label: 'Begin Sewing' },
  in_progress: { next: 'ready', label: 'Mark as Ready' },
  ready: { next: 'out_for_delivery', label: 'Out for Delivery' },
  out_for_delivery: { next: 'delivered', label: 'Mark Delivered' },
}

export default function TailorOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<string>('active')
  const [updating, setUpdating] = useState<string | null>(null)

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

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    const { error } = await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Order marked as ${ORDER_STATUS_LABELS[newStatus]}!`)
      // Fire WhatsApp notification (non-blocking)
      const event = newStatus === 'accepted' ? 'order_accepted' : 'status_update'
      fetch('/api/notifications/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, event }),
      }).catch(() => {})
      loadOrders()
    }
    setUpdating(null)
  }

  const rejectOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to reject this order?')) return
    await updateStatus(orderId, 'cancelled')
  }

  const tabs = ['active', 'pending', 'completed']

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 w-fit">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={cn('px-5 py-2 text-sm font-medium rounded-lg capitalize transition-colors', filter === t ? 'bg-violet-700 text-white' : 'text-gray-500 hover:text-gray-700')}>
              {t}
            </button>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">No {filter} orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const action = STATUS_ACTIONS[order.status]
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold">
                        {order.customer?.full_name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{order.title}</p>
                        <p className="text-sm text-gray-500">{order.customer?.full_name} • {formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{order.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                    {order.agreed_price && (
                      <span className="font-semibold text-violet-700">{formatCurrency(order.agreed_price)}</span>
                    )}
                    <span>• {order.delivery_type === 'pickup_delivery' ? '🚚 Pickup & Delivery' : '🏪 Visit Shop'}</span>
                    {order.deadline && <span>• Deadline: {formatDate(order.deadline)}</span>}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link href={`/orders/${order.id}`}
                      className="flex items-center gap-1.5 text-sm text-violet-700 border border-violet-200 px-4 py-2 rounded-xl hover:bg-violet-50 transition-colors">
                      View Details <ChevronRight size={14} />
                    </Link>
                    <Link href={`/tailor/chat?order=${order.id}`}
                      className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                      💬 Chat
                    </Link>
                    {action && (
                      <Button size="sm" onClick={() => updateStatus(order.id, action.next)} loading={updating === order.id}>
                        <CheckCircle size={14} /> {action.label}
                      </Button>
                    )}
                    {order.status === 'pending' && (
                      <button onClick={() => rejectOrder(order.id)}
                        className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
                        <XCircle size={14} /> Reject
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
