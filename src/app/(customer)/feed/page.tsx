'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { SERVICE_LABELS, formatRelativeTime } from '@/lib/utils'
import { Heart, MessageSquare, Send, ChevronLeft, ChevronRight, MapPin, Star, CheckCircle, Scissors, Sparkles } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Post, PostComment, Profile, TailorProfile } from '@/types'

const FEED_CHIPS = [
  { label: 'All', value: '' },
  { label: '🔥 Style of the Week', value: 'style_week' },
  { label: '🎨 Alte Style', value: 'alte' },
  { label: '👟 Street Wear', value: 'street' },
  { label: '🌍 Ankara', value: 'ankara' },
  { label: '💍 Bridal', value: 'bridal' },
  { label: '✨ New Trends', value: 'trends' },
  { label: '😂 Memes', value: 'memes' },
]

function extractCaptionTag(caption: string | null): { tag: string | null; body: string } {
  if (!caption) return { tag: null, body: '' }
  const match = caption.match(/^\[(.+?)\]\n([\s\S]*)$/)
  if (match) return { tag: match[1], body: match[2] }
  return { tag: null, body: caption }
}

/* ── Stunning demo posts with real fashion work ─────────────── */
const DEMO_POSTS = [
  {
    id: 'demo-1',
    imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1000&fit=crop&q=85',
    tag: '🔥 Style of the Week',
    creative: 'Zara Couture Lagos',
    city: 'Lagos',
    caption: 'Bold, unapologetic, dripping in colour. This is what Nigerian fashion looks like when creatives are given full creative freedom. 🧵✨',
    likes: 312, comments: 41, isAdmin: true,
  },
  {
    id: 'demo-2',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1000&fit=crop&q=85',
    tag: '💍 Bridal Couture',
    creative: 'House of Adaeze',
    city: 'Abuja',
    caption: 'This bridal piece took 3 weeks to complete. Every bead, every stitch placed with intention. Your wedding look starts here. 🤍',
    likes: 521, comments: 68, isAdmin: false,
  },
  {
    id: 'demo-3',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1000&fit=crop&q=85',
    tag: '🌍 Ankara Season',
    creative: 'Kente Republic',
    city: 'Port Harcourt',
    caption: 'Ankara never goes out of style. It evolves. 🧵 From ceremonies to street fashion — every thread carries culture.',
    likes: 445, comments: 53, isAdmin: false,
  },
  {
    id: 'demo-4',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=85',
    tag: '✨ New Trends',
    creative: 'StyleHaus by Temi',
    city: 'Lagos',
    caption: 'Power dressing, Lagos edition. You don\'t need Paris when you have Lagos creatives. 🔥',
    likes: 389, comments: 44, isAdmin: false,
  },
  {
    id: 'demo-5',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop&q=85',
    tag: '👗 Ready to Wear',
    creative: 'Ade & Co Fabrics',
    city: 'Ibadan',
    caption: 'Comfort meets class. Our ready-to-wear line is now available for custom orders. DM to book. 📩',
    likes: 278, comments: 32, isAdmin: false,
  },
  {
    id: 'demo-6',
    imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=1000&fit=crop&q=85',
    tag: '🎨 Alte Style',
    creative: 'Neon Needle Studio',
    city: 'Lagos',
    caption: 'Alte energy, traditional fabric. The intersection of old Nigeria and new Lagos. Are you ready? 🎨',
    likes: 612, comments: 89, isAdmin: false,
  },
]

