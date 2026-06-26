import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatDate } from '@/lib/utils'
import { Scissors, Star, TrendingUp, Clock, CheckCircle, Package, MessageSquare, Image } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TailorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'tailor') redirect('/browse')

  const { data: tailor } = await supabase.from('tailor_profiles').select('*').eq('user_id', user.id).single()
  if (!tailor) redirect('/onboarding/tailor')

  const [{ data: orders }, { data: payouts }] = await Promise.all([
    supabase.from('orders').select('*, customer:profiles(full_name, avatar_url)')
      .eq('tailor_id', tailor.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('payouts').select('*').eq('tailor_id', tailor.id),
  ])

  const totalEarned = (payouts || []).filter(p => p.status === 'paid').reduce((s, p) => s + p.net_amount, 0)
  const pendingEarnings = (payouts || []).filter(p => p.status === 'pending').reduce((s, p) => s + p.net_amount, 0)
  const activeOrders = (orders || []).filter(o => !['completed', 'cancelled'].includes(o.status)).length
  const pendingOrders = (orders || []).filter(o => o.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="fade-up">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name?.split(' ')[0]} ✂️</h1>
            <p className="text-gray-500 mt-0.5">{tailor.business_name}</p>
          </div>
          <div className="flex gap-3">
            {!tailor.is_verified && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700">
                <Clock size={16} /> Verification pending
              </div>
            )}
            {tailor.is_verified && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700">
                <CheckCircle size={16} /> Verified tailor
              </div>
            )}
            <Link href={`/tailors/${tailor.id}`} className="text-sm border border-violet-700 text-violet-700 px-4 py-2 rounded-xl hover:bg-violet-50 transition-colors">
              View public profile
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <TrendingUp size={20} />, label: 'Total earned', value: formatCurrency(totalEarned), color: 'text-green-600', bg: 'bg-green-50' },
            { icon: <Clock size={20} />, label: 'Pending payout', value: formatCurrency(pendingEarnings), color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: <Package size={20} />, label: 'Active orders', value: activeOrders, color: 'text-violet-600', bg: 'bg-violet-50' },
            { icon: <Star size={20} />, label: 'Rating', value: `${tailor.avg_rating?.toFixed(1) || '—'} ★`, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 card-lift">
              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {pendingOrders > 0 && (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-800">
              <Scissors size={18} />
              <span className="font-medium">You have {pendingOrders} new order{pendingOrders > 1 ? 's' : ''} waiting for your response</span>
            </div>
            <Link href="/tailor/orders" className="bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-violet-800 transition-colors">
              View Orders
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { href: '/tailor/orders', icon: <Package size={22} />, label: 'Manage Orders' },
            { href: '/tailor/portfolio', icon: <Image size={22} />, label: 'Portfolio' },
            { href: '/tailor/pricing', icon: <Scissors size={22} />, label: 'Services & Pricing' },
            { href: '/tailor/chat', icon: <MessageSquare size={22} />, label: 'Messages' },
          ].map(a => (
            <Link key={a.href} href={a.href} className="group bg-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-sm p-5 flex flex-col items-center gap-3 transition-all text-center">
              <div className="w-12 h-12 bg-violet-50 group-hover:bg-violet-100 rounded-xl flex items-center justify-center text-violet-700 transition-colors">{a.icon}</div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-violet-700 transition-colors">{a.label}</span>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <Link href="/tailor/orders" className="text-sm text-violet-700 hover:underline">View all</Link>
          </div>
          {(!orders || orders.length === 0) ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p>No orders yet. Complete your profile to start receiving orders.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map(order => (
                <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                      {order.customer?.full_name?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.title}</p>
                      <p className="text-xs text-gray-400">{order.customer?.full_name} • {formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.agreed_price && <span className="text-sm font-medium text-gray-900">{formatCurrency(order.agreed_price)}</span>}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
