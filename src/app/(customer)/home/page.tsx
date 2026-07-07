'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Ruler, Search, ShoppingBag, CheckCircle, Compass, Home, ArrowRight, Sparkles } from 'lucide-react'
import { formatCurrency, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import type { Profile, Order } from '@/types'

type Tab = 'home' | 'orders' | 'explore'

const QUICK_ACTIONS = [
  {
    href: '/browse',
    icon: <Search size={22} />,
    label: 'Find a Creative',
    sub: 'Browse & book',
    bg: 'from-violet-600 to-violet-800',
    glow: 'shadow-violet-500/30',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  },
  {
    href: '/feed',
    icon: <Sparkles size={22} />,
    label: 'Inspo Feed',
    sub: 'Style & trends',
    bg: 'from-fuchsia-600 to-purple-800',
    glow: 'shadow-fuchsia-500/30',
    img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80',
  },
  {
    href: '/orders',
    icon: <ShoppingBag size={22} />,
    label: 'My Orders',
    sub: null,
    bg: 'from-amber-500 to-orange-700',
    glow: 'shadow-amber-500/30',
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
  },
  {
    href: '/orders/asoebi',
    icon: <span className="text-xl">👗</span>,
    label: 'Asoebi',
    sub: 'Group outfits',
    bg: 'from-pink-600 to-rose-800',
    glow: 'shadow-pink-500/30',
    img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
  },
]

export default function CustomerHome() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [hasMeasurements, setHasMeasurements] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('home')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const [{ data: prof }, { data: ord }, { data: meas }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('orders').select('*, tailor:tailor_profiles(business_name)').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(20),
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

  if (loading) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const activeOrders = orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status))

  return (
    <div className="min-h-screen">
      {/* Soft ambient bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-400/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-violet-300/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-64 bg-amber-400/6 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <div className="relative max-w-2xl mx-auto px-4 py-6">

        {/* Welcome bar */}
        <div className="flex items-center justify-between mb-6 fade-up">
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest mb-0.5">Welcome back</p>
            <h1 className="text-2xl font-bold text-zinc-900">{firstName} ✂️</h1>
          </div>
          <Link href="/browse"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25 hover:scale-[1.03] active:scale-[0.97]">
            <Search size={14} /> Find Creative
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-100 rounded-2xl border border-zinc-200 p-1 mb-6 fade-up-1">
          {([
            { key: 'home',    label: 'Home',    icon: <Home size={14} /> },
            { key: 'orders',  label: 'Orders',  icon: <ShoppingBag size={14} />, badge: activeOrders.length },
            { key: 'explore', label: 'Explore', icon: <Compass size={14} /> },
          ] as { key: Tab; label: string; icon: React.ReactNode; badge?: number }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative ${
                tab === t.key
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-white'
              }`}>
              {t.icon} {t.label}
              {t.badge ? (
                <span className={`absolute top-1.5 right-2 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${tab === t.key ? 'bg-white text-violet-700' : 'bg-violet-600 text-white'}`}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── Home tab ── */}
        {tab === 'home' && (
          <div className="space-y-4">
            {hasMeasurements === false && (
              <Link href="/profile#measurements"
                className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100/60 transition-all duration-200 group fade-up">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Ruler size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-amber-800 text-sm">Save your measurements</p>
                  <p className="text-xs text-amber-600 mt-0.5">Creatives use them automatically — no re-measuring</p>
                </div>
                <ArrowRight size={16} className="text-amber-500 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            {hasMeasurements === true && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 fade-up">
                <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">Measurements saved</p>
                <Link href="/profile#measurements" className="ml-auto text-xs text-emerald-600 hover:text-emerald-700 underline underline-offset-2">Update</Link>
              </div>
            )}

            {/* Quick action image cards */}
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action, i) => (
                <Link key={action.href} href={action.href}
                  className={`relative overflow-hidden rounded-2xl aspect-[4/3] flex flex-col justify-end p-4 group cursor-pointer shadow-lg ${action.glow} hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 fade-up-${i + 1}`}>
                  <img src={action.img} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${action.bg} opacity-70 group-hover:opacity-80 transition-opacity duration-300`} />
                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                  <div className="relative z-10">
                    <div className="text-white/90 mb-1.5">{action.icon}</div>
                    <p className="font-bold text-white text-sm leading-tight">{action.label}</p>
                    {action.sub && <p className="text-white/60 text-xs mt-0.5">{action.sub}</p>}
                    {action.href === '/orders' && <p className="text-white/60 text-xs mt-0.5">{orders.length} total</p>}
                  </div>
                </Link>
              ))}
            </div>

            {/* Active orders preview */}
            {activeOrders.length > 0 && (
              <div className="space-y-2 mt-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Active Orders</p>
                {activeOrders.slice(0, 2).map(order => {
                  const creative = (order as Order & { tailor?: { business_name: string } }).tailor
                  return (
                    <Link key={order.id} href={`/orders/${order.id}`}
                      className="flex items-center justify-between p-4 bg-white hover:bg-violet-50/40 rounded-2xl border border-zinc-200 hover:border-violet-200 transition-all duration-200 group shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 font-bold text-sm flex-shrink-0">
                          {creative?.business_name?.[0] || '✂'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{order.title}</p>
                          <p className="text-xs text-zinc-500">{creative?.business_name || 'Creative'}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                        <ArrowRight size={14} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                      </div>
                    </Link>
                  )
                })}
                {activeOrders.length > 2 && (
                  <Link href="/orders" className="block text-center text-sm text-violet-600 hover:text-violet-700 py-2 transition-colors">
                    +{activeOrders.length - 2} more orders →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Orders tab ── */}
        {tab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 shadow-sm">
                <div className="text-5xl mb-3">✂️</div>
                <h3 className="font-bold text-zinc-900 mb-1">No orders yet</h3>
                <p className="text-sm text-zinc-500 mb-5">Browse creatives and place your first order</p>
                <Link href="/browse" className="inline-flex items-center gap-2 bg-violet-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-500 transition-colors text-sm shadow-lg shadow-violet-500/25">
                  <Search size={15} /> Find a Creative
                </Link>
              </div>
            ) : (
              <>
                {activeOrders.length > 0 && (
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Active ({activeOrders.length})</p>
                )}
                {orders.map(order => {
                  const creative = (order as Order & { tailor?: { business_name: string } }).tailor
                  return (
                    <Link key={order.id} href={`/orders/${order.id}`}
                      className="flex items-center justify-between p-4 bg-white hover:bg-zinc-50 rounded-2xl border border-zinc-200 hover:border-violet-200 transition-all duration-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 font-bold text-sm flex-shrink-0">
                          {creative?.business_name?.[0] || '✂'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{order.title}</p>
                          <p className="text-xs text-zinc-500">{creative?.business_name || 'Creative'}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                        {order.agreed_price && <p className="text-xs font-bold text-zinc-900 mt-1">{formatCurrency(order.agreed_price)}</p>}
                      </div>
                    </Link>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* ── Explore tab ── */}
        {tab === 'explore' && (
          <div className="space-y-3">
            {[
              { href: '/feed', emoji: '✨', label: 'Creative Feed', sub: 'See the latest posts from creatives you follow' },
              { href: '/browse', emoji: '🔍', label: 'Browse Creatives', sub: 'Filter by service, city, and rating' },
              { href: '/orders/asoebi', emoji: '👗', label: 'Asoebi Group Orders', sub: 'Coordinate outfits for events and weddings' },
              { href: '/profile#measurements', emoji: null, label: 'My Measurements', sub: hasMeasurements ? 'Saved — tap to update' : 'Not set yet — add now', ruler: true },
            ].map((item, i) => (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-4 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-violet-200 rounded-2xl p-5 transition-all duration-200 group shadow-sm fade-up-${i + 1}`}>
                <div className="w-12 h-12 bg-violet-100 border border-violet-200 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {item.ruler ? <Ruler size={20} className="text-violet-600" /> : item.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-zinc-900">{item.label}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">{item.sub}</p>
                </div>
                <ArrowRight size={16} className="text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
