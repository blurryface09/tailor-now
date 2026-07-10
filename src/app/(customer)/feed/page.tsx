'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { ImageUpload } from '@/components/ui/image-upload'
import { SERVICE_LABELS, formatRelativeTime } from '@/lib/utils'
import {
  Heart, MessageSquare, Send, ChevronLeft, ChevronRight,
  MapPin, Star, CheckCircle, Scissors, Sparkles, Share2,
  ShoppingBag, Lightbulb, Plus, X, Camera, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Post, PostComment, Profile, TailorProfile } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(price: number | null | undefined) {
  if (!price) return null
  return `₦${price.toLocaleString()}`
}

function extractTag(caption: string | null): { tag: string | null; body: string } {
  if (!caption) return { tag: null, body: '' }
  const m = caption.match(/^\[(.+?)\]\n([\s\S]*)$/)
  return m ? { tag: m[1], body: m[2] } : { tag: null, body: caption }
}

function sharePost(postId: string, title?: string | null) {
  const url = `${window.location.origin}/p/${postId}`
  if (navigator.share) {
    navigator.share({ title: title || 'Check this out on TailorNow', url }).catch(() => null)
  } else {
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied! 📋'))
  }
}

// ── Filter chips ──────────────────────────────────────────────────────────────
const CHIPS = [
  { label: 'All', value: '', icon: '' },
  { label: 'Products', value: 'product', icon: '🛍️' },
  { label: 'Inspo', value: 'inspo', icon: '💡' },
  { label: 'Ankara', value: 'ankara', icon: '🌍' },
  { label: 'Bridal', value: 'bridal', icon: '💍' },
  { label: 'Street', value: 'street', icon: '👟' },
  { label: 'Alte', value: 'alte', icon: '🎨' },
  { label: 'Trending', value: 'trends', icon: '🔥' },
]

// ── Demo posts ────────────────────────────────────────────────────────────────
const DEMO_PRODUCTS = [
  {
    id: 'd1', post_type: 'product' as const,
    title: 'Midnight Blue Co-ord Set',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1000&fit=crop&q=85',
    creative: 'Zara Couture Lagos', city: 'Lagos', rating: 4.9, tag: '🎨 Alte Style',
    caption: 'Bold, unapologetic, dripping in colour. Full custom fit available — DM for your measurements.',
    likes: 312, comments: 41, isAdmin: true,
  },
  {
    id: 'd2', post_type: 'product' as const,
    title: 'Beaded Bridal Gown',
    price: 280000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1000&fit=crop&q=85',
    creative: 'House of Adaeze', city: 'Abuja', rating: 4.8, tag: '💍 Bridal',
    caption: '3 weeks of handwork, every bead placed with intention. Your dream wedding look starts here.',
    likes: 521, comments: 68, isAdmin: false,
  },
  {
    id: 'd3', post_type: 'product' as const,
    title: 'Power Suit – Tailored',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=85',
    creative: 'StyleHaus by Temi', city: 'Lagos', rating: 4.7, tag: '✨ New Trends',
    caption: 'Power dressing, Lagos edition. You don\'t need Paris when you have Lagos creatives.',
    likes: 389, comments: 44, isAdmin: false,
  },
  {
    id: 'd4', post_type: 'product' as const,
    title: 'Ankara Two-Piece',
    price: null,
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1000&fit=crop&q=85',
    creative: 'Kente Republic', city: 'Port Harcourt', rating: 4.6, tag: '🌍 Ankara',
    caption: 'Ankara never goes out of style. It evolves. From ceremonies to street — every thread carries culture.',
    likes: 445, comments: 53, isAdmin: false,
  },
]

const DEMO_INSPOS = [
  {
    id: 'i1', post_type: 'inspo' as const,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop&q=85',
    user: 'Chinwe A.', caption: 'Looking for something like this for my introduction ceremony next month 🙏🏾 Who can make this?',
    likes: 89, comments: 22,
  },
  {
    id: 'i2', post_type: 'inspo' as const,
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=1000&fit=crop&q=85',
    user: 'Adaora O.', caption: 'Saw this on Pinterest and I need it made in Aso-oke for my traditional wedding 👑',
    likes: 134, comments: 31,
  },
]

// ── ProductCard ───────────────────────────────────────────────────────────────
type DemoProduct = typeof DEMO_PRODUCTS[number]

