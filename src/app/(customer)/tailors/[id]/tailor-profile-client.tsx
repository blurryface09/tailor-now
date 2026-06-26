'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Star, CheckCircle, Clock, Scissors, MessageSquare, Calendar, ShoppingBag } from 'lucide-react'
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
}

const SERVICE_ICONS: Record<string, string> = {
  custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

export function TailorProfileClient({ tailor, services, portfolio, ratings }: Props) {
  const [tab, setTab] = useState<'portfolio' | 'services' | 'reviews'>('portfolio')
  const [tabKey, setTabKey] = useState(0)

  function switchTab(t: 'portfolio' | 'services' | 'reviews') {
    setTab(t)
    setTabKey(k => k + 1)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="h-40 bg-gradient-to-br from-violet-600 via-violet-700 to-violet-900 relative">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}} />
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-violet-700 text-3xl font-bold">
              {tailor.business_name?.[0]?.toUpperCase() || '✂'}
            </div>
            <div className="flex-1 sm:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{tailor.business_name}</h1>
                {tailor.is_verified && (
                  <Badge variant="default"><CheckCircle size={12} /> Verified</Badge>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-0.5">{tailor.profile?.full_name}</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/chat?tailor=${tailor.id}`}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-violet-700 text-violet-700 rounded-xl text-sm font-medium hover:bg-violet-50 transition-colors">
                <MessageSquare size={16} /> Message
              </Link>
              <Link href={`/orders/new?tailor=${tailor.id}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-700 text-white rounded-xl text-sm font-medium hover:bg-violet-800 transition-colors">
                <ShoppingBag size={16} /> Book Now
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-gray-900">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                {tailor.avg_rating?.toFixed(1) || '—'}
              </div>
              <div className="text-xs text-gray-500">{tailor.total_reviews} reviews</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{tailor.total_orders}</div>
              <div className="text-xs text-gray-500">Orders done</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{Math.round(tailor.completion_rate || 0)}%</div>
              <div className="text-xs text-gray-500">Completion rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {tailor.response_time_hours ? `~${tailor.response_time_hours}h` : '< 1h'}
              </div>
              <div className="text-xs text-gray-500">Response time</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={14} /> {tailor.city}, {tailor.state}</span>
            {tailor.delivery_types?.includes('pickup_delivery') && (
              <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Pickup & Delivery</span>
            )}
            {tailor.delivery_types?.includes('visit_shop') && (
              <span className="flex items-center gap-1"><Scissors size={14} /> Visit Shop</span>
            )}
          </div>

          {tailor.bio && <p className="text-sm text-gray-600 mt-4 leading-relaxed">{tailor.bio}</p>}

          {/* Specialty chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(tailor.specialties || []).map(s => (
              <span key={s} className="flex items-center gap-1.5 text-xs bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full font-medium">
                {SERVICE_ICONS[s]} {SERVICE_LABELS[s]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6">
        {(['portfolio', 'services', 'reviews'] as const).map(t => (
          <button key={t} onClick={() => switchTab(t)}
            className={cn('flex-1 py-2.5 text-sm font-medium rounded-lg capitalize transition-all duration-200', tab === t ? 'bg-violet-700 text-white shadow-sm scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}>
            {t === 'portfolio' ? `Portfolio (${portfolio.length})` : t === 'services' ? `Services (${services.length})` : `Reviews (${ratings.length})`}
          </button>
        ))}
      </div>

      {/* Portfolio tab */}
      {tab === 'portfolio' && (
        portfolio.length === 0 ? (
          <div key={tabKey} className="tab-enter text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">📸</div>
            <p className="text-gray-500">No portfolio items yet</p>
          </div>
        ) : (
          <div key={tabKey} className="tab-enter grid grid-cols-2 md:grid-cols-3 gap-4">
            {portfolio.map((item) => (
              <div key={item.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md card-lift transition-all">
                <div className="aspect-square bg-violet-100 relative overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">✂️</div>
                  )}
                  {item.service_type && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
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
          </div>
        )
      )}

      {/* Services tab */}
      {tab === 'services' && (
        services.length === 0 ? (
          <div key={tabKey} className="tab-enter text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500">No services listed yet</p>
          </div>
        ) : (
          <div key={tabKey} className="tab-enter space-y-4">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-violet-200 card-lift transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
                    <div className="text-lg font-bold text-violet-700">
                      {formatCurrency(service.base_price)}
                    </div>
                    {service.price_negotiable && <div className="text-xs text-gray-400">Negotiable</div>}
                    <Link href={`/orders/new?tailor=${tailor.id}&service=${service.id}`}
                      className="mt-2 block bg-violet-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-violet-800 transition-colors text-center">
                      Order
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Reviews tab */}
      {tab === 'reviews' && (
        ratings.length === 0 ? (
          <div key={tabKey} className="tab-enter text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">⭐</div>
            <p className="text-gray-500">No reviews yet</p>
          </div>
        ) : (
          <div key={tabKey} className="tab-enter space-y-4">
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
                {rating.comment && <p className="text-sm text-gray-600 leading-relaxed">{rating.comment}</p>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
