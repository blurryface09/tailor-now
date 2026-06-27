'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Ruler, Search, ShoppingBag, ArrowRight, CheckCircle, Clock, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Profile, Order } from '@/types'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> },
  accepted:   { label: 'Accepted',  color: 'bg-blue-100 text-blue-700',     icon: <CheckCircle size={12} /> },
  in_progress:{ label: 'In Progress',color:'bg-violet-100 text-violet-700', icon: <Package size={12} /> },
  ready:      { label: 'Ready',     color: 'bg-green-100 text-green-700',   icon: <CheckCircle size={12} /> },
  delivered:  { label: 'Delivered', color: 'bg-gray-100 text-gray-600',     icon: <CheckCircle size={12} /> },
}

export default function CustomerHome() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [hasMeasurements, setHasMeasurements] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      const [{ data: prof }, { data: ord }, { data: meas }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('orders').select('*, tailor:tailor_profiles(business_name)').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('measurements').select('id').eq('user_id', user.id).maybeSingle(),
      ])

      if (prof?.role === 'tailor') { router.push('/dashboard'); return }
      if (prof?.role === 'admin')  { router.push('/admin'); return }

      setProfile(prof)
      setOrders(ord || [])
      setHasMeasurements(!!meas)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-24">
          <div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Welcome hero */}
        <div className="bg-gradient-to-br from-violet-700 to-violet-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="absolute right-6 bottom-0 text-white/10 text-[120px] leading-none select-none font-bold">✂</div>
          <div className="relative">
            <p className="text-violet-300 text-sm font-medium mb-1">Welcome back</p>
            <h1 className="text-3xl font-black mb-2">{firstName} 👋</h1>
            <p className="text-violet-200 text-sm mb-6">Ready to connect with a creative?</p>
            <Link href="/browse"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.03] text-sm shadow-lg shadow-amber-900/20">
              <Search size={16} /> Browse Creatives <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Measurements nudge */}
        {hasMeasurements === false && (
          <Link href="/profile#measurements"
            className="flex items-center gap-4 bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100 transition-colors group">
            <div className="w-11 h-11 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
              <Ruler size={20} className="text-amber-800" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 text-sm">Save your measurements once</p>
              <p className="text-xs text-amber-700 mt-0.5">Creatives will use them automatically — no re-measuring ever again</p>
            </div>
            <ArrowRight size={18} className="text-amber-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
        {hasMeasurements === true && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">Measurements saved — creatives can use them when you book</p>
            <Link href="/profile#measurements" className="ml-auto text-xs text-green-700 underline hover:text-green-900">Update</Link>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/browse', icon: <Search size={22} />, label: 'Find a Creative', sub: 'Browse & book', color: 'bg-violet-700 text-white' },
            { href: '/orders', icon: <ShoppingBag size={22} />, label: 'My Orders', sub: `${orders.length} total`, color: 'bg-white border border-gray-200 text-gray-900' },
            { href: '/profile#measurements', icon: <Ruler size={22} />, label: 'Measurements', sub: hasMeasurements ? 'Saved ✓' : 'Not set', color: 'bg-white border border-gray-200 text-gray-900' },
            { href: '/orders/asoebi', icon: '👗', label: 'Asoebi Orders', sub: 'Group outfits', color: 'bg-white border border-gray-200 text-gray-900', emoji: true },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-start p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] card-lift ${item.color}`}>
              <div className="mb-3 text-2xl">{item.emoji ? item.icon : <span>{item.icon}</span>}</div>
              <p className="font-bold text-sm leading-tight">{item.label}</p>
              <p className={`text-xs mt-0.5 ${item.color.includes('text-white') ? 'text-violet-200' : 'text-gray-500'}`}>{item.sub}</p>
            </Link>
          ))}
        </div>

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Active Orders</h2>
              <Link href="/orders" className="text-sm text-violet-700 hover:underline font-medium">View all</Link>
            </div>
            <div className="space-y-3">
              {activeOrders.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                const tailor = (order as Order & { tailor?: { business_name: string } }).tailor
                return (
                  <Link key={order.id} href={`/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-violet-50 hover:border-violet-100 border border-transparent transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center text-violet-700 font-bold text-sm">
                        {tailor?.business_name?.[0] || '✂'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tailor?.business_name || 'Tailor'}</p>
                        <p className="text-xs text-gray-500">{order.description?.slice(0, 40) || 'Custom order'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(order.agreed_price || 0)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state — no orders yet */}
        {orders.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="text-5xl mb-3">✂️</div>
            <h3 className="font-bold text-gray-900 mb-1">No orders yet</h3>
            <p className="text-sm text-gray-500 mb-5">Browse creatives and place your first order</p>
            <Link href="/browse" className="inline-flex items-center gap-2 bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-800 transition-colors text-sm">
              <Search size={15} /> Find a Creative
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