function DemoProductCard({ post, idx }: { post: DemoProduct; idx: number }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes)
  const [showComments, setShowComments] = useState(false)
  const priceLabel = formatPrice(post.price)

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden group hover:border-violet-200 hover:shadow-lg transition-all duration-300 shadow-sm"
      style={{ animation: 'fade-up 0.5s ease both', animationDelay: `${idx * 80}ms` }}>
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
        <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-12 pointer-events-none" />

        {/* Category chip */}
        <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full">{post.tag}</div>

        {/* Price badge */}
        {priceLabel ? (
          <div className="absolute top-3.5 right-3.5 bg-amber-400 text-black text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/40">
            {priceLabel}
          </div>
        ) : (
          <div className="absolute top-3.5 right-3.5 bg-white/10 backdrop-blur-md border border-white/20 text-white/70 text-[10px] font-semibold px-2.5 py-1.5 rounded-full">
            Chat for price
          </div>
        )}

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0 pr-3">
              {!post.isAdmin ? (
                <>
                  <p className="text-white font-bold text-sm truncate">{post.creative}</p>
                  <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5"><MapPin size={9} />{post.city} · ⭐ {post.rating}</p>
                </>
              ) : (
                <span className="text-xs font-bold text-violet-400 flex items-center gap-1"><Sparkles size={10} /> TailorNow Pick</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setLiked(v => !v); setLikes(v => liked ? v - 1 : v + 1) }} className="flex flex-col items-center gap-0.5">
                <Heart size={20} className={`transition-all duration-200 ${liked ? 'fill-red-500 text-red-500 scale-110' : 'text-white/80 hover:text-red-400'}`} />
                <span className="text-[10px] text-white/60">{likes}</span>
              </button>
              <button onClick={() => setShowComments(v => !v)} className="flex flex-col items-center gap-0.5">
                <MessageSquare size={20} className="text-white/80 hover:text-violet-300 transition-colors" />
                <span className="text-[10px] text-white/60">{post.comments}</span>
              </button>
              <button onClick={() => sharePost(post.id, post.title)} className="flex flex-col items-center gap-0.5">
                <Share2 size={18} className="text-white/80 hover:text-amber-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 pt-3.5 pb-4">
        {post.title && <p className="font-bold text-zinc-900 text-sm mb-1">{post.title}</p>}
        <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">{post.caption}</p>

        {/* CTAs */}
        <div className="flex gap-2 mt-3.5">
          <Link href="/browse"
            className="flex-1 flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs py-2.5 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/25">
            <ShoppingBag size={12} /> Order this fit
          </Link>
          <Link href="/browse"
            className="flex items-center gap-1 bg-zinc-50 hover:bg-violet-50 border border-zinc-200 hover:border-violet-300 text-zinc-700 hover:text-violet-600 font-semibold text-xs px-3.5 py-2.5 rounded-2xl transition-all">
            <Scissors size={11} /> Custom
          </Link>
          <Link href="/browse"
            className="flex items-center gap-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-semibold text-xs px-3.5 py-2.5 rounded-2xl transition-all">
            <MessageSquare size={11} /> Chat
          </Link>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-zinc-100 px-4 py-3">
          <p className="text-xs text-zinc-500 text-center mb-2">Sign in to join the conversation</p>
          <Link href="/login" className="block text-center text-xs text-violet-600 font-semibold">Sign in →</Link>
        </div>
      )}
    </div>
  )
}

// ── InspoCard (demo) ──────────────────────────────────────────────────────────
type DemoInspo = typeof DEMO_INSPOS[number]

function DemoInspoCard({ post, idx }: { post: DemoInspo; idx: number }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes)

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden group hover:border-fuchsia-200 hover:shadow-lg transition-all duration-300 shadow-sm"
      style={{ animation: 'fade-up 0.5s ease both', animationDelay: `${idx * 80}ms` }}>
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
        <img src={post.image} alt="Inspiration" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-12 pointer-events-none" />

        {/* Inspo badge */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 bg-fuchsia-500/20 backdrop-blur-md border border-fuchsia-500/30 text-fuchsia-300 text-xs font-bold px-3 py-1.5 rounded-full">
          <Lightbulb size={10} /> Inspo
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className="text-white font-bold text-sm">{post.user}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setLiked(v => !v); setLikes(v => liked ? v - 1 : v + 1) }} className="flex flex-col items-center gap-0.5">
                <Heart size={20} className={`transition-all duration-200 ${liked ? 'fill-red-500 text-red-500 scale-110' : 'text-white/80 hover:text-red-400'}`} />
                <span className="text-[10px] text-white/60">{likes}</span>
              </button>
              <button className="flex flex-col items-center gap-0.5">
                <MessageSquare size={20} className="text-white/80 hover:text-violet-300 transition-colors" />
                <span className="text-[10px] text-white/60">{post.comments}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pt-3.5 pb-4">
        <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">{post.caption}</p>
        <div className="flex items-center justify-between mt-3.5">
          <span className="text-xs text-zinc-400">Just now</span>
          <Link href="/browse"
            className="flex items-center gap-1.5 text-xs font-bold text-fuchsia-600 hover:text-fuchsia-500 transition-colors">
            Find a creative <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Real PostCard ─────────────────────────────────────────────────────────────
