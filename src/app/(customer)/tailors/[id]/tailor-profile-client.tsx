'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Star, CheckCircle, Clock, Scissors, MessageSquare, ShoppingBag, Pencil, Camera } from 'lucide-react'
import { SERVICE_LABELS, formatCurrency, formatDate, cn } from '@/lib/utils'
import { StarRating } from '@/components/ui/star-rating'
import { Badge } from '@/components/ui/badge'
import type { TailorProfile, TailorService, PortfolioItem, Rating, Profile } from '@/types'

type TailorWithProfile = TailorProfile & { profile: Profile }
type RatingWithReviewer = Rating & { reviewer: Profile }

interface Props {
  tailor: TailorWithProfile
  services: TailorService[]
  portfolio: PortfolioItem[]
  ratings: RatingWithReviewer[]
  isOwner?: boolean
}

const SERVICE_ICONS: Record<string, string> = {
  custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

function ProfileCompleteness({ tailor, services, portfolio, isOwner }: {
  tailor: TailorWithProfile; services: TailorService[]; portfolio: PortfolioItem[]; isOwner: boolean
}) {
  if (!isOwner) return null
  const items = [
    { done: !!tailor.bio, label: 'Add a bio', href: '/tailor/profile' },
    { done: (tailor.specialties || []).length > 0, label: 'Add specialties', href: '/tailor/profile' },
    { done: portfolio.length > 0, label: 'Upload portfolio photos', href: '/tailor/portfolio' },
    { done: services.length > 0, label: 'Create a service listing', href: '/tailor/pricing' },
  ]
  const done = items.filter(i => i.done).length
  const pct = Math.round((done / items.length) * 100)
  if (pct === 100) return null

  return (
    <div className="bg-white rounded-2xl border border-violet-100 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-sm">Profile completeness</h3>
        <span className="text-sm font-bold text-violet-700">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full mb-4">
        <div className="h-2 rounded-full bg-violet-600 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-100' : 'bg-gray-100'}`}>
              {item.done ? (
                <CheckCircle size={13} className="text-green-600" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              )}
            </div>
            {item.done ? (
              <span className="text-sm text-gray-400 line-through">{item.label}</span>
            ) : (
              <Link href={item.href} className="text-sm text-violet-700 hover:underline font-medium">{item.label} →</Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TailorProfileClient({ tailor, services, portfolio, ratings, isOwner }: Props) {
  const [tab, setTab] = useState<'about' | 'portfolio' | 'services' | 'reviews'>('about')
  const [tabKey, setTabKey] = useState(0)

  function switchTab(t: 'about' | 'portfolio' | 'services' | 'reviews') {
    setTab(t)
    setTabKey(k => k + 1)
  }

  const hasOrders = tailor.total_orders > 0
  const hasRating = tailor.avg_rating > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile completeness nudge (owner only) */}
      <ProfileCompleteness tailor={tailor} services={services} portfolio={portfolio} isOwner={!!isOwner} />

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        {/* Cover banner */}
        <div className="h-36 bg-gradient-to-br from-violet-600 via-violet-700 to-purple-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}} />
          <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
          {isOwner && (
            <Link href="/tailor/profile" className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm">
              <Pencil size={11} /> Edit profile
            </Link>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg border-4 border-white flex items-center justify-center text-white text-3xl font-bold select-none">
                {tailor.business_name?.[0]?.toUpperCase() || '✂'}
              </div>
              {isOwner && (
                <Link href="/tailor/profile"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-700 border-2 border-white flex items-center justify-center hover:bg-violet-800 transition-colors"
                  title="Edit profile">
                  <Camera size={12} className="text-white" />
                </Link>
              )}
            </div>

            {/* Name + verified */}
            <div className="flex-1 sm:pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 truncate">{tailor.business_name}</h1>
                {tailor.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    <CheckCircle size={11} /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap text-sm text-gray-500">
                {tailor.profile?.full_name && <span>{tailor.profile.full_name}</span>}
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {tailor.city}, {tailor.state}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {isOwner ? (
                <Link href="/tailor/profile"
                  className="flex items-center gap-2 px-4 py-2.5 bg-violet-700 text-white rounded-xl text-sm font-medium hover:bg-violet-800 transition-colors">
                  <Pencil size={15} /> Edit Profile
                </Link>
              ) : (
                <>
                  <Link href={`/chat?tailor=${tailor.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-violet-700 text-violet-700 rounded-xl text-sm font-medium hover:bg-violet-50 transition-colors">
                    <MessageSquare size={15} /> Message
                  </Link>
                  <Link href={`/orders/new?tailor=${tailor.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-700 text-white rounded-xl text-sm font-medium hover:bg-violet-800 transition-colors">
                    <ShoppingBag size={15} /> Book Now
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-gray-900">
                <Star size={15} className="text-amber-400 fill-amber-400" />
                {hasRating ? tailor.avg_rating.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-gray-500">{tailor.total_reviews > 0 ? `${tailor.total_reviews} review${tailor.total_reviews !== 1 ? 's' : ''}` : 'No reviews yet'}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{hasOrders ? tailor.total_orders : '—'}</div>
              <div className="text-xs text-gray-500">Orders done</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{hasOrders ? `${Math.round(tailor.completion_rate || 0)}%` : '—'}</div>
              <div className="text-xs text-gray-500">Completion rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {tailor.response_time_hours ? `~${tailor.response_time_hours}h` : '< 1h'}
              </div>
              <div className="text-xs text-gray-500">Response time</div>
            </div>
          </div>

          {/* Delivery types + new creator badge */}
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {!hasOrders && (
              <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-1 rounded-full font-medium">
                ✨ New creative
              </span>
            )}
            {tailor.delivery_types?.includes('pickup_delivery') && (
              <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                <CheckCircle size={13} /> Pickup &amp; Delivery
              </span>
            )}
            {tailor.delivery_types?.includes('visit_shop') && (
              <span className="flex items-center gap-1 text-gray-500 text-xs">
                <Scissors size={13} /> Visit Shop
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6">
        {(['about', 'portfolio', 'services', 'reviews'] as const).map(t => (
          <button key={t} onClick={() => switchTab(t)}
            className={cn('flex-1 py-2.5 text-sm font-medium rounded-lg capitalize transition-all duration-200',
              tab === t ? 'bg-violet-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}>
            {t === 'about' ? 'About'
              : t === 'portfolio' ? `Portfolio${portfolio.length > 0 ? ` (${portfolio.length})` : ''}`
              : t === 'services' ? `Services${services.length > 0 ? ` (${services.length})` : ''}`
              : `Reviews${ratings.length > 0 ? ` (${ratings.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── About tab ─────────────────────────────────────────── */}
      {tab === 'about' && (
        <div key={tabKey} className="tab-enter space-y-4">
          {/* Bio */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">About</h2>
              {isOwner && tailor.bio && (
                <Link href="/tailor/profile" className="text-xs text-violet-600 hover:underline flex items-center gap-1">
                  <Pencil size={11} /> Edit
                </Link>
              )}
            </div>
            {tailor.bio ? (
              <p className="text-gray-600 leading-relaxed">{tailor.bio}</p>
            ) : isOwner ? (
              <Link href="/tailor/profile"
                className="flex items-center gap-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-xl hover:border-amber-400 hover:from-amber-100 hover:to-orange-100 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center text-2xl flex-shrink-0 transition-colors">✍️</div>
                <div>
                  <p className="font-semibold text-amber-900">Add a bio to your profile</p>
                  <p className="text-xs text-amber-700 mt-1">Tell customers about your experience, style, and what makes you special. Profiles with bios get 3× more orders.</p>
                  <span className="inline-block mt-2 text-xs font-semibold text-amber-800 underline">Write your bio →</span>
                </div>
              </Link>
            ) : (
              <p className="text-gray-400 text-sm italic">This creative hasn&apos;t added a bio yet.</p>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-violet-500 flex-shrink-0" />
                <span className="text-gray-700">{tailor.city}, {tailor.state}</span>
              </div>
              {tailor.delivery_types?.includes('pickup_delivery') && (
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Offers Pickup &amp; Delivery</span>
                </div>
              )}
              {tailor.delivery_types?.includes('visit_shop') && (
                <div className="flex items-center gap-3">
                  <Scissors size={16} className="text-violet-500 flex-shrink-0" />
                  <span className="text-gray-700">Customers can visit the shop</span>
                </div>
              )}
              {tailor.response_time_hours && (
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-amber-500 flex-shrink-0" />
                  <span className="text-gray-700">Typically replies within {tailor.response_time_hours}h</span>
                </div>
              )}
            </div>
          </div>

          {/* Specialties */}
          {(tailor.specialties || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {(tailor.specialties || []).map(s => (
                  <span key={s} className="flex items-center gap-1.5 text-sm bg-violet-50 text-violet-700 px-3 py-2 rounded-xl font-medium border border-violet-100">
                    {SERVICE_ICONS[s]} {SERVICE_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isOwner && (tailor.specialties || []).length === 0 && (
            <Link href="/tailor/profile"
              className="flex items-center gap-4 p-5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-violet-100 flex items-center justify-center text-xl flex-shrink-0">✂️</div>
              <div>
                <p className="font-semibold text-gray-700 group-hover:text-violet-800">Add your specialties</p>
                <p className="text-xs text-gray-500 mt-0.5">Let customers know what you're best at →</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* ── Portfolio tab ─────────────────────────────────────── */}
      {tab === 'portfolio' && (
        portfolio.length === 0 ? (
          <div key={tabKey} className="tab-enter">
            {isOwner ? (
              <Link href="/tailor/portfolio"
                className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all group">
                <div className="text-5xl mb-3">📸</div>
                <p className="font-semibold text-gray-700 group-hover:text-violet-800 mb-1">Add your portfolio photos</p>
                <p className="text-sm text-gray-400 mb-4 text-center max-w-xs">Show your best work — outfits, styles, and custom pieces you&apos;ve made</p>
                <span className="bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl group-hover:bg-violet-800 transition-colors">+ Add photos</span>
              </Link>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-3">📸</div>
                <p className="text-gray-500">No portfolio items yet</p>
              </div>
            )}
          </div>
        ) : (
          <div key={tabKey} className="tab-enter">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {portfolio.map((item) => (
                <div key={item.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md card-lift transition-all">
                  <div className="aspect-square bg-violet-100 relative overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">✂️</div>
                    )}
                    {item.service_type && (
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {SERVICE_LABELS[item.service_type]}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>}
                  </div>
                </div>
              ))}
              {isOwner && (
                <Link href="/tailor/portfolio"
                  className="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all group">
                  <span className="text-3xl mb-2">+</span>
                  <span className="text-xs text-gray-500 group-hover:text-violet-700 font-medium">Add more</span>
                </Link>
              )}
            </div>
          </div>
        )
      )}

      {/* ── Services tab ──────────────────────────────────────── */}
      {tab === 'services' && (
        services.length === 0 ? (
          <div key={tabKey} className="tab-enter">
            {isOwner ? (
              <Link href="/tailor/pricing"
                className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all group">
                <div className="text-5xl mb-3">💼</div>
                <p className="font-semibold text-gray-700 group-hover:text-violet-800 mb-1">List your services</p>
                <p className="text-sm text-gray-400 mb-4 text-center max-w-xs">Add your services with pricing so customers know what to expect</p>
                <span className="bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl group-hover:bg-violet-800 transition-colors">+ Add services</span>
              </Link>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-3">💼</div>
                <p className="text-gray-500">No services listed yet</p>
                <Link href={`/orders/new?tailor=${tailor.id}`}
                  className="inline-flex items-center gap-2 mt-4 bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-violet-800 transition-colors">
                  Request a custom order
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div key={tabKey} className="tab-enter space-y-4">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-violet-200 hover:shadow-sm card-lift transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xl">{SERVICE_ICONS[service.service_type]}</span>
                      <h3 className="font-semibold text-gray-900">{service.title}</h3>
                      <Badge variant="default">{SERVICE_LABELS[service.service_type]}</Badge>
                    </div>
                    {service.description && <p className="text-sm text-gray-600 mb-3">{service.description}</p>}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={14} /> {service.min_days}–{service.max_days} days</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-violet-700">{formatCurrency(service.base_price)}</div>
                    {service.price_negotiable && <div className="text-xs text-amber-600 font-medium mt-0.5">Negotiable</div>}
                    {!isOwner && (
                      <Link href={`/orders/new?tailor=${tailor.id}&service=${service.id}`}
                        className="mt-3 block bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-violet-800 transition-colors text-center">
                        Book this
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Reviews tab ───────────────────────────────────────── */}
      {tab === 'reviews' && (
        ratings.length === 0 ? (
          <div key={tabKey} className="tab-enter text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">⭐</div>
            <p className="font-semibold text-gray-700 mb-1">No reviews yet</p>
            {!isOwner && (
              <p className="text-sm text-gray-400">Complete an order to leave a review</p>
            )}
          </div>
        ) : (
          <div key={tabKey} className="tab-enter space-y-4">
            {/* Rating summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-black text-gray-900">{tailor.avg_rating.toFixed(1)}</div>
                <StarRating value={Math.round(tailor.avg_rating)} readonly size="sm" />
                <div className="text-xs text-gray-500 mt-1">{ratings.length} review{ratings.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            {ratings.map((rating) => (
              <div key={rating.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm">
                      {rating.reviewer?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rating.reviewer?.full_name || 'Customer'}</p>
                      <p className="text-xs text-gray-400">{formatDate(rating.created_at)}</p>
                    </div>
                  </div>
                  <StarRating value={rating.rating} readonly size="sm" />
                </div>
                {rating.comment && <p className="text-sm text-gray-600 leading-relaxed mt-2">{rating.comment}</p>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
