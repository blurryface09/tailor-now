'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MapPin, Star, CheckCircle, Clock, Scissors, MessageSquare,
  ShoppingBag, Pencil, Camera, BadgeCheck, ArrowLeft, X, Heart,
} from 'lucide-react'
import { SERVICE_LABELS, formatCurrency, formatDate, cn } from '@/lib/utils'
import { StarRating } from '@/components/ui/star-rating'
import { Badge } from '@/components/ui/badge'
import { calcScore, getLevel } from '@/lib/creative-score'
import type { TailorProfile, TailorService, PortfolioItem, Rating, Profile } from '@/types'
import toast from 'react-hot-toast'

type TailorWithProfile = TailorProfile & { profile: Profile }
type RatingWithReviewer = Rating & { reviewer: Profile }

interface Props {
  tailor: TailorWithProfile
  services: TailorService[]
  portfolio: PortfolioItem[]
  ratings: RatingWithReviewer[]
  isOwner?: boolean
  currentUserId?: string | null
  initialLiked?: boolean
}

const SERVICE_ICONS: Record<string, string> = {
  street_wear: '🧢', custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

const PORTFOLIO_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=500&fit=crop&q=65',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=400&fit=crop&q=65',
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=500&fit=crop&q=65',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop&q=65',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop&q=65',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop&q=65',
]

function LightboxModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-black/30">
        <X size={22} />
      </button>
      <img src={src} alt="" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
    </div>
  )
}

