'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Ruler, Search, ShoppingBag, CheckCircle, Clock, Package, Compass, Home, ArrowRight } from 'lucide-react'
import { formatCurrency, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import type { Profile, Order } from '@/types'

type Tab = 'home' | 'orders' | 'explore'

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex justify-center py-24">
        <div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" />
      </div>
    </div>
  )

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const activeOrders = orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Welcome bar */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Welcome back</p>
            <h1 className="text-xl font-bold text-gray-900">{firstName} 👋</h1>
          </div>
          <Link href="/browse"
            className="flex items-center gap-2 bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-violet-800 transition-colors">
            <Search size={14} /> Find Creative
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-5">
          {([
            { key: 'home',    label: 'Home',    icon: <Home size={14} /> },
            { key: 'orders',  label: 'Orders',  icon: <ShoppingBag size={14} />, badge: activeOrders.length },
            { key: 'explore', label: 'Explore', icon: <Compass size={14} /> },
          ] as { key: Tab; label: string; icon: React.ReactNode; badge?: number }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                tab === t.key ? 'bg-violet-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {t.icon} {t.label}
              {t.badge ? (
                <span className={`absolute top-1.5 right-2 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${tab === t.key ? 'bg-white text-violet-700' : 'bg-violet-700 text-white'}`}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── Home tab ── */}
        {tab === 'home' && (
          <div className="space-y-4">
            {/* Measurements nudge */}
            {hasMeasurements === false && (
              <Link href="/profile#measurements"
                className="flex items-center gap-4 bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
                  <Ruler size={18} className="text-amber-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-amber-900 text-sm">Save your measurements</p>
                  <p className="text-xs text-amber-700 mt-0.5">Creatives use them automatically — no re-measuring</p>
                </div>
                <ArrowRight size={16} className="text-amber-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            {hasMeasurements === true && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 font-medium">Measurements saved</p>
                <Link href="/profile#measurements" className="ml-auto text-xs text-green-700 underline">Update</Link>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/browse"
                className="bg-violet-700 text-white rounded-2xl p-5 flex flex-col gap-3 hover:bg-violet-800 transition-colors card-lift">
                <Search size={22} />
                <div>
                  <p className="font-bold text-sm">Find a Creative</p>
                  <p className="text-violet-300 text-xs mt-0.5">Browse & book</p>
                </div>
              </Link>
              <Link href="/feed"
                className="bg-white border border-gray-200 text-gray-900 rounded-2xl p-5 flex flex-col gap-3 hover:border-violet-300 transition-colors card-lift">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="font-bold text-sm">Feed</p>
                  <p className="text-gray-500 text-xs mt-0.5">See latest posts</p>
                </div>
              </Link>
              <Link href="/orders"
                className="bg-white border border-gray-200 text-gray-900 rounded-2xl p-5 flex flex-col gap-3 hover:border-violet-300 transition-colors card-lift">
                <ShoppingBag size={22} className="text-violet-600" />
                <div>
                  <p className="font-bold text-sm">My Orders</p>
                  <p className="text-gray-500 text-xs mt-0.5">{orders.length} total</p>
                </div>
              </Link>
              <Link href="/orders/asoebi"
                className="bg-white border border-gray-200 text-gray-900 rounded-2xl p-5 flex flex-col gap-3 hover:border-violet-300 transition-colors card-lift">
                <span className="text-2xl">👗</span>
                <div>
                  <p className="font-bold text-sm">Asoebi</p>
                  <p className="text-gray-500 text-xs mt-0.5">Group outfits</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* ── Orders tab ── */}
        {tab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-3">✂️</div>
                <h3 className="font-bold text-gray-900 mb-1">No orders yet</h3>
                <p className="text-sm text-gray-500 mb-5">Browse creatives and place your first order</p>
                <Link href="/browse" className="inline-flex items-center gap-2 bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-800 transition-colors text-sm">
                  <Search size={15} /> Find a Creative
                </Link>
              </div>
            ) : (
              <>
                {activeOrders.length > 0 && (
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Active ({activeOrders.length})</p>
                )}
                {orders.map(order => {
                  const creative = (order as Order & { tailor?: { business_name: string } }).tailor
                  return (
                    <Link key={order.id} href={`/orders/${order.id}`}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-violet-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                          {creative?.business_name?.[0] || '✂'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{order.title}</p>
                          <p className="text-xs text-gray-500">{creative?.business_name || 'Creative'}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                        {order.agreed_price && <p className="text-xs font-bold text-gray-900 mt-1">{formatCurrency(order.agreed_price)}</p>}
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
            <Link href="/feed"
              className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 hover:border-violet-200 transition-all card-lift">
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">✨</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Creative Feed</p>
                <p className="text-sm text-gray-500 mt-0.5">See the latest posts from creatives you follow</p>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </Link>
            <Link href="/browse"
              className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 hover:border-violet-200 transition-all card-lift">
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🔍</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Browse Creatives</p>
                <p className="text-sm text-gray-500 mt-0.5">Filter by service, city, and rating</p>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </Link>
            <Link href="/orders/asoebi"
              className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 hover:border-violet-200 transition-all card-lift">
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">👗</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Asoebi Group Orders</p>
                <p className="text-sm text-gray-500 mt-0.5">Coordinate outfits for events and weddings</p>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </Link>
            <Link href="/profile#measurements"
              className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 hover:border-violet-200 transition-all card-lift">
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Ruler size={20} className="text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">My Measurements</p>
                <p className="text-sm text-gray-500 mt-0.5">{hasMeasurements ? 'Saved — tap to update' : 'Not set yet — add now'}</p>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
