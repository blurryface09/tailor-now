'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, AlertTriangle } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Order, Profile, TailorProfile } from '@/types'

type OrderWithRelations = Order & {
  customer: Profile
  tailor: TailorProfile & { city: string }
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700' },
  accepted:    { label: 'Accepted',    color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', color: 'bg-violet-100 text-violet-700' },
  ready:       { label: 'Ready',       color: 'bg-green-100 text-green-700' },
  delivered:   { label: 'Delivered',   color: 'bg-white/[0.06] text-zinc-400' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-600' },
  disputed:    { label: 'Disputed',    color: 'bg-orange-100 text-orange-700' },
}

const ALL_STATUSES = ['pending', 'accepted', 'in_progress', 'ready', 'delivered', 'cancelled', 'disputed']

export function AdminOrdersClient({ orders, initialStatus }: { orders: OrderWithRelations[]; initialStatus: string }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(initialStatus)

  const filtered = orders.filter(o => {
    const matchesStatus = !status || o.status === status
    const matchesSearch = !search ||
      o.title?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.tailor?.business_name?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const counts: Record<string, number> = {}
  for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1

  const totalValue = filtered.reduce((s, o) => s + (o.agreed_price || 0), 0)
  const disputedCount = orders.filter(o => o.status === 'disputed').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">All Orders</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{orders.length} orders total · {formatCurrency(orders.reduce((s, o) => s + (o.agreed_price || 0), 0))} GMV</p>
        </div>
        <input
          className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
          placeholder="Search orders, customers, tailors..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {disputedCount > 0 && (
        <Link href="/admin/disputes" className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mb-5 hover:bg-orange-100 transition-colors">
          <AlertTriangle size={18} className="text-orange-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-orange-800">{disputedCount} disputed order{disputedCount > 1 ? 's' : ''} need attention</p>
          <span className="ml-auto text-xs text-orange-600 font-medium">Review →</span>
        </Link>
      )}

      {/* Status filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setStatus('')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!status ? 'bg-violet-700 text-white' : 'bg-white border border-white/[0.1] text-zinc-400 hover:border-violet-300'}`}>
          All <span className="ml-1 opacity-70">({orders.length})</span>
        </button>
        {ALL_STATUSES.map(s => (
          counts[s] ? (
            <button key={s} onClick={() => setStatus(status === s ? '' : s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${status === s ? 'bg-violet-700 text-white' : 'bg-white border border-white/[0.1] text-zinc-400 hover:border-violet-300'}`}>
              {STATUS_CONFIG[s]?.label} <span className="ml-1 opacity-70">({counts[s]})</span>
            </button>
          ) : null
        ))}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-xl border border-white/[0.08] p-3 text-center">
          <p className="text-lg font-bold text-white">{filtered.length}</p>
          <p className="text-xs text-zinc-500">Orders shown</p>
        </div>
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-xl border border-white/[0.08] p-3 text-center">
          <p className="text-lg font-bold text-green-700">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-zinc-500">Total value</p>
        </div>
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-xl border border-white/[0.08] p-3 text-center">
          <p className="text-lg font-bold text-violet-700">{formatCurrency(totalValue * 0.20)}</p>
          <p className="text-xs text-zinc-500">Platform commission (20%)</p>
        </div>
      </div>

      <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#09090B] border-b border-white/[0.08]">
              <tr>
                {['Order', 'Customer', 'Creative', 'Amount', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-zinc-600">No orders found</td></tr>
              )}
              {filtered.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                return (
                  <tr key={order.id} className="hover:bg-white/[0.06] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white max-w-[180px] truncate">{order.title || 'Custom order'}</p>
                      <p className="text-xs text-zinc-600 font-mono">{order.id.slice(0, 8)}…</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-300">{order.customer?.full_name || '—'}</p>
                      <p className="text-xs text-zinc-600">{order.customer?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-300">{order.tailor?.business_name || '—'}</p>
                      <p className="text-xs text-zinc-600">{order.tailor?.city || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      {order.agreed_price
                        ? <span className="font-semibold text-white">{formatCurrency(order.agreed_price)}</span>
                        : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order.id}`} className="p-1.5 text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors inline-flex">
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
