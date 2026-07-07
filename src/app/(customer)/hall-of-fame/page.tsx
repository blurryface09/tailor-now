import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Package, Trophy } from 'lucide-react'
import { SERVICE_LABELS, cn } from '@/lib/utils'
import { calcScore, getLevel } from '@/lib/creative-score'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Hall of Fame · TailorNow' }

const RANK_META = [
  { medal: '🥇', label: '1st Place', ring: 'ring-4 ring-yellow-400/60', card: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300', badge: 'bg-yellow-400 text-yellow-900', crown: true },
  { medal: '🥈', label: '2nd Place', ring: 'ring-4 ring-slate-400/50',  card: 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-300',   badge: 'bg-slate-400 text-white',     crown: false },
  { medal: '🥉', label: '3rd Place', ring: 'ring-4 ring-orange-400/50', card: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300',  badge: 'bg-orange-400 text-white',    crown: false },
]

export default async function HallOfFamePage() {
  const supabase = await createClient()

  const { data: top } = await supabase
    .from('tailor_profiles')
    .select(`
      id, business_name, city, state, specialties,
      avg_rating, total_reviews, total_orders,
      profile_likes, profile_views, is_founder,
      face_photo_url,
      profile:profiles(full_name, avatar_url)
    `)
    .eq('is_verified', true)
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .order('total_orders', { ascending: false })
    .limit(20)

  const creatives = top ?? []
  const podium = creatives.slice(0, 3)
  const list = creatives.slice(3)

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400/20 rounded-3xl mb-5 ring-2 ring-yellow-400/30">
            <Trophy size={38} className="text-yellow-300" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Hall of Fame
          </h1>
          <p className="text-violet-200 text-lg max-w-xl mx-auto">
            Nigeria's top verified creatives, ranked by community love and craft mastery
          </p>
          <p className="text-violet-400 text-sm mt-3">
            Rankings based on average rating · Tie-broken by completed orders
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {creatives.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-lg font-medium text-zinc-400">No verified creatives yet</p>
            <p className="text-sm mt-1">Be the first to earn a spot on the leaderboard!</p>
          </div>
        ) : (
          <>
            {/* ── Podium top 3 ── */}
            {podium.length > 0 && (
              <div className="mb-12">
                <h2 className="text-center text-xs font-bold uppercase tracking-widest text-zinc-600 mb-8">
                  Top Creatives
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {podium.map((c, i) => {
                    const meta = RANK_META[i]
                    const profile = (Array.isArray(c.profile) ? c.profile[0] : c.profile) as { full_name: string; avatar_url: string | null } | null
                    const score = calcScore({ profile_likes: c.profile_likes, profile_views: c.profile_views, total_orders: c.total_orders })
                    const level = getLevel(score)
                    const avatar = profile?.avatar_url ?? c.face_photo_url

                    return (
                      <Link key={c.id} href={`/tailors/${c.id}`}
                        className={cn(
                          'group relative rounded-3xl border p-6 flex flex-col items-center text-center transition-all duration-200 hover:shadow-xl hover:-translate-y-1',
                          meta.card
                        )}>
                        {/* Rank badge */}
                        <span className={cn(
                          'absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full shadow',
                          meta.badge
                        )}>
                          {meta.label}
                        </span>

                        {/* Avatar */}
                        <div className={cn('relative w-24 h-24 rounded-full overflow-hidden mb-4 mt-2', meta.ring)}>
                          {avatar ? (
                            <Image src={avatar} alt={profile?.full_name ?? c.business_name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-violet-100 flex items-center justify-center text-3xl font-bold text-violet-700">
                              {c.business_name[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        <span className="text-3xl mb-1">{meta.medal}</span>

                        <h3 className="font-bold text-zinc-900 text-lg leading-tight">{c.business_name}</h3>
                        {c.city && (
                          <p className="text-xs text-zinc-500 flex items-center justify-center gap-1 mt-1">
                            <MapPin size={11} /> {c.city}, {c.state}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-3">
                          <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                            <Star size={14} className="fill-amber-400 stroke-amber-400" />
                            {c.avg_rating?.toFixed(1) ?? '—'}
                            <span className="font-normal text-zinc-600 text-xs">({c.total_reviews ?? 0})</span>
                          </span>
                          <span className="text-zinc-600">·</span>
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <Package size={12} /> {c.total_orders ?? 0} orders
                          </span>
                        </div>

                        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', level.bg, level.color, level.border)}>
                            {level.emoji} {level.level}
                          </span>
                          {c.is_founder && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-gray-950 to-slate-800 text-amber-400 ring-1 ring-amber-500/30 shadow-sm">
                              ✂ First Cut
                            </span>
                          )}
                        </div>

                        {(c.specialties ?? []).slice(0, 2).length > 0 && (
                          <div className="flex flex-wrap justify-center gap-1 mt-3">
                            {(c.specialties ?? []).slice(0, 2).map((s: string) => (
                              <span key={s} className="text-[11px] bg-white text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-200">
                                {SERVICE_LABELS[s as keyof typeof SERVICE_LABELS] ?? s}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Ranked list #4–20 ── */}
            {list.length > 0 && (
              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-200 flex items-center gap-2">
                  <Trophy size={16} className="text-violet-600" />
                  <h2 className="font-bold text-zinc-900">Top 20 Leaderboard</h2>
                </div>
                <div className="divide-y divide-zinc-100">
                  {list.map((c, i) => {
                    const rank = i + 4
                    const profile = (Array.isArray(c.profile) ? c.profile[0] : c.profile) as { full_name: string; avatar_url: string | null } | null
                    const score = calcScore({ profile_likes: c.profile_likes, profile_views: c.profile_views, total_orders: c.total_orders })
                    const level = getLevel(score)
                    const avatar = profile?.avatar_url ?? c.face_photo_url

                    return (
                      <Link key={c.id} href={`/tailors/${c.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-violet-50 transition-colors group">
                        {/* Rank */}
                        <div className="w-8 text-center flex-shrink-0">
                          <span className="text-lg font-bold text-zinc-600">#{rank}</span>
                        </div>

                        {/* Avatar */}
                        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-zinc-200">
                          {avatar ? (
                            <Image src={avatar} alt={profile?.full_name ?? c.business_name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-violet-100 flex items-center justify-center text-lg font-bold text-violet-700">
                              {c.business_name[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-zinc-900 text-sm truncate group-hover:text-violet-600 transition-colors">
                              {c.business_name}
                            </p>
                            {c.is_founder && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-gray-950 to-slate-800 text-amber-400 ring-1 ring-amber-500/30 flex-shrink-0">
                                ✂ First Cut
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {c.city && (
                              <span className="text-xs text-zinc-600 flex items-center gap-0.5">
                                <MapPin size={10} /> {c.city}
                              </span>
                            )}
                            {(c.specialties ?? []).slice(0, 2).map((s: string) => (
                              <span key={s} className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">
                                {SERVICE_LABELS[s as keyof typeof SERVICE_LABELS] ?? s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                              <Star size={13} className="fill-amber-400 stroke-amber-400" />
                              {c.avg_rating?.toFixed(1) ?? '—'}
                            </div>
                            <div className="text-[10px] text-zinc-600">{c.total_reviews ?? 0} reviews</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-zinc-700">{c.total_orders ?? 0}</div>
                            <div className="text-[10px] text-zinc-600">orders</div>
                          </div>
                          <span className={cn('text-xs font-medium px-2 py-1 rounded-full border', level.bg, level.color, level.border)}>
                            {level.emoji} {level.level}
                          </span>
                        </div>

                        {/* Mobile stats */}
                        <div className="sm:hidden flex-shrink-0 text-right">
                          <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                            <Star size={12} className="fill-amber-400 stroke-amber-400" />
                            {c.avg_rating?.toFixed(1) ?? '—'}
                          </div>
                          <div className="text-[10px] text-zinc-600">{c.total_orders ?? 0} orders</div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Footer note */}
            <p className="text-center text-xs text-zinc-600 mt-8">
              Rankings update in real-time · Only verified creatives appear on this page
            </p>
          </>
        )}
      </div>
    </div>
  )
}