export function TailorProfileClient({ tailor, services, portfolio, ratings, isOwner, currentUserId, initialLiked = false }: Props) {
  const [tab, setTab] = useState<'about' | 'portfolio' | 'services' | 'reviews'>('portfolio')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [liked, setLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(tailor.profile_likes ?? 0)
  const [liking, setLiking] = useState(false)

  const hasOrders = tailor.total_orders > 0
  const hasRating = tailor.avg_rating > 0

  const score = calcScore({ profile_likes: likesCount, profile_views: tailor.profile_views, total_orders: tailor.total_orders })
  const level = getLevel(score)

  // Increment view count once on mount (fire-and-forget)
  useEffect(() => {
    if (!isOwner) {
      fetch(`/api/creative/${tailor.id}/view`, { method: 'POST' }).catch(() => {})
    }
  }, [tailor.id, isOwner])

  const handleLike = async () => {
    if (!currentUserId) { toast.error('Sign in to like creatives'); return }
    if (isOwner) return
    setLiking(true)
    setLiked(l => !l)
    setLikesCount(c => liked ? c - 1 : c + 1)
    const res = await fetch(`/api/creative/${tailor.id}/like`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setLiked(data.liked)
      setLikesCount(data.likes)
    } else {
      // Revert optimistic update
      setLiked(l => !l)
      setLikesCount(c => liked ? c + 1 : c - 1)
      toast.error(data.error || 'Could not update like')
    }
    setLiking(false)
  }

  // Use portfolio images as cover: first 3 for collage, else gradient
  const coverImages = portfolio.filter(p => p.image_url).slice(0, 3)
  const hasCover = coverImages.length > 0

  return (
    <div className="min-h-screen">
      {lightbox && <LightboxModal src={lightbox} onClose={() => setLightbox(null)} />}

      {/* ── Hero cover ─────────────────────────────────────────── */}
      <div className="relative w-full h-52 sm:h-64 overflow-hidden bg-violet-900">
        {hasCover ? (
          <>
            {/* Main cover: first portfolio image */}
            <img
              src={coverImages[0].image_url!}
              alt="cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
            {/* Mosaic side strips if more images */}
            {coverImages.length >= 2 && (
              <div className="absolute right-0 top-0 bottom-0 w-1/4 flex flex-col gap-0.5 overflow-hidden">
                {coverImages.slice(1).map((img, i) => (
                  <img key={i} src={img.image_url!} alt=""
                    className="flex-1 w-full object-cover opacity-80" />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Use a random fashion placeholder as background */}
            <img
              src={PORTFOLIO_PLACEHOLDERS[Math.abs(tailor.business_name.charCodeAt(0)) % PORTFOLIO_PLACEHOLDERS.length]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/85 via-violet-800/75 to-purple-900/85" />
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-white/5" />
            <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
          </>
        )}

        {/* Back button */}
        <Link href="/browse"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm">
          <ArrowLeft size={12} /> Browse
        </Link>

        {isOwner && (
          <Link href="/tailor/profile"
            className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm">
            <Pencil size={11} /> Edit profile
          </Link>
        )}
      </div>

      {/* ── Profile card ───────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="relative bg-white rounded-b-3xl border border-zinc-200 border-t-0 shadow-sm pb-5 px-5 mb-0 shadow-[0_8px_32px_rgba(109,40,217,0.08)]">
          {/* Avatar — overlaps cover */}
          <div className="relative -mt-14 mb-3 flex items-end justify-between">
            <div className="relative flex-shrink-0">
              {tailor.profile?.avatar_url ? (
                <img src={tailor.profile.avatar_url} alt={tailor.business_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/100 to-purple-700 border-4 border-white shadow-lg flex items-center justify-center text-white text-4xl font-bold select-none">
                  {tailor.business_name?.[0]?.toUpperCase() || '✂'}
                </div>
              )}
              {isOwner && (
                <Link href="/tailor/profile"
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-violet-700 border-2 border-white flex items-center justify-center hover:bg-violet-800 transition-colors shadow"
                  title="Edit photo">
                  <Camera size={12} className="text-white" />
                </Link>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-1">
              {isOwner ? (
                <Link href="/tailor/profile"
                  className="flex items-center gap-1.5 px-4 py-2 border-2 border-zinc-200 text-zinc-600 rounded-full text-sm font-semibold hover:border-violet-300 hover:text-violet-600 transition-colors">
                  <Pencil size={14} /> Edit
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleLike}
                    disabled={liking}
                    className={`flex items-center gap-1.5 px-3 py-2 border-2 rounded-full text-sm font-semibold transition-all ${
                      liked
                        ? 'border-rose-500/60 bg-rose-500/10 text-rose-400'
                        : 'border-zinc-200 text-zinc-500 hover:border-rose-500/50 hover:text-rose-500'
                    }`}>
                    <Heart size={14} className={liked ? 'fill-rose-500' : ''} />
                    <span>{likesCount > 0 ? likesCount : ''}</span>
                  </button>
                  <Link href={`/chat?tailor=${tailor.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 border-2 border-zinc-200 text-zinc-600 rounded-full text-sm font-semibold hover:border-violet-400 hover:text-violet-600 transition-colors">
                    <MessageSquare size={14} /> Message
                  </Link>
                  <Link href={`/orders/new?tailor=${tailor.id}`}
                    className="flex items-center gap-1.5 px-5 py-2 bg-violet-700 text-white rounded-full text-sm font-bold hover:bg-violet-800 transition-colors shadow-sm shadow-violet-300">
                    <ShoppingBag size={14} /> Book
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Name & verification */}
          <div className="mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl {font-bold text-zinc-900">{tailor.business_name}</h1>
              {tailor.is_verified && (
                <BadgeCheck size={20} className="text-violet-600 flex-shrink-0" />
              )}
              {tailor.is_founder && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-gray-950 to-slate-800 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full ring-1 ring-amber-500/30 shadow-sm flex-shrink-0">
                  ✂ First Cut
                </span>
              )}
            </div>
            {tailor.profile?.full_name && (
              <p className="text-sm text-zinc-500 font-medium">{tailor.profile.full_name}</p>
            )}
          </div>

          {/* Bio */}
          {tailor.bio && (
            <p className="text-sm text-zinc-300 leading-relaxed mb-3">{tailor.bio}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-zinc-500 mb-3">
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-zinc-600" />
              {tailor.city}, {tailor.state}
            </span>
            {(tailor as any).min_price && (tailor as any).max_price && (
              <span className="flex items-center gap-1 text-violet-400 font-medium">
                ₦{((tailor as any).min_price / 1000).toFixed(0)}k – ₦{((tailor as any).max_price / 1000).toFixed(0)}k
              </span>
            )}
            <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${level.bg} ${level.color} ${level.border}`}>
              {level.emoji} {level.level}
            </span>
            {tailor.delivery_types?.includes('pickup_delivery') && (
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle size={12} /> Delivery
              </span>
            )}
            {tailor.response_time_hours && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> Replies in ~{tailor.response_time_hours}h
              </span>
            )}
          </div>

          {/* Specialties */}
          {(tailor.specialties || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tailor.specialties.map(s => (
                <span key={s} className="text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2.5 py-1 rounded-full font-medium">
                  {SERVICE_ICONS[s]} {SERVICE_LABELS[s]}
                </span>
              ))}
            </div>
          )}

          {/* Stats row — like Twitter */}
          <div className="flex gap-5 text-sm border-t border-zinc-100 pt-4">
            <div className="text-center">
              <div className="{font-bold text-zinc-900">{hasOrders ? tailor.total_orders : 0}</div>
              <div className="text-xs text-zinc-600">Orders</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-zinc-900 flex items-center gap-1 justify-center">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                {hasRating ? tailor.avg_rating.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-zinc-600">{tailor.total_reviews} reviews</div>
            </div>
            <div className="text-center">
              <div className="{font-bold text-zinc-900">{portfolio.length}</div>
              <div className="text-xs text-zinc-600">Portfolio</div>
            </div>
            {hasOrders && (
              <div className="text-center">
                <div className="{font-bold text-zinc-900">{Math.round(tailor.completion_rate || 0)}%</div>
                <div className="text-xs text-zinc-600">Completion</div>
              </div>
            )}
            {!hasOrders && (
              <div className="text-center">
                <div className="text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-1 rounded-full font-medium mt-0.5">✨ New</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div className="flex border-b border-zinc-200 bg-white/95 backdrop-blur-xl sticky top-16 z-10">
          {(['portfolio', 'about', 'services', 'reviews'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-all border-b-2 -mb-px',
                tab === t
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              )}>
              {t === 'portfolio' ? `Photos${portfolio.length > 0 ? ` (${portfolio.length})` : ''}`
                : t === 'about' ? 'About'
                : t === 'services' ? `Services${services.length > 0 ? ` (${services.length})` : ''}`
                : `Reviews${ratings.length > 0 ? ` (${ratings.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* ── Portfolio / Photos tab ────────────────────────────── */}
        {tab === 'portfolio' && (
          <div className="py-4">
            {portfolio.length === 0 ? (
              isOwner ? (
                <Link href="/tailor/portfolio"
                  className="flex flex-col items-center justify-center py-20 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-violet-300 hover:bg-violet-50 transition-all group mt-1">
                  <div className="text-5xl mb-3">📸</div>
                  <p className="font-semibold text-zinc-300 group-hover:text-violet-300 mb-1">Add your design photos</p>
                  <p className="text-sm text-zinc-600 mb-4 text-center max-w-xs">Show your work — customers decide who to book based on what they see</p>
                  <span className="bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-full">+ Upload photos</span>
                </Link>
              ) : (
                /* Blurred placeholder gallery — always shows pictures */
                <div className="relative mt-1 rounded-2xl overflow-hidden">
                  <div className="columns-2 sm:columns-3 gap-2 space-y-2">
                    {PORTFOLIO_PLACEHOLDERS.map((src, i) => (
                      <div key={i} className="break-inside-avoid overflow-hidden rounded-xl">
                        <img src={src} alt="" loading="lazy"
                          className="w-full object-cover blur-sm brightness-75 scale-105"
                          style={{ aspectRatio: i % 3 === 0 ? '4/5' : i % 3 === 1 ? '1/1' : '3/4' }} />
                      </div>
                    ))}
                  </div>
                  {/* Glassmorphism overlay centred on top */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <div className="bg-black/70 backdrop-blur-xl rounded-2xl px-7 py-6 text-center shadow-2xl border border-white/[0.1] mx-4">
                      <div className="text-4xl mb-3">📸</div>
                      <p className="font-bold text-white text-base mb-1">Portfolio coming soon</p>
                      <p className="text-sm text-zinc-400 mb-4">This creative hasn&apos;t uploaded photos yet</p>
                      <Link href={`/orders/new?tailor=${tailor.id}`}
                        className="inline-block bg-violet-700 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-violet-800 transition-colors shadow-lg shadow-violet-300/40">
                        Book Anyway →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <>
                {/* Pinterest-style masonry grid */}
                <div className="columns-2 sm:columns-3 gap-2 space-y-2 mt-1">
                  {portfolio.map((item, i) => (
                    <div key={item.id}
                      className={cn(
                        'break-inside-avoid group relative overflow-hidden rounded-2xl bg-violet-100 cursor-pointer hover:shadow-lg transition-all duration-300',
                        i === 0 ? 'col-span-2' : ''
                      )}
                      onClick={() => item.image_url && setLightbox(item.image_url)}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title}
                          className="w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          style={{ aspectRatio: i % 3 === 0 ? '4/5' : i % 3 === 1 ? '1/1' : '3/4' }}
                        />
                      ) : (
                        <div className="w-full h-40 flex items-center justify-center text-4xl">✂️</div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        {item.title && (
                          <p className="text-white text-xs font-semibold leading-tight">{item.title}</p>
                        )}
                      </div>
                      {item.service_type && (
                        <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm font-medium">
                          {SERVICE_LABELS[item.service_type]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {isOwner && (
                  <Link href="/tailor/portfolio"
                    className="flex items-center justify-center gap-2 mt-4 py-3 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-sm font-semibold text-zinc-500 hover:text-violet-700">
                    + Add more photos
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {/* ── About tab ─────────────────────────────────────────── */}
        {tab === 'about' && (
          <div className="py-4 space-y-3">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="font-bold text-zinc-900 mb-3">About</h2>
              {tailor.bio ? (
                <p className="text-zinc-400 leading-relaxed text-sm">{tailor.bio}</p>
              ) : isOwner ? (
                <Link href="/tailor/profile"
                  className="flex items-center gap-3 p-4 bg-amber-500/10 border border-dashed border-amber-500/30 rounded-xl hover:bg-amber-500/15 transition-all group">
                  <div className="text-2xl">✍️</div>
                  <div>
                    <p className="font-semibold text-amber-200 text-sm">Add a bio</p>
                    <p className="text-xs text-amber-400 mt-0.5">Profiles with bios get 3× more bookings</p>
                  </div>
                </Link>
              ) : (
                <p className="text-zinc-600 text-sm italic">No bio yet</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="font-bold text-zinc-900 mb-3">Details</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5 text-zinc-300">
                  <MapPin size={15} className="text-violet-500 flex-shrink-0" />
                  {tailor.city}, {tailor.state}
                </div>
                {(tailor as any).address && (
                  <div className="flex items-start gap-2.5 text-zinc-300">
                    <MapPin size={15} className="text-zinc-600 flex-shrink-0 mt-0.5" />
                    {(tailor as any).address}
                  </div>
                )}
                {(tailor as any).min_price && (tailor as any).max_price && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">💰</span>
                    <span className="text-violet-400 font-semibold">
                      ₦{formatCurrency((tailor as any).min_price).replace('₦', '')} – ₦{formatCurrency((tailor as any).max_price).replace('₦', '')}
                    </span>
                  </div>
                )}
                {tailor.delivery_types?.includes('pickup_delivery') && (
                  <div className="flex items-center gap-2.5 text-green-400">
                    <CheckCircle size={15} className="flex-shrink-0" />
                    Pickup & Delivery available
                  </div>
                )}
                {tailor.delivery_types?.includes('visit_shop') && (
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <Scissors size={15} className="flex-shrink-0 text-violet-500" />
                    Customers can visit the shop
                  </div>
                )}
                {tailor.response_time_hours && (
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <Clock size={15} className="text-amber-500 flex-shrink-0" />
                    Typically replies within {tailor.response_time_hours}h
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-zinc-600 text-xs pt-1">
                  <span>Member since {formatDate(tailor.created_at)}</span>
                </div>
              </div>
            </div>

            {(tailor.specialties || []).length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                <h2 className="font-bold text-zinc-900 mb-3">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {tailor.specialties.map(s => (
                    <span key={s} className="flex items-center gap-1.5 text-sm bg-violet-50 text-violet-400 px-3 py-2 rounded-xl font-medium border border-violet-500/20">
                      {SERVICE_ICONS[s]} {SERVICE_LABELS[s]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Profile completeness nudge (owner only) */}
            {isOwner && (() => {
              const items = [
                { done: !!tailor.bio, label: 'Add a bio', href: '/tailor/profile' },
                { done: (tailor.specialties || []).length > 0, label: 'Add specialties', href: '/tailor/profile' },
                { done: portfolio.length > 0, label: 'Upload portfolio photos', href: '/tailor/portfolio' },
                { done: services.length > 0, label: 'Create a service listing', href: '/tailor/pricing' },
              ]
              const done = items.filter(i => i.done).length
              if (done === items.length) return null
              return (
                <div className="bg-violet-50 rounded-2xl border border-violet-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-zinc-900 text-sm">Complete your profile</h3>
                    <span className="text-sm font-bold text-violet-700">{Math.round((done / items.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full mb-3">
                    <div className="h-1.5 rounded-full bg-violet-600 transition-all duration-500" style={{ width: `${(done / items.length) * 100}%` }} />
                  </div>
                  <div className="space-y-1.5">
                    {items.filter(i => !i.done).map(item => (
                      <Link key={item.label} href={item.href} className="flex items-center gap-2 text-sm text-violet-400 hover:underline font-medium">
                        <div className="w-4 h-4 rounded-full border-2 border-violet-300 flex-shrink-0" />
                        {item.label} →
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Services tab ──────────────────────────────────────── */}
        {tab === 'services' && (
          <div className="py-4 space-y-3">
            {services.length === 0 ? (
              isOwner ? (
                <Link href="/tailor/pricing"
                  className="flex flex-col items-center justify-center py-20 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-violet-300 hover:bg-violet-50 transition-all group">
                  <div className="text-5xl mb-3">💼</div>
                  <p className="font-semibold text-zinc-300 group-hover:text-violet-300 mb-1">List your services</p>
                  <p className="text-sm text-zinc-600 mb-4 text-center max-w-xs">Add your services with pricing</p>
                  <span className="bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-full">+ Add services</span>
                </Link>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                  <p className="text-sm text-zinc-500 mb-4">Service pricing hasn't been listed yet. This creative specialises in:</p>
                  {(tailor.specialties || []).length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {tailor.specialties.map(s => (
                        <div key={s} className="flex items-center gap-3 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl p-3.5 border border-violet-500/20 hover:border-violet-300 hover:shadow-sm transition-all">
                          <span className="text-2xl">{SERVICE_ICONS[s]}</span>
                          <span className="text-sm font-semibold text-violet-300">{SERVICE_LABELS[s]}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600 mb-5 italic">Send a message to discuss what you need.</p>
                  )}
                  <Link href={`/orders/new?tailor=${tailor.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-violet-700 text-white text-sm font-bold py-3 rounded-xl hover:bg-violet-800 transition-colors shadow-md shadow-violet-200">
                    Request a Custom Order →
                  </Link>
                </div>
              )
            ) : (
              services.map((service) => (
                <div key={service.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 hover:border-violet-500/30 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xl">{SERVICE_ICONS[service.service_type]}</span>
                        <h3 className="font-semibold text-zinc-900">{service.title}</h3>
                        <Badge variant="default">{SERVICE_LABELS[service.service_type]}</Badge>
                      </div>
                      {service.description && <p className="text-sm text-zinc-500 mb-2">{service.description}</p>}
                      <div className="text-xs text-zinc-600 flex items-center gap-1">
                        <Clock size={12} /> {service.min_days}–{service.max_days} days turnaround
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-violet-700">{formatCurrency(service.base_price)}</div>
                      {service.price_negotiable && <div className="text-xs text-amber-600 font-medium mt-0.5">Negotiable</div>}
                      {!isOwner && (
                        <Link href={`/orders/new?tailor=${tailor.id}&service=${service.id}`}
                          className="mt-3 block bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-violet-800 transition-colors text-center">
                          Book this
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Reviews tab ───────────────────────────────────────── */}
        {tab === 'reviews' && (
          <div className="py-4 space-y-3">
            {ratings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm px-6 py-10 text-center">
                <div className="flex justify-center gap-1.5 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={30} className="text-amber-300 fill-amber-300" />
                  ))}
                </div>
                <h3 className="font-bold text-zinc-900 text-lg mb-1.5">No reviews yet</h3>
                <p className="text-sm text-zinc-600 max-w-xs mx-auto">
                  {isOwner
                    ? 'Complete your first order to start collecting reviews'
                    : 'Be the first to book and leave a review for this creative'}
                </p>
                {!isOwner && (
                  <Link href={`/orders/new?tailor=${tailor.id}`}
                    className="mt-5 inline-block bg-amber-400 text-amber-950 text-sm font-bold px-6 py-2.5 rounded-full hover:bg-amber-500/100 transition-colors shadow-md shadow-amber-200">
                    Book & Be First ⭐
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 flex items-center gap-5">
                  <div className="text-center">
                    <div className="text-4xl font-black text-zinc-900">{tailor.avg_rating.toFixed(1)}</div>
                    <StarRating value={Math.round(tailor.avg_rating)} readonly size="sm" />
                    <div className="text-xs text-zinc-600 mt-1">{ratings.length} review{ratings.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                {ratings.map((rating) => (
                  <div key={rating.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-400 font-semibold text-sm">
                          {rating.reviewer?.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{rating.reviewer?.full_name || 'Customer'}</p>
                          <p className="text-xs text-zinc-600">{formatDate(rating.created_at)}</p>
                        </div>
                      </div>
                      <StarRating value={rating.rating} readonly size="sm" />
                    </div>
                    {rating.comment && <p className="text-sm text-zinc-400 leading-relaxed mt-2">{rating.comment}</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  )
}