function DemoPostCard({ post, liked, onLike }: {
  post: typeof DEMO_POSTS[number]
  liked: boolean
  onLike: (id: string) => void
}) {
  const [showComment, setShowComment] = useState(false)
  const [localLikes, setLocalLikes] = useState(post.likes)
  const [isLiked, setIsLiked] = useState(liked)

  const toggleLike = () => {
    setIsLiked(v => !v)
    setLocalLikes(v => isLiked ? v - 1 : v + 1)
    onLike(post.id)
  }

  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl overflow-hidden group hover:border-violet-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10">
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
        <img
          src={post.imageUrl}
          alt={post.tag}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {/* Shine sweep */}
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-12 pointer-events-none" />

        {/* Category pill */}
        <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          {post.tag}
        </div>

        {/* Admin / TailorNow badge */}
        {post.isAdmin && (
          <div className="absolute top-3.5 right-3.5 bg-violet-600/80 backdrop-blur-md border border-violet-500/40 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Scissors size={9} /> TailorNow
          </div>
        )}

        {/* Multi-image dots placeholder */}
        <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className={`rounded-full transition-all ${i === 0 ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
          ))}
        </div>

        {/* Bottom overlay: actions + creative info */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0 pr-3">
              {!post.isAdmin && (
                <>
                  <p className="text-white font-bold text-sm leading-tight truncate">{post.creative}</p>
                  <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5"><MapPin size={9} />{post.city}</p>
                </>
              )}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-3">
              <button onClick={toggleLike} className="flex flex-col items-center gap-0.5 group/like">
                <Heart size={20} className={`transition-all duration-200 ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-white/80 group-hover/like:text-red-400'}`} />
                <span className="text-[10px] text-white/60 font-medium">{localLikes}</span>
              </button>
              <button onClick={() => setShowComment(v => !v)} className="flex flex-col items-center gap-0.5 group/msg">
                <MessageSquare size={20} className="text-white/80 group-hover/msg:text-violet-300 transition-colors" />
                <span className="text-[10px] text-white/60 font-medium">{post.comments}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Caption + Book CTA */}
      <div className="px-4 py-3.5">
        <p className="text-sm text-zinc-300 leading-relaxed line-clamp-2">{post.caption}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-zinc-600">Just now</span>
          {!post.isAdmin ? (
            <Link href="/browse"
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-amber-400/25">
              <Scissors size={11} /> Book Now
            </Link>
          ) : (
            <span className="text-xs font-bold text-violet-400 flex items-center gap-1"><Sparkles size={10} /> TailorNow Original</span>
          )}
        </div>
      </div>

      {/* Comment section */}
      {showComment && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <p className="text-xs text-zinc-600 text-center mb-2">Sign in to join the conversation</p>
          <Link href="/login" className="block text-center text-xs text-violet-400 font-semibold hover:text-violet-300 transition-colors">
            Sign in →
          </Link>
        </div>
      )}
    </div>
  )
}

type CreativeWithProfile = TailorProfile & { profile: Profile }

