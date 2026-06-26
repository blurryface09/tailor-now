import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, Scissors, Package, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/browse')

  const [
    { count: totalUsers },
    { count: totalTailors },
    { count: totalOrders },
    { count: pendingVerifications },
    { data: recentOrders },
    { data: commissionData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('tailor_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('tailor_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', false),
    supabase.from('orders').select('*, customer:profiles(full_name), tailor:tailor_profiles(business_name)')
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('payouts').select('commission_amount').eq('status', 'paid'),
  ])

  const totalCommission = (commissionData || []).reduce((s, p) => s + p.commission_amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex gap-3 flex-wrap">
            <Link href="/admin/tailors" className="bg-white border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              Manage Tailors
            </Link>
            <Link href="/admin/disputes" className="bg-white border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
              Disputes
            </Link>
            <Link href="/admin/payouts" className="bg-white border border-green-200 text-green-700 text-sm px-4 py-2 rounded-xl hover:bg-green-50 transition-colors">
              Payouts
            </Link>
            <Link href="/admin/orders" className="bg-violet-700 text-white text-sm px-4 py-2 rounded-xl hover:bg-violet-800 transition-colors">
              All Orders
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Users size={20} />, label: 'Total Customers', value: totalUsers || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: <Scissors size={20} />, label: 'Total Tailors', value: totalTailors || 0, color: 'text-violet-600', bg: 'bg-violet-50' },
            { icon: <Package size={20} />, label: 'Total Orders', value: totalOrders || 0, color: 'text-green-600', bg: 'bg-green-50' },
            { icon: <TrendingUp size={20} />, label: 'Commission Earned', value: formatCurrency(totalCommission), color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {(pendingVerifications || 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800">
              <Clock size={18} />
              <span className="font-medium">{pendingVerifications} tailor(s) pending verification</span>
            </div>
            <Link href="/admin/tailors?filter=unverified" className="bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors">
              Review
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-violet-700 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(recentOrders || []).map(order => (
                <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.title}</p>
                    <p className="text-xs text-gray-400">{order.customer?.full_name} → {order.tailor?.business_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.agreed_price && <span className="text-sm font-medium">{formatCurrency(order.agreed_price)}</span>}
                    <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { href: '/admin/tailors', icon: <Scissors size={18} />, label: 'Manage Tailors', desc: 'Verify, suspend, view profiles' },
                { href: '/admin/users', icon: <Users size={18} />, label: 'Manage Users', desc: 'View all customers' },
                { href: '/admin/orders', icon: <Package size={18} />, label: 'All Orders', desc: 'Monitor disputes, view history' },
                { href: '/admin/payouts', icon: <TrendingUp size={18} />, label: 'Payouts', desc: 'Process tailor payouts' },
              ].map(a => (
                <Link key={a.href} href={a.href} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-violet-50 text-violet-700 rounded-xl flex items-center justify-center flex-shrink-0">{a.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
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