function PostCard({
  post, userId, userName, onLike, onFollow, following, idx,
}: {
  post: Post; userId: string | null; userName: string
  onLike: (id: string, liked: boolean) => void
  onFollow: (uid: string, isFollowing: boolean) => void
  following: Set<string>
  idx: number
}) {
  const supabase = createClient()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<(PostComment & { author: Profile })[]>([])
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  const isProduct = (post.post_type ?? 'product') === 'product'
  const isInspo = post.post_type === 'inspo'
  const isAdminPost = !post.creative_id
  const creativeUserId = post.creative?.user_id || post.user_id
  const isOwnPost = userId === post.user_id
  const isFollowing = following.has(creativeUserId)
  const authorName = isAdminPost ? 'TailorNow' : (post.creative?.business_name || post.author?.full_name)
  const { tag: captionTag, body: captionBody } = extractTag(post.caption)
  const priceLabel = formatPrice(post.price)

  const loadComments = async () => {
    const { data } = await supabase.from('post_comments')
      .select('*, author:profiles(*)')
      .eq('post_id', post.id).order('created_at', { ascending: true }).limit(20)
    setComments(data || [])
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) { toast.error('Sign in to comment'); return }
    if (!commentText.trim()) return
    setPosting(true)
    await supabase.from('post_comments').insert({ post_id: post.id, user_id: userId, content: commentText.trim() })
    // Notify post owner (skip if self-comment)
    if (post.user_id && post.user_id !== userId) {
      supabase.from('notifications').insert({
        user_id: post.user_id,
        type: 'post_comment',
        title: `${userName || 'Someone'} commented on your post`,
        body: commentText.trim().slice(0, 100),
        data: { post_id: post.id },
      }).then(() => null)
    }
    setCommentText(''); setPosting(false); loadComments()
  }

  const borderColor = isInspo ? 'hover:border-fuchsia-200' : 'hover:border-violet-200'

  return (
    <div
      className={`bg-white border border-zinc-200 rounded-3xl overflow-hidden group ${borderColor} hover:shadow-lg transition-all duration-300 shadow-sm`}
      style={{ animation: 'fade-up 0.5s ease both', animationDelay: `${idx * 80}ms` }}
    >
      {post.image_urls.length > 0 && (
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
          <img
            src={post.image_urls[imgIdx]}
            alt={post.title || captionBody || 'Post'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-12 pointer-events-none" />

          {/* Category / inspo badge */}
          {isInspo ? (
            <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 bg-fuchsia-500/20 backdrop-blur-md border border-fuchsia-500/30 text-fuchsia-300 text-xs font-bold px-3 py-1.5 rounded-full">
              <Lightbulb size={10} /> Inspo
            </div>
          ) : (captionTag || post.service_type) ? (
            <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {captionTag || SERVICE_LABELS[post.service_type!]}
            </div>
          ) : null}

          {/* Price badge (products only) */}
          {isProduct && (
            priceLabel ? (
              <div className="absolute top-3.5 right-3.5 bg-amber-400 text-black text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/40 animate-[bounce-in_0.3s_ease]">
                {priceLabel}
              </div>
            ) : (
              <div className="absolute top-3.5 right-3.5 bg-white/10 backdrop-blur-md border border-white/20 text-white/70 text-[10px] font-semibold px-2.5 py-1.5 rounded-full">
                Chat for price
              </div>
            )
          )}

          {/* Admin badge */}
          {isAdminPost && (
            <div className="absolute top-3.5 right-3.5 bg-violet-600/80 backdrop-blur-md border border-violet-500/40 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Scissors size={9} /> TailorNow
            </div>
          )}

          {/* Multi-image nav */}
          {post.image_urls.length > 1 && (
            <>
              {imgIdx > 0 && (
                <button onClick={() => setImgIdx(i => i - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 border border-white/10">
                  <ChevronLeft size={14} />
                </button>
              )}
              {imgIdx < post.image_urls.length - 1 && (
                <button onClick={() => setImgIdx(i => i + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 border border-white/10">
                  <ChevronRight size={14} />
                </button>
              )}
              <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 flex gap-1.5">
                {post.image_urls.map((_, i) => (
                  <div key={i} className={`rounded-full transition-all ${i === imgIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
                ))}
              </div>
            </>
          )}

          {/* Bottom overlay: author + actions */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10">
            <div className="flex items-end justify-between">
              <div className="flex-1 min-w-0 pr-3">
                {!isAdminPost && (
                  <>
                    {isProduct ? (
                      <Link href={`/tailors/${post.creative_id}`} className="text-white font-bold text-sm hover:text-violet-300 transition-colors truncate block">
                        {authorName}
                      </Link>
                    ) : (
                      <p className="text-white font-bold text-sm truncate">{post.author?.full_name || authorName}</p>
                    )}
                    {post.creative?.city && (
                      <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin size={9} />{post.creative.city}
                        {post.creative.avg_rating && ` · ⭐ ${post.creative.avg_rating.toFixed(1)}`}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => onLike(post.id, post.liked_by_me || false)} className="flex flex-col items-center gap-0.5 group/like">
                  <Heart size={20} className={`transition-all duration-200 ${post.liked_by_me ? 'fill-red-500 text-red-500 scale-110' : 'text-white/80 group-hover/like:text-red-400'}`} />
                  <span className="text-[10px] text-white/60">{post.likes_count}</span>
                </button>
                <button onClick={() => { if (!showComments) loadComments(); setShowComments(v => !v) }} className="flex flex-col items-center gap-0.5 group/msg">
                  <MessageSquare size={20} className="text-white/80 group-hover/msg:text-violet-300 transition-colors" />
                  <span className="text-[10px] text-white/60">{post.comments_count}</span>
                </button>
                <button onClick={() => sharePost(post.id, post.title)} className="flex flex-col items-center gap-0.5 group/share">
                  <Share2 size={18} className="text-white/80 group-hover/share:text-amber-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card body */}
      <div className="px-4 pt-3.5 pb-4">
        {post.title && <p className="font-bold text-zinc-900 text-sm mb-1">{post.title}</p>}
        {captionBody && <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">{captionBody}</p>}

        {isProduct && !isAdminPost ? (
          <div className="flex gap-2 mt-3.5">
            <Link href={`/orders/new?tailor=${post.creative_id}${post.id ? `&post=${post.id}` : ''}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs py-2.5 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/25">
              <ShoppingBag size={12} /> Order this fit
            </Link>
            <Link href={`/orders/new?tailor=${post.creative_id}&custom=true`}
              className="flex items-center gap-1 bg-zinc-50 hover:bg-violet-50 border border-zinc-200 hover:border-violet-300 text-zinc-700 hover:text-violet-600 font-semibold text-xs px-3.5 py-2.5 rounded-2xl transition-all">
              <Scissors size={11} /> Custom
            </Link>
            {!isOwnPost && userId && (
              <button onClick={() => onFollow(creativeUserId, isFollowing)}
                className={`flex items-center text-xs font-semibold px-3 py-2.5 rounded-2xl border transition-all ${isFollowing ? 'border-zinc-200 text-zinc-400 hover:text-red-500' : 'border-violet-300 text-violet-600 hover:bg-violet-50'}`}>
                {isFollowing ? '✓' : '+'}
              </button>
            )}
          </div>
        ) : isInspo ? (
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-zinc-600">{formatRelativeTime(post.created_at)}</span>
            <Link href="/browse" className="flex items-center gap-1.5 text-xs font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
              Find a creative <ArrowRight size={11} />
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-zinc-600">{formatRelativeTime(post.created_at)}</span>
            <span className="text-xs font-bold text-violet-400 flex items-center gap-1"><Sparkles size={10} /> TailorNow Original</span>
          </div>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-zinc-100 px-4 py-3">
          <div className="space-y-3 max-h-44 overflow-y-auto scrollbar-hide mb-3">
            {comments.length === 0 && <p className="text-xs text-zinc-500 text-center py-2">No comments yet — be first!</p>}
            {comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs flex-shrink-0">
                  {c.author?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-900">{c.author?.full_name} </span>
                  <span className="text-xs text-zinc-500">{c.content}</span>
                </div>
              </div>
            ))}
          </div>
          {userId ? (
            <form onSubmit={submitComment} className="flex gap-2">
              <input
                className="flex-1 text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-violet-500/50 transition-colors"
                placeholder="Add a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button type="submit" disabled={!commentText.trim() || posting}
                className="p-2 text-violet-600 hover:bg-violet-50 rounded-xl transition-colors disabled:opacity-40">
                <Send size={15} />
              </button>
            </form>
          ) : (
            <Link href="/login" className="block text-center text-xs text-violet-600 font-semibold">Sign in to comment →</Link>
          )}
        </div>
      )}
    </div>
  )
}

// ── Post Inspo Modal ──────────────────────────────────────────────────────────
function InspoModal({ userId, onClose, onPosted }: {
  userId: string; onClose: () => void; onPosted: () => void
}) {
  const supabase = createClient()
  const [images, setImages] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (images.length === 0) { toast.error('Add at least one photo'); return }
    setSaving(true)
    const { error } = await supabase.from('posts').insert({
      user_id: userId,
      creative_id: null,
      caption: caption.trim() || null,
      image_urls: images,
      post_type: 'inspo',
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Inspo posted! 🎉')
    onPosted()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0e0e10] border border-white/[0.09] rounded-t-3xl p-6 shadow-2xl"
        style={{ animation: 'fade-up 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-white text-lg flex items-center gap-2"><Lightbulb size={18} className="text-fuchsia-400" /> Post your inspo</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Share a style you love — creatives can make it for you</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <ImageUpload
            bucket="portfolio"
            folder={`inspo/${userId}`}
            value={images}
            onChange={setImages}
            maxFiles={4}
            label="Photos"
            hint="Screenshot, Pinterest save, anything you love"
          />
          <div>
            <textarea
              className="w-full rounded-2xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-fuchsia-500/50 transition-all resize-none"
              rows={3}
              placeholder="What do you love about this look? What occasion is it for?"
              value={caption}
              onChange={e => setCaption(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-white/[0.1] text-zinc-400 hover:text-white transition-colors text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={images.length === 0 || saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-fuchsia-500/30 text-sm">
              {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><Lightbulb size={15} /> Post Inspo</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Feed Page ────────────────────────────────────────────────────────────
export default function FeedPage() {
  const supabase = createClient()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [isCreative, setIsCreative] = useState(false)
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeChip, setActiveChip] = useState('')
  const [showInspoModal, setShowInspoModal] = useState(false)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      const [followsRes, creativeRes, profileRes] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
        supabase.from('tailor_profiles').select('id').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      ])
      setFollowing(new Set((followsRes.data || []).map((f: any) => f.following_id)))
      setIsCreative(!!creativeRes.data)
      setUserName(profileRes.data?.full_name || '')
    }
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_user_id_fkey(*), creative:tailor_profiles(*, user_id, business_name, city, state, avg_rating)')
      .order('created_at', { ascending: false })
      .limit(40)
    if (postsData && user) {
      const [{ data: liked }, { data: follows }] = await Promise.all([
        supabase.from('post_likes').select('post_id').eq('user_id', user.id),
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
      ])
      const likedSet = new Set((liked || []).map((l: any) => l.post_id))
      const followedSet = new Set((follows || []).map((f: any) => f.following_id))
      const withMeta = postsData.map((p: any) => ({ ...p, liked_by_me: likedSet.has(p.id) }))
      // Followed creatives' posts surface first
      withMeta.sort((a: any, b: any) => {
        const aFollowed = followedSet.has(a.creative?.user_id) ? 1 : 0
        const bFollowed = followedSet.has(b.creative?.user_id) ? 1 : 0
        return bFollowed - aFollowed
      })
      setPosts(withMeta)
    } else {
      setPosts(postsData || [])
    }
    setLoading(false)
  }

  const handleLike = async (postId: string, liked: boolean) => {
    if (!userId) { toast.error('Sign in to like posts'); return }
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, liked_by_me: !liked, likes_count: liked ? p.likes_count - 1 : p.likes_count + 1 }
      : p))
    if (liked) await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    else await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
  }

  const handleFollow = async (creativeUserId: string, isFollowing: boolean) => {
    if (!userId) { toast.error('Sign in to follow'); return }
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', creativeUserId)
      setFollowing(prev => { const s = new Set(prev); s.delete(creativeUserId); return s })
    } else {
      await supabase.from('follows').insert({ follower_id: userId, following_id: creativeUserId })
      setFollowing(prev => new Set([...prev, creativeUserId]))
      // Notify the creative
      supabase.from('notifications').insert({
        user_id: creativeUserId,
        type: 'new_follower',
        title: `${userName || 'Someone'} started following you`,
        body: 'They\'ll see your posts in their feed',
        data: {},
      }).then(() => null)
      toast.success('Following!')
    }
  }

  const filteredPosts = posts.filter(p => {
    if (!activeChip) return true
    if (activeChip === 'product') return (p.post_type ?? 'product') === 'product'
    if (activeChip === 'inspo') return p.post_type === 'inspo'
    const { tag } = extractTag(p.caption)
    const t = (tag || '').toLowerCase()
    if (activeChip === 'ankara') return t.includes('ankara') || (p.service_type as string) === 'ankara'
    if (activeChip === 'bridal') return t.includes('bridal') || p.service_type === 'bridal'
    if (activeChip === 'street') return t.includes('street')
    if (activeChip === 'alte') return t.includes('alte')
    if (activeChip === 'trends') return t.includes('trend')
    return false
  })

  const showDemos = posts.length === 0 && !activeChip
  const demoMixed = [...DEMO_PRODUCTS.slice(0, 2), DEMO_INSPOS[0], ...DEMO_PRODUCTS.slice(2), DEMO_INSPOS[1]]

  return (
    <div className="min-h-screen">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 -left-32 w-80 h-80 bg-violet-400/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-72 h-72 bg-fuchsia-400/6 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-1/4 w-60 h-60 bg-amber-400/5 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <div className="relative max-w-lg mx-auto px-4 py-5 pb-28">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <ShoppingBag size={18} className="text-amber-500" /> The Feed
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Shop outfits • Post inspos • Get made</p>
          </div>
          {userId && isCreative ? (
            <Link href="/tailor/posts"
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-lg shadow-violet-500/25">
              <Plus size={13} /> Post
            </Link>
          ) : userId ? (
            <button onClick={() => setShowInspoModal(true)}
              className="flex items-center gap-1.5 bg-fuchsia-50 hover:bg-fuchsia-100 border border-fuchsia-300 text-fuchsia-600 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all">
              <Lightbulb size={13} /> Post inspo
            </button>
          ) : (
            <Link href="/browse" className="text-xs font-semibold text-violet-600 hover:text-violet-700 border border-violet-300 px-3 py-1.5 rounded-full transition-colors">
              Browse all →
            </Link>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-5">
          {CHIPS.map(chip => (
            <button key={chip.value} onClick={() => setActiveChip(chip.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeChip === chip.value
                  ? chip.value === 'inspo'
                    ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30'
                    : 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50'
              }`}>
              {chip.icon} {chip.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            <p className="text-zinc-600 text-sm">Loading the feed…</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Real posts */}
            {filteredPosts.map((post, i) => (
              <PostCard key={post.id} post={post} userId={userId} userName={userName} onLike={handleLike} onFollow={handleFollow} following={following} idx={i} />
            ))}

            {/* Demo showroom when empty */}
            {showDemos && (
              <>
                <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3">
                  <Sparkles size={16} className="text-violet-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-violet-700">Feed Preview</p>
                    <p className="text-xs text-violet-500">Real products and inspos from the community will appear here</p>
                  </div>
                </div>
                {demoMixed.map((p, i) =>
                  p.post_type === 'inspo'
                    ? <DemoInspoCard key={p.id} post={p as DemoInspo} idx={i} />
                    : <DemoProductCard key={p.id} post={p as DemoProduct} idx={i} />
                )}
              </>
            )}

            {/* Empty chip filter */}
            {activeChip && filteredPosts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 shadow-sm">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-zinc-500 text-sm">Nothing here yet</p>
                <button onClick={() => setActiveChip('')} className="mt-3 text-xs text-violet-600 hover:text-violet-700 transition-colors">
                  View all posts →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Post button (guests) */}
      {!userId && (
        <div className="fixed bottom-6 right-5 z-40">
          <Link href="/signup"
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black text-sm px-5 py-3.5 rounded-2xl shadow-2xl shadow-amber-500/40 transition-all hover:scale-[1.04] active:scale-[0.97]">
            <Camera size={16} /> Get started free
          </Link>
        </div>
      )}

      {/* Inspo modal */}
      {showInspoModal && userId && (
        <InspoModal userId={userId} onClose={() => setShowInspoModal(false)} onPosted={init} />
      )}
    </div>
  )
}
