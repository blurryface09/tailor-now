import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, Scissors, Package, TrendingUp, Clock, Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/browse')

  const [
    { count: totalMembers },
    { count: totalCustomers },
    { count: totalCreatives },
    { count: verifiedCreatives },
    { count: totalOrders },
    { count: pendingVerifications },
    { count: totalReviews },
    { data: recentOrders },
    { data: commissionData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('tailor_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tailor_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true).eq('is_active', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('tailor_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', false).eq('is_active', true),
    supabase.from('ratings').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*, customer:profiles(full_name), tailor:tailor_profiles(business_name)')
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('payouts').select('commission_amount').eq('status', 'paid'),
  ])

  const totalCommission = (commissionData || []).reduce((s, p) => s + p.commission_amount, 0)

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="page-enter max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {totalMembers || 0} total members · {verifiedCreatives || 0} verified creatives · {pendingVerifications || 0} pending creatives
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/admin/tailors" className="bg-white border border-zinc-200 text-zinc-700 text-sm px-4 py-2 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm">
              Manage Creatives
            </Link>
            <Link href="/admin/disputes" className="bg-white border border-red-200 text-red-600 text-sm px-4 py-2 rounded-xl hover:bg-red-50 transition-colors shadow-sm">
              Disputes
            </Link>
            <Link href="/admin/payouts" className="bg-white border border-green-200 text-green-700 text-sm px-4 py-2 rounded-xl hover:bg-green-50 transition-colors shadow-sm">
              Payouts
            </Link>
            <Link href="/admin/users" className="bg-white border border-zinc-200 text-zinc-700 text-sm px-4 py-2 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm">
              Accounts
            </Link>
            <Link href="/admin/reviews" className="bg-white border border-amber-200 text-amber-700 text-sm px-4 py-2 rounded-xl hover:bg-amber-50 transition-colors shadow-sm">
              Reviews
            </Link>
            <Link href="/admin/fabrics" className="bg-white border border-amber-200 text-amber-700 text-sm px-4 py-2 rounded-xl hover:bg-amber-50 transition-colors shadow-sm">
              Fabrics
            </Link>
            <Link href="/admin/orders" className="bg-violet-700 text-white text-sm px-4 py-2 rounded-xl hover:bg-violet-800 transition-colors">
              All Orders
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
          {[
            { icon: <Users size={20} />, label: 'Total members', value: totalMembers || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: <Users size={20} />, label: 'Customers', value: totalCustomers || 0, color: 'text-sky-600', bg: 'bg-sky-50' },
            { icon: <Scissors size={20} />, label: 'Creatives', value: totalCreatives || 0, color: 'text-violet-600', bg: 'bg-violet-50' },
            { icon: <Star size={20} />, label: 'Verified', value: verifiedCreatives || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: <Clock size={20} />, label: 'Pending', value: pendingVerifications || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: <Package size={20} />, label: 'Orders', value: totalOrders || 0, color: 'text-green-600', bg: 'bg-green-50' },
            { icon: <Star size={20} />, label: 'Reviews', value: totalReviews || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: <TrendingUp size={20} />, label: 'Commission Earned', value: formatCurrency(totalCommission), color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(s => (
            <div key={s.label} className="fade-up bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {(pendingVerifications || 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700">
              <Clock size={18} />
              <span className="font-medium">{pendingVerifications} creative(s) pending verification</span>
            </div>
            <Link href="/admin/tailors" className="bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors">
              Review
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="font-bold text-zinc-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-violet-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {(recentOrders || []).map(order => (
                <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{order.title}</p>
                    <p className="text-xs text-zinc-500">{order.customer?.full_name} → {order.tailor?.business_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.agreed_price && <span className="text-sm font-medium text-zinc-900">{formatCurrency(order.agreed_price)}</span>}
                    <span className="text-xs text-zinc-500">{formatDate(order.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
            <h2 className="font-bold text-zinc-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { href: '/admin/tailors', icon: <Scissors size={18} />, label: 'Manage Creatives', desc: 'Verify, suspend, view profiles' },
                { href: '/admin/users', icon: <Users size={18} />, label: 'Manage Accounts', desc: 'Customers, creatives, admins' },
                { href: '/admin/reviews', icon: <Star size={18} />, label: 'Reviews', desc: 'Moderate ratings & reviews' },
                { href: '/admin/orders', icon: <Package size={18} />, label: 'All Orders', desc: 'Monitor disputes, view history' },
                { href: '/admin/payouts', icon: <TrendingUp size={18} />, label: 'Payouts', desc: 'Process creative payouts' },
              ].map(a => (
                <Link key={a.href} href={a.href} className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div className="w-9 h-9 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">{a.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{a.label}</p>
                    <p className="text-xs text-zinc-500">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
