'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Heart, MessageSquare, Share2, ShoppingBag,
  Scissors, MapPin, Star, CheckCircle, ChevronLeft, ChevronRight,
  Send, ExternalLink, Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { SERVICE_LABELS, formatRelativeTime } from '@/lib/utils'
import type { Post, PostComment, Profile } from '@/types'

export function ProductClient() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [post, setPost] = useState<Post | null>(null)
  const [related, setRelated] = useState<Post[]>([])
  const [comments, setComments] = useState<(PostComment & { author: Profile })[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAllComments, setShowAllComments] = useState(false)

  useEffect(() => { init() }, [id])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_user_id_fkey(*), creative:tailor_profiles(*, user_id, business_name, city, state, avg_rating, total_orders, is_verified)')
      .eq('id', id)
      .single()

    if (!data) { setLoading(false); return }
    setPost(data)
    setLikeCount(data.likes_count)

    if (user) {
      const { data: likeData } = await supabase.from('post_likes').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle()
      setLiked(!!likeData)
    }

    // Load comments
    const { data: commentsData } = await supabase.from('post_comments')
      .select('*, author:profiles(*)')
      .eq('post_id', id).order('created_at', { ascending: true }).limit(30)
    setComments(commentsData || [])

    // Load related posts from same creative
    if (data.creative_id) {
      const { data: relatedData } = await supabase.from('posts')
        .select('*').eq('creative_id', data.creative_id).neq('id', id)
        .eq('post_type', 'product').order('created_at', { ascending: false }).limit(4)
      setRelated(relatedData || [])
    }

    setLoading(false)
  }

  const toggleLike = async () => {
    if (!userId) { toast.error('Sign in to like'); return }
    setLiked(v => !v)
    setLikeCount(v => liked ? v - 1 : v + 1)
    if (liked) await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', userId)
    else await supabase.from('post_likes').insert({ post_id: id, user_id: userId })
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) { toast.error('Sign in to comment'); return }
    if (!commentText.trim()) return
    setPosting(true)
    const { data: newComment } = await supabase.from('post_comments')
      .insert({ post_id: id, user_id: userId, content: commentText.trim() })
      .select('*, author:profiles(*)').single()
    if (newComment) setComments(prev => [...prev, newComment])
    setCommentText(''); setPosting(false)
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: post?.title || 'Check this out on TailorNow', url }).catch(() => null)
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success('Link copied! 📋'))
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  )

  if (!post) return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center gap-4">
      <div className="text-5xl">🔍</div>
      <p className="text-zinc-400">Product not found</p>
      <Link href="/feed" className="text-violet-400 text-sm hover:text-violet-300">← Back to feed</Link>
    </div>
  )

  const priceLabel = post.price ? `₦${Number(post.price).toLocaleString()}` : null
  const authorName = post.creative?.business_name || post.author?.full_name || 'TailorNow'
  const isAdminPost = !post.creative_id

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-600/6 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[#09090B]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleShare}
            className="flex items-center gap-1.5 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all">
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-6">

        {/* Image carousel */}
        <div className="relative rounded-3xl overflow-hidden mb-6 shadow-2xl shadow-black/50" style={{ aspectRatio: '4/5', maxHeight: '75vh' }}>
          <img
            src={post.image_urls[imgIdx]}
            alt={post.title || 'Product'}
            className="w-full h-full object-cover"
            style={{ animation: 'fade-up 0.4s ease both' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Price badge */}
          {priceLabel && (
            <div className="absolute top-4 right-4 bg-amber-400 text-black text-sm font-black px-4 py-2 rounded-2xl shadow-xl shadow-amber-500/40"
              style={{ animation: 'bounce-in 0.4s 0.1s ease both' }}>
              {priceLabel}
            </div>
          )}
          {!priceLabel && post.post_type !== 'inspo' && (
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-xs font-semibold px-3 py-2 rounded-2xl">
              Chat for price
            </div>
          )}

          {/* Multi-image nav */}
          {post.image_urls.length > 1 && (
            <>
              {imgIdx > 0 && (
                <button onClick={() => setImgIdx(i => i - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md text-white rounded-full p-2.5 border border-white/10 hover:bg-black/80 transition-colors">
                  <ChevronLeft size={18} />
                </button>
              )}
              {imgIdx < post.image_urls.length - 1 && (
                <button onClick={() => setImgIdx(i => i + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md text-white rounded-full p-2.5 border border-white/10 hover:bg-black/80 transition-colors">
                  <ChevronRight size={18} />
                </button>
              )}
              {/* Dots */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {post.image_urls.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`rounded-full transition-all ${i === imgIdx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`} />
                ))}
              </div>
            </>
          )}

          {/* Thumbnail strip */}
          {post.image_urls.length > 1 && (
            <div className="absolute bottom-5 left-4 flex gap-2 max-w-[calc(100%-4rem)]">
              {post.image_urls.map((url, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${i === imgIdx ? 'border-amber-400 scale-105' : 'border-white/20 opacity-70 hover:opacity-100'}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product details */}
        <div style={{ animation: 'fade-up 0.5s 0.1s ease both' }}>
          {/* Title + social actions */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              {post.title && <h1 className="text-2xl font-black text-white leading-tight mb-1">{post.title}</h1>}
              {post.service_type && (
                <span className="inline-block bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {SERVICE_LABELS[post.service_type]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={toggleLike} className="flex flex-col items-center gap-1 group">
                <Heart size={22} className={`transition-all duration-200 ${liked ? 'fill-red-500 text-red-500 scale-110' : 'text-zinc-500 group-hover:text-red-400'}`} />
                <span className="text-[10px] text-zinc-600">{likeCount}</span>
              </button>
              <div className="flex flex-col items-center gap-1">
                <MessageSquare size={22} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-600">{post.comments_count}</span>
              </div>
            </div>
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-zinc-400 leading-relaxed mb-5 text-sm">{post.caption}</p>
          )}

          {/* CTAs */}
          {!isAdminPost && post.creative_id && (
            <div className="flex gap-2.5 mb-6" style={{ animation: 'fade-up 0.5s 0.15s ease both' }}>
              <Link
                href={`/orders/new?tailor=${post.creative_id}&post=${post.id}`}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black py-4 rounded-2xl transition-all hover:scale-[1.02] shadow-2xl shadow-amber-500/30 text-sm">
                <ShoppingBag size={16} /> Order this fit
              </Link>
              <Link
                href={`/orders/new?tailor=${post.creative_id}&custom=true`}
                className="flex items-center gap-2 bg-white/[0.07] hover:bg-violet-500/15 border border-white/[0.1] hover:border-violet-500/30 text-white hover:text-violet-300 font-bold py-4 px-5 rounded-2xl transition-all text-sm">
                <Scissors size={15} /> Custom
              </Link>
            </div>
          )}

          {/* Creative profile card */}
          {!isAdminPost && post.creative && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 mb-6 hover:border-violet-500/20 transition-colors group"
              style={{ animation: 'fade-up 0.5s 0.2s ease both' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-black text-lg shadow-lg">
                    {authorName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm">{authorName}</p>
                      {post.creative.is_verified && <CheckCircle size={13} className="text-violet-400" />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {post.creative.city && (
                        <span className="text-xs text-zinc-500 flex items-center gap-1"><MapPin size={10} />{post.creative.city}</span>
                      )}
                      {post.creative.avg_rating && (
                        <span className="text-xs text-zinc-500 flex items-center gap-1"><Star size={10} className="text-amber-400 fill-amber-400" />{post.creative.avg_rating.toFixed(1)}</span>
                      )}
                      {post.creative.total_orders != null && (
                        <span className="text-xs text-zinc-600">{post.creative.total_orders} orders</span>
                      )}
                    </div>
                  </div>
                </div>
                <Link href={`/tailors/${post.creative_id}`}
                  className="flex items-center gap-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 text-xs font-bold px-3 py-1.5 rounded-full transition-colors">
                  View <ExternalLink size={10} />
                </Link>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden"
            style={{ animation: 'fade-up 0.5s 0.25s ease both' }}>
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <p className="font-semibold text-white text-sm">{post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}</p>
              {comments.length > 3 && (
                <button onClick={() => setShowAllComments(v => !v)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  {showAllComments ? 'Show less' : `View all ${comments.length}`}
                </button>
              )}
            </div>

            <div className="divide-y divide-white/[0.04]">
              {comments.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-6">No comments yet — be first!</p>
              )}
              {(showAllComments ? comments : comments.slice(0, 3)).map(c => (
                <div key={c.id} className="flex gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs flex-shrink-0">
                    {c.author?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-white">{c.author?.full_name}</span>
                      <span className="text-[10px] text-zinc-600">{formatRelativeTime(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div className="px-4 py-3 border-t border-white/[0.06]">
              {userId ? (
                <form onSubmit={submitComment} className="flex gap-2">
                  <input
                    className="flex-1 text-sm bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                    placeholder="Add a comment…"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <button type="submit" disabled={!commentText.trim() || posting}
                    className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-colors">
                    <Send size={15} />
                  </button>
                </form>
              ) : (
                <div className="text-center py-2">
                  <Link href="/login" className="text-sm text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                    Sign in to comment →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div className="mt-8" style={{ animation: 'fade-up 0.5s 0.3s ease both' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-white">More from {authorName}</p>
                {post.creative_id && (
                  <Link href={`/tailors/${post.creative_id}`} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    View all →
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {related.map(r => (
                  <Link key={r.id} href={`/p/${r.id}`}
                    className="group relative rounded-2xl overflow-hidden border border-white/[0.07] hover:border-violet-500/20 transition-all hover:shadow-lg hover:shadow-violet-500/10">
                    <div className="aspect-square">
                      {r.image_urls[0] && (
                        <img src={r.image_urls[0]} alt={r.title || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      {r.title && <p className="text-xs font-bold text-white truncate">{r.title}</p>}
                      {r.price && <p className="text-xs font-black text-amber-400">₦{Number(r.price).toLocaleString()}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Posted time */}
          <p className="text-xs text-zinc-700 text-center mt-8">{formatRelativeTime(post.created_at)}</p>
        </div>
      </div>
    </div>
  )
}
