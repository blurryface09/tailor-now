'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Loader2, CheckCircle2, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type Order = {
  id: string
  title: string
  status: string
  agreed_price: number | null
  created_at: string
  customer: { full_name: string } | null
  tailor: { business_name: string; user_id: string } | null
}

const PROMPT_MESSAGE = `Hi! 👋 This is TailorNow.

We noticed you have a pending order waiting for your response. A customer is eager to get started — please check your orders and accept or respond as soon as possible.

You can view the order here: https://tailornow.shop/tailor/orders

If you have any questions, we're here to help!

— TailorNow Team ✂️`

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700',  icon: <Clock size={11} /> },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700',  icon: <CheckCircle2 size={11} /> },
}

export function RecentOrdersClient({ orders }: { orders: Order[] }) {
  const [prompting, setPrompting] = useState<string | null>(null)
  const [prompted, setPrompted] = useState<Set<string>>(new Set())

  async function sendPrompt(order: Order) {
    const tailorUserId = order.tailor?.user_id
    if (!tailorUserId) { toast.error('No tailor linked to this order'); return }
    setPrompting(order.id)
    try {
      const res = await fetch('/api/admin/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tailorUserId, content: PROMPT_MESSAGE }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setPrompted(prev => new Set([...prev, order.id]))
      toast.success(`Prompt sent to ${order.tailor?.business_name}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send prompt')
    } finally {
      setPrompting(null)
    }
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-400 text-sm">
        No pending or completed orders yet
      </div>
    )
  }

  return (
    <div className="divide-y divide-zinc-100">
      {orders.map(order => {
        const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
        const isPending = order.status === 'pending'
        const alreadyPrompted = prompted.has(order.id)

        return (
          <div key={order.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors gap-3">
            <Link href={`/orders/${order.id}`} className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{order.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                {order.customer?.full_name} → {order.tailor?.business_name}
              </p>
            </Link>
            <div className="flex items-center gap-2 flex-shrink-0">
              {order.agreed_price && (
                <span className="text-sm font-medium text-zinc-900">{formatCurrency(order.agreed_price)}</span>
              )}
              <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${cfg.color}`}>
                {cfg.icon} {cfg.label}
              </span>
              <span className="text-xs text-zinc-400 hidden sm:block">{formatDate(order.created_at)}</span>
              {isPending && (
                <button
                  onClick={() => sendPrompt(order)}
                  disabled={!!prompting || alreadyPrompted}
                  title="Send prompt message to creative"
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                    alreadyPrompted
                      ? 'border-green-200 bg-green-50 text-green-600 cursor-default'
                      : 'border-violet-200 text-violet-600 hover:bg-violet-50 disabled:opacity-50'
                  }`}
                >
                  {prompting === order.id
                    ? <Loader2 size={12} className="animate-spin" />
                    : alreadyPrompted
                    ? <CheckCircle2 size={12} />
                    : <MessageSquare size={12} />
                  }
                  {alreadyPrompted ? 'Sent' : 'Prompt'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
