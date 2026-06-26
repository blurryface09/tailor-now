'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, Trash2, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Review {
  id: string
  order_id: string
  reviewer_id: string
  reviewee_id: string
  reviewer_role: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: { full_name: string; email: string } | null
  order: { title: string; tailor: { business_name: string } | null } | null
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13} className={i <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-700">{value}.0</span>
    </div>
  )
}

export function AdminReviewsClient({ reviews: initial }: { reviews: Review[] }) {
  const supabase = createClient()
  const [reviews, setReviews] = useState(initial)
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'tailor'>('all')

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return
    const { error } = await supabase.from('ratings').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setReviews(r => r.filter(x => x.id !== id))
    toast.success('Review deleted')
  }

  const filtered = reviews.filter(r => {
    const matchesSearch = !search ||
      r.reviewer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase()) ||
      r.order?.tailor?.business_name?.toLowerCase().includes(search.toLowerCase())
    const matchesRating = ratingFilter === null || r.rating === ratingFilter
    const matchesRole = roleFilter === 'all' || r.reviewer_role === roleFilter
    return matchesSearch && matchesRating && matchesRole
  })

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'
  const lowRatings = reviews.filter(r => r.rating <= 2).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews &amp; Ratings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{reviews.length} reviews · avg {avgRating}★</p>
        </div>
        <input
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
          placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {lowRatings > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-800 font-medium">{lowRatings} review{lowRatings > 1 ? 's' : ''} rated 1–2 stars — consider reviewing</p>
          <button onClick={() => setRatingFilter(ratingFilter === 1 ? null : 1)} className="ml-auto text-xs text-red-600 font-semibold hover:underline">
            Filter low ratings
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setRoleFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${roleFilter === 'all' ? 'bg-violet-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'}`}>
          All roles
        </button>
        <button onClick={() => setRoleFilter('customer')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${roleFilter === 'customer' ? 'bg-violet-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'}`}>
          By customers
        </button>
        <button onClick={() => setRoleFilter('tailor')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${roleFilter === 'tailor' ? 'bg-violet-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'}`}>
          By tailors
        </button>
        <div className="border-l border-gray-200 mx-1" />
        {[5, 4, 3, 2, 1].map(n => (
          <button key={n} onClick={() => setRatingFilter(ratingFilter === n ? null : n)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${ratingFilter === n ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300'}`}>
            {n}<Star size={12} className={ratingFilter === n ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'} />
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">No reviews found</div>
        )}
        {filtered.map(review => (
          <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                  {review.reviewer?.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{review.reviewer?.full_name || 'Unknown'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${review.reviewer_role === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                      {review.reviewer_role}
                    </span>
                    {review.order?.tailor && (
                      <span className="text-xs text-gray-400">→ {review.order.tailor.business_name}</span>
                    )}
                  </div>
                  <Stars value={review.rating} />
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                  )}
                  {!review.comment && (
                    <p className="text-xs text-gray-400 mt-1 italic">No comment left</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(review.created_at)}</span>
                <button onClick={() => deleteReview(review.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete review">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