function PostCard({ post, userId, onLike, onFollow, following }: {
  post: Post
  userId: string | null
  onLike: (postId: string, liked: boolean) => void
  onFollow: (creativeUserId: string, isFollowing: boolean) => void
  following: Set<string>
}) {
  const supabase = createClient()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<(PostComment & { author: Profile })[]>([])
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const isAdminPost = !post.creative_id
  const creativeUserId = post.creative?.user_id || post.user_id
  const isOwnPost = userId === post.user_id
  const isFollowing = following.has(creativeUserId)
  const authorName = isAdminPost ? 'TailorNow' : (post.creative?.business_name || post.author?.full_name)
  const { tag: captionTag, body: captionBody } = extractCaptionTag(post.caption)

  const loadComments = async () => {
    const { data } = await supabase.from('post_comments')
      .select('*, author:profiles(*)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .limit(20)
    setComments(data || [])
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) { toast.error('Sign in to comment'); return }
    if (!commentText.trim()) return
    setPosting(true)
    await supabase.from('post_comments').insert({ post_id: post.id, user_id: userId, content: commentText.trim() })
    setCommentText('')
    setPosting(false)
    loadComments()
  }

  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-3xl overflow-hidden group hover:border-violet-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10">
      {post.image_urls.length > 0 && (
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
          <img
            src={post.image_urls[imgIdx]}
            alt={captionBody || 'Creative work'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-12 pointer-events-none" />

          {/* Category badge */}
          {(captionTag || post.service_type) && (
            <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {captionTag || SERVICE_LABELS[post.service_type!]}
            </div>
          )}
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
              <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 flex gap-1.5">
                {post.image_urls.map((_, i) => (
                  <div key={i} className={`rounded-full transition-all ${i === imgIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
                ))}
              </div>
            </>
          )}

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
            <div className="flex items-end justify-between">
              <div className="flex-1 min-w-0 pr-3">
                {!isAdminPost && (
                  <>
                    <Link href={`/tailors/${post.creative_id}`} className="text-white font-bold text-sm hover:text-violet-300 transition-colors truncate block">{authorName}</Link>
                    {post.creative?.city && <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5"><MapPin size={9} />{post.creative.city}</p>}
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => onLike(post.id, post.liked_by_me || false)} className="flex flex-col items-center gap-0.5 group/like">
                  <Heart size={20} className={`transition-all duration-200 ${post.liked_by_me ? 'fill-red-500 text-red-500 scale-110' : 'text-white/80 group-hover/like:text-red-400'}`} />
                  <span className="text-[10px] text-white/60 font-medium">{post.likes_count}</span>
                </button>
                <button onClick={() => { if (!showComments) loadComments(); setShowComments(v => !v) }} className="flex flex-col items-center gap-0.5 group/msg">
                  <MessageSquare size={20} className="text-white/80 group-hover/msg:text-violet-300 transition-colors" />
                  <span className="text-[10px] text-white/60 font-medium">{post.comments_count}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Caption + Book CTA */}
      <div className="px-4 py-3.5">
        {captionBody && <p className="text-sm text-zinc-300 leading-relaxed line-clamp-2">{captionBody}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-zinc-600">{formatRelativeTime(post.created_at)}</span>
          {isAdminPost ? (
            <span className="text-xs font-bold text-violet-400 flex items-center gap-1"><Sparkles size={10} /> TailorNow Original</span>
          ) : (
            <div className="flex items-center gap-2">
              {!isOwnPost && userId && (
                <button onClick={() => onFollow(creativeUserId, isFollowing)}
                  className={`text-xs font-semibold transition-colors ${isFollowing ? 'text-zinc-500 hover:text-red-400' : 'text-violet-400 hover:text-violet-300'}`}>
                  {isFollowing ? 'Following' : '+ Follow'}
                </button>
              )}
              {post.creative_id && (
                <Link href={`/orders/new?tailor=${post.creative_id}`}
                  className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-amber-400/25">
                  <Scissors size={11} /> Book Now
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments drawer */}
      {showComments && (
        <div className="border-t border-white/[0.06] px-4 py-3">
          <div className="space-y-3 max-h-40 overflow-y-auto mb-3">
            {comments.length === 0 && <p className="text-xs text-zinc-600 text-center py-2">No comments yet — be first!</p>}
            {comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-xs flex-shrink-0">
                  {c.author?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <span className="text-xs font-semibold text-white">{c.author?.full_name} </span>
                  <span className="text-xs text-zinc-400">{c.content}</span>
                </div>
              </div>
            ))}
          </div>
          {userId && (
            <form onSubmit={submitComment} className="flex gap-2">
              <input
                className="flex-1 text-sm bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                placeholder="Add a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button type="submit" disabled={!commentText.trim() || posting}
                className="p-2 text-violet-400 hover:bg-violet-500/10 rounded-xl transition-colors disabled:opacity-40">
                <Send size={15} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function CreativeCard({ creative, index }: { creative: CreativeWithProfile; index: number }) {
  const GRADIENTS = ['from-violet-600 to-purple-800', 'from-fuchsia-600 to-violet-700', 'from-indigo-600 to-violet-700', 'from-purple-600 to-fuchsia-700', 'from-violet-700 to-indigo-800']
  const gradient = GRADIENTS[index % GRADIENTS.length]
  return (
    <Link href={`/tailors/${creative.id}`}
      className="group bg-white/[0.04] border border-white/[0.07] hover:border-violet-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-0.5">
      <div className={`h-20 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '14px 14px' }} />
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />
      </div>
      <div className="px-3.5 pb-3.5 -mt-5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-violet-400 font-bold text-base mb-2 shadow-lg">
          {creative.business_name?.[0]?.toUpperCase()}
        </div>
        <p className="font-bold text-sm text-white group-hover:text-violet-300 truncate transition-colors">{creative.business_name}</p>
        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5"><MapPin size={9} />{creative.city}</p>
        {creative.is_verified && (
          <span className="inline-flex items-center gap-1 text-[10px] text-violet-400 font-medium mt-1">
            <CheckCircle size={9} /> Verified
          </span>
        )}
        <div className="flex items-center gap-1 mt-1.5">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-zinc-400">{creative.avg_rating?.toFixed(1) || 'New'}</span>
        </div>
      </div>
    </Link>
  )
}

export default function FeedPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [creatives, setCreatives] = useState<CreativeWithProfile[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [likedDemos, setLikedDemos] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeChip, setActiveChip] = useState('')
  const [view, setView] = useState<'feed' | 'discover'>('feed')

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
      setFollowing(new Set((follows || []).map(f => f.following_id)))
    }
    const [postsResult, creativesResult] = await Promise.all([
      supabase.from('posts').select('*, author:profiles!posts_user_id_fkey(*), creative:tailor_profiles(*, user_id, business_name, city, state)')
        .order('created_at', { ascending: false }).limit(40),
      supabase.from('tailor_profiles').select('*, profile:profiles(*)').eq('is_active', true).eq('is_verified', true)
        .order('avg_rating', { ascending: false }).limit(12),
    ])
    if (postsResult.data && user) {
      const { data: liked } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id)
      const likedSet = new Set((liked || []).map(l => l.post_id))
      setPosts(postsResult.data.map(p => ({ ...p, liked_by_me: likedSet.has(p.id) })))
    } else {
      setPosts(postsResult.data || [])
    }
    setCreatives(creativesResult.data || [])
    setLoading(false)
  }

  const handleLike = async (postId: string, liked: boolean) => {
    if (!userId) { toast.error('Sign in to like posts'); return }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: !liked, likes_count: liked ? p.likes_count - 1 : p.likes_count + 1 } : p))
    if (liked) await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    else await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
  }

  const handleFollow = async (creativeUserId: string, isFollowing: boolean) => {
    if (!userId) { toast.error('Sign in to follow creatives'); return }
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', creativeUserId)
      setFollowing(prev => { const s = new Set(prev); s.delete(creativeUserId); return s })
    } else {
      await supabase.from('follows').insert({ follower_id: userId, following_id: creativeUserId })
      setFollowing(prev => new Set([...prev, creativeUserId]))
      toast.success('Following!')
    }
  }

  const filteredPosts = activeChip
    ? posts.filter(p => {
        const { tag } = extractCaptionTag(p.caption)
        if (tag) {
          const t = tag.toLowerCase()
          if (activeChip === 'style_week') return t.includes('style of the week')
          if (activeChip === 'alte') return t.includes('alte')
          if (activeChip === 'street') return t.includes('street')
          if (activeChip === 'ankara') return t.includes('ankara')
          if (activeChip === 'bridal') return t.includes('bridal') || p.service_type === 'bridal'
          if (activeChip === 'trends') return t.includes('trend')
          if (activeChip === 'memes') return t.includes('meme')
        }
        if (activeChip === 'bridal' && p.service_type === 'bridal') return true
        return false
      })
    : posts

  const showDemos = filteredPosts.length === 0 && !activeChip

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-32 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-72 h-72 bg-fuchsia-600/6 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <div className="relative max-w-lg mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-violet-400" /> Creative Showroom
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Discover work • Book a creative • Look amazing</p>
          </div>
          <Link href="/browse" className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors border border-violet-500/20 px-3 py-1.5 rounded-full hover:border-violet-500/40">
            Browse all →
          </Link>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-white/[0.04] rounded-2xl border border-white/[0.07] p-1 mb-4">
          <button onClick={() => setView('feed')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${view === 'feed' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]'}`}>
            ✨ Showroom
          </button>
          <button onClick={() => setView('discover')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${view === 'discover' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]'}`}>
            🔍 Discover
          </button>
        </div>

        {/* Style chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-5">
          {FEED_CHIPS.map(chip => (
            <button key={chip.value} onClick={() => setActiveChip(chip.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeChip === chip.value
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/[0.05] text-zinc-400 border border-white/[0.08] hover:border-violet-500/30 hover:text-violet-300 hover:bg-violet-500/10'
              }`}>
              {chip.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
            <p className="text-zinc-600 text-sm">Loading showroom…</p>
          </div>
        ) : view === 'discover' ? (
          <div>
            <p className="text-sm font-bold text-white mb-3">Verified Creatives</p>
            {creatives.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.03] rounded-3xl border border-white/[0.07]">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-zinc-500 text-sm">No creatives yet — check back soon</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {creatives.map((c, i) => <CreativeCard key={c.id} creative={c} index={i} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Real posts */}
            {filteredPosts.map(post => (
              <PostCard key={post.id} post={post} userId={userId} onLike={handleLike} onFollow={handleFollow} following={following} />
            ))}

            {/* Demo showroom posts when no real posts exist */}
            {showDemos && (
              <>
                <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl px-4 py-3">
                  <Scissors size={16} className="text-violet-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-violet-300">Showroom Preview</p>
                    <p className="text-xs text-violet-500">Real creative work will appear here as creatives join and post</p>
                  </div>
                </div>
                {DEMO_POSTS.map(p => (
                  <DemoPostCard
                    key={p.id}
                    post={p}
                    liked={likedDemos.has(p.id)}
                    onLike={(id) => setLikedDemos(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })}
                  />
                ))}
              </>
            )}

            {/* Empty chip filter state */}
            {activeChip && filteredPosts.length === 0 && (
              <div className="text-center py-16 bg-white/[0.03] rounded-3xl border border-white/[0.07]">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-zinc-500 text-sm">No posts in this category yet</p>
                <button onClick={() => setActiveChip('')} className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  View all posts →
                </button>
              </div>
            )}

            {/* Discover strip */}
            {creatives.length > 0 && showDemos && (
              <div className="mt-2 pt-2 border-t border-white/[0.06]">
                <p className="text-sm font-bold text-white mb-3">Verified creatives to follow</p>
                <div className="grid grid-cols-2 gap-3">
                  {creatives.slice(0, 4).map((c, i) => <CreativeCard key={c.id} creative={c} index={i} />)}
                </div>
                <Link href="/browse" className="flex items-center justify-center mt-4 text-sm text-violet-400 font-semibold hover:text-violet-300 transition-colors">
                  Browse all creatives →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
