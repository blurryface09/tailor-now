import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatDate } from '@/lib/utils'
import { CREATIVE_SUPPORT_EMAIL_URL, CREATIVE_SUPPORT_WHATSAPP_URL } from '@/lib/support'
import { isCreativeProfileComplete } from '@/lib/creative-completeness'
import { calcScore, getLevel } from '@/lib/creative-score'
import { SwitchToCustomerButton } from '@/components/account/switch-to-customer-button'
import { Scissors, Star, TrendingUp, Clock, CheckCircle, Package, MessageSquare, ImageIcon, UserCog, AlertCircle, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TailorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'tailor') redirect('/browse')

  const { data: tailor } = await supabase.from('tailor_profiles').select('*').eq('user_id', user.id).single()
  if (!tailor) redirect('/onboarding/tailor')

  const { count: portfolioCount } = await supabase
    .from('portfolio_items').select('*', { count: 'exact', head: true })
    .eq('tailor_id', tailor.id)

  const profileComplete = isCreativeProfileComplete({
    avatar_url: profile?.avatar_url,
    phone: profile?.phone,
    address: tailor.address,
    face_photo_url: tailor.face_photo_url,
    portfolio_count: portfolioCount ?? 0,
    min_price: tailor.min_price,
    max_price: tailor.max_price,
  })
  if (!profileComplete) redirect('/onboarding/tailor')

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

  const score = calcScore({ profile_likes: tailor.profile_likes, profile_views: tailor.profile_views, total_orders: tailor.total_orders })
  const level = getLevel(score)
  const nextLevel = level.nextScore !== null ? level.nextScore : null
  const levelPct = nextLevel !== null ? Math.min(100, Math.round((score / nextLevel) * 100)) : 100

  return (
    <div className="min-h-screen bg-[#140F1E]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="fade-up">
            <h1 className="text-2xl font-bold text-white">Welcome back, {profile?.full_name?.split(' ')[0]} ✂️</h1>
            <p className="text-zinc-500 mt-0.5">{tailor.business_name}</p>
          </div>
          <div className="flex gap-3">
            {!tailor.is_verified && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 text-sm text-amber-400">
                <Clock size={16} /> Awaiting admin approval
              </div>
            )}
            {tailor.is_verified && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-sm text-green-700">
                <CheckCircle size={16} /> Verified creative
              </div>
            )}
            {tailor.is_founder && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-gray-950 to-slate-800 rounded-xl px-4 py-2 text-sm text-amber-400 font-bold ring-1 ring-amber-500/30 shadow-sm">
                ✂ First Cut
              </div>
            )}
            <Link href={`/tailors/${tailor.id}`} className="text-sm border border-violet-700 text-violet-400 px-4 py-2 rounded-xl hover:bg-violet-500/10 transition-colors">
              View public profile
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <TrendingUp size={20} />, label: 'Total earned', value: formatCurrency(totalEarned), color: 'text-green-400', bg: 'bg-green-500/10' },
            { icon: <Clock size={20} />, label: 'Pending payout', value: formatCurrency(pendingEarnings), color: 'text-amber-600', bg: 'bg-amber-500/10' },
            { icon: <Package size={20} />, label: 'Active orders', value: activeOrders, color: 'text-violet-600', bg: 'bg-violet-50' },
            { icon: <Star size={20} />, label: 'Rating', value: `${tailor.avg_rating?.toFixed(1) || '—'} ★`, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 card-lift">
              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Level card */}
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{level.emoji}</span>
              <div>
                <p className="font-bold text-white">{level.level} Level</p>
                <p className="text-xs text-zinc-500">Score: {score} pts</p>
              </div>
            </div>
            {nextLevel !== null && (
              <p className="text-xs text-zinc-600">{nextLevel - score} pts to next level</p>
            )}
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${level.level === 'Platinum' ? 'bg-cyan-400' : level.level === 'Gold' ? 'bg-yellow-400' : level.level === 'Silver' ? 'bg-slate-400' : 'bg-orange-400'}`}
              style={{ width: `${levelPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-zinc-600">
            <span>Likes × 1 · Views × 0.1 · Orders × 10</span>
            {nextLevel !== null && <span>{levelPct}%</span>}
          </div>
        </div>

        {/* Pending verification notice */}
        {!tailor.is_verified && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300 text-sm">Your profile is under review</p>
                <p className="text-xs text-amber-400 mt-0.5">
                  Your profile has been submitted and is awaiting admin verification.
                  Once approved, you&apos;ll appear in search results and customers can book you.
                  This usually takes 1–2 business days.
                </p>
              </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SwitchToCustomerButton className="border-amber-300/60" />
                <a
                  href={CREATIVE_SUPPORT_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-950/20 transition-colors hover:bg-green-400"
                >
                  <MessageSquare size={16} />
                  Chat on WhatsApp
                </a>
                <a
                  href={CREATIVE_SUPPORT_EMAIL_URL}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 px-4 py-2.5 text-sm font-bold text-amber-200 transition-colors hover:bg-amber-500/10"
                >
                  <Mail size={16} />
                  Email admin
                </a>
              </div>
            </div>
          </div>
        )}

        {pendingOrders > 0 && (
          <div className="bg-violet-50 border border-violet-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-300">
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
            { href: '/tailor/portfolio', icon: <ImageIcon size={22} />, label: 'Portfolio' },
            { href: '/tailor/pricing', icon: <Scissors size={22} />, label: 'Services & Pricing' },
            { href: '/tailor/profile', icon: <UserCog size={22} />, label: 'Edit Profile' },
          ].map(a => (
            <Link key={a.href} href={a.href} className="group bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] hover:border-violet-500/30 hover:shadow-sm p-5 flex flex-col items-center gap-3 transition-all text-center">
              <div className="w-12 h-12 bg-violet-50 group-hover:bg-violet-500/15 rounded-xl flex items-center justify-center text-violet-400 transition-colors">{a.icon}</div>
              <span className="text-sm font-medium text-zinc-300 group-hover:text-violet-400 transition-colors">{a.label}</span>
            </Link>
          ))}
        </div>

        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08]">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
            <h2 className="font-bold text-white">Recent Orders</h2>
            <Link href="/tailor/orders" className="text-sm text-violet-400 hover:underline">View all</Link>
          </div>
          {(!orders || orders.length === 0) ? (
            <div className="text-center py-16 text-zinc-600">
              <div className="text-4xl mb-3">📋</div>
              <p>No orders yet. Complete your profile to start receiving orders.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map(order => (
                <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-4 hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-400 font-bold text-sm flex-shrink-0">
                      {order.customer?.full_name?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{order.title}</p>
                      <p className="text-xs text-zinc-600">{order.customer?.full_name} • {formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.agreed_price && <span className="text-sm font-medium text-white">{formatCurrency(order.agreed_price)}</span>}
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
