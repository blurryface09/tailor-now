'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { SERVICE_LABELS, formatRelativeTime } from '@/lib/utils'
import { Heart, MessageSquare, UserPlus, UserCheck, Send, ChevronLeft, ChevronRight, MapPin, Star, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Post, PostComment, Profile, TailorProfile } from '@/types'

const STYLE_CHIPS = [
  { label: 'All', value: '' },
  { label: '👗 Custom', value: 'custom_outfit' },
  { label: '✂️ Alterations', value: 'alterations' },
  { label: '💍 Bridal', value: 'bridal' },
  { label: '👕 Ready-to-Wear', value: 'ready_to_wear' },
  { label: '🧵 Fabric', value: 'fabric_sourcing' },
  { label: '👔 Uniforms', value: 'uniforms' },
]

const COVER_GRADIENTS = [
  'from-violet-500 to-purple-700',
  'from-indigo-500 to-violet-600',
  'from-purple-600 to-pink-500',
  'from-violet-600 to-indigo-700',
  'from-fuchsia-500 to-violet-600',
]

const DEMO_POSTS = [
  {
    id: 'demo-1',
    imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=600&fit=crop&q=80&auto=format',
    business_name: 'Adaeze Couture',
    city: 'Lagos',
    service: 'custom_outfit',
    caption: 'Just finished this custom Ankara two-piece for a client\'s introduction ceremony 🎉 The embroidery alone took 3 days but every stitch was worth it. She looked STUNNING ✨ #TailorNow #Ankara #CustomFit',
    likes: 142, comments: 18,
  },
  {
    id: 'demo-2',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&q=80&auto=format',
    business_name: 'Emeka Fashion House',
    city: 'Enugu',
    service: 'custom_outfit',
    caption: 'Senator wear for a groom\'s family — 6 pieces, 4 days ⏱️ Matching pocket squares and perfectly fitted agbada for every man in the room 🔥 This is what we do. #MensFashion #SenatorWear #TailorNow',
    likes: 89, comments: 7,
  },
  {
    id: 'demo-3',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=600&fit=crop&q=80&auto=format',
    business_name: 'Adeola Bridal Studio',
    city: 'Ibadan',
    service: 'bridal',
    caption: 'Our bride walked in knowing what she wanted — we gave her what she deserved 👑 A-line silhouette with hand-sewn lace appliqué, cathedral train. She cried happy tears 🤍 #BridalCouture #NigerianBride #TailorNow',
    likes: 231, comments: 34,
  },
  {
    id: 'demo-4',
    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=600&fit=crop&q=80&auto=format',
    business_name: 'Kemi Stitch & Style',
    city: 'Abuja',
    service: 'alterations',
    caption: 'Before & after alterations 🔄 Sometimes a few strategic tucks is all it takes to make a garment feel brand new. Brought this vintage dress back to life — no one would know ✂️ #Alterations #MadeToFit #TailorNow',
    likes: 67, comments: 11,
  },
]

function DemoPostCard({ post }: { post: typeof DEMO_POSTS[number] }) {
  const initial = post.business_name[0].toUpperCase()
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Image */}
      <div className="relative h-72 bg-gray-100 overflow-hidden">
        <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
          Sample post
        </div>
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {SERVICE_LABELS[post.service] ?? post.service}
        </div>
      </div>
      {/* Author row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
            {initial}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{post.business_name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-0.5">
              <MapPin size={10} /> {post.city}
            </p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full hover:bg-violet-50 transition-colors">
          <UserPlus size={12} /> Follow
        </button>
      </div>
      {/* Caption */}
      <p className="px-4 pb-3 text-sm text-gray-700 leading-relaxed">{post.caption}</p>
      {/* Engagement */}
      <div className="flex items-center gap-4 px-4 pb-4 border-t border-gray-50 pt-3">
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
          <Heart size={16} /> <span>{post.likes}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors">
          <MessageSquare size={16} /> <span>{post.comments}</span>
        </button>
      </div>
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
  const creativeUserId = post.creative?.user_id || post.user_id
  const isOwnPost = userId === post.user_id
  const isFollowing = following.has(creativeUserId)

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
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href={`/tailors/${post.creative_id}`} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {post.creative?.business_name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
              {post.creative?.business_name || post.author?.full_name}
            </p>
            {post.service_type && <p className="text-xs text-gray-400">{SERVICE_LABELS[post.service_type]}</p>}
          </div>
        </Link>
        {!isOwnPost && userId && (
          <button onClick={() => onFollow(creativeUserId, isFollowing)}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              isFollowing ? 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                : 'border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white'
            }`}>
            {isFollowing ? <><UserCheck size={11} /> Following</> : <><UserPlus size={11} /> Follow</>}
          </button>
        )}
      </div>

      {post.image_urls.length > 0 && (
        <div className="relative bg-gray-100 aspect-square">
          <img src={post.image_urls[imgIdx]} alt={post.caption || 'Post'} className="w-full h-full object-cover" />
          {post.image_urls.length > 1 && (
            <>
              {imgIdx > 0 && (
                <button onClick={() => setImgIdx(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1">
                  <ChevronLeft size={16} />
                </button>
              )}
              {imgIdx < post.image_urls.length - 1 && (
                <button onClick={() => setImgIdx(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1">
                  <ChevronRight size={16} />
                </button>
              )}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {post.image_urls.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-4">
          <button onClick={() => onLike(post.id, post.liked_by_me || false)} className="flex items-center gap-1.5 group">
            <Heart size={20} className={`transition-all ${post.liked_by_me ? 'fill-red-500 text-red-500' : 'text-gray-500 group-hover:text-red-400'}`} />
            <span className="text-sm text-gray-600">{post.likes_count}</span>
          </button>
          <button onClick={() => { if (!showComments) loadComments(); setShowComments(v => !v) }} className="flex items-center gap-1.5 group">
            <MessageSquare size={20} className="text-gray-500 group-hover:text-violet-600 transition-colors" />
            <span className="text-sm text-gray-600">{post.comments_count}</span>
          </button>
          {post.creative_id && (
            <Link href={`/orders/new?tailor=${post.creative_id}`}
              className="ml-auto text-xs font-semibold bg-violet-700 text-white px-4 py-1.5 rounded-full hover:bg-violet-800 transition-colors">
              Book Now
            </Link>
          )}
        </div>
        {post.caption && (
          <p className="text-sm text-gray-800 mt-2 leading-relaxed">
            <span className="font-semibold">{post.creative?.business_name || post.author?.full_name}</span>{' '}{post.caption}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1 mb-2">{formatRelativeTime(post.created_at)}</p>
      </div>

      {showComments && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="space-y-3 max-h-40 overflow-y-auto mb-3">
            {comments.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No comments yet — be first!</p>}
            {comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs flex-shrink-0">
                  {c.author?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-900">{c.author?.full_name} </span>
                  <span className="text-xs text-gray-700">{c.content}</span>
                </div>
              </div>
            ))}
          </div>
          {userId && (
            <form onSubmit={submitComment} className="flex gap-2">
              <input className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="Add a comment…" value={commentText} onChange={e => setCommentText(e.target.value)} />
              <button type="submit" disabled={!commentText.trim() || posting}
                className="p-2 text-violet-700 hover:bg-violet-50 rounded-xl transition-colors disabled:opacity-40">
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
  const gradient = COVER_GRADIENTS[index % COVER_GRADIENTS.length]
  return (
    <Link href={`/tailors/${creative.id}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-violet-200 overflow-hidden transition-all card-lift">
      <div className={`h-20 bg-gradient-to-br ${gradient} relative`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
      </div>
      <div className="px-4 pb-4 -mt-5">
        <div className="w-10 h-10 rounded-xl bg-white shadow border-2 border-white flex items-center justify-center text-violet-700 font-bold text-base mb-2">
          {creative.business_name?.[0]?.toUpperCase()}
        </div>
        <p className="font-bold text-sm text-gray-900 group-hover:text-violet-700 truncate">{creative.business_name}</p>
        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{creative.city}</p>
        {creative.is_verified && (
          <span className="inline-flex items-center gap-1 text-[10px] text-violet-600 font-medium mt-1">
            <CheckCircle size={10} /> Verified
          </span>
        )}
        <div className="flex items-center gap-1 mt-2">
          <Star size={11} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-gray-700">{creative.avg_rating?.toFixed(1) || 'New'}</span>
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
      // Feed is open discovery — show all creatives' posts regardless of verification
      supabase.from('posts').select('*, author:profiles!posts_user_id_fkey(*), creative:tailor_profiles(*, user_id, business_name, city, state)')
        .order('created_at', { ascending: false }).limit(40),
      // Suggested creatives = verified only (they are bookable)
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

  const filteredPosts = activeChip ? posts.filter(p => p.service_type === activeChip) : posts

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-5">

        {/* View toggle */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-4">
          <button onClick={() => setView('feed')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'feed' ? 'bg-violet-700 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            ✨ Feed
          </button>
          <button onClick={() => setView('discover')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'discover' ? 'bg-violet-700 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            🔍 Discover
          </button>
        </div>

        {/* Style chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
          {STYLE_CHIPS.map(chip => (
            <button key={chip.value} onClick={() => setActiveChip(chip.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeChip === chip.value
                  ? 'bg-violet-700 text-white border-violet-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
              }`}>
              {chip.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" />
          </div>
        ) : view === 'discover' ? (
          /* ── Discover view ── */
          <div>
            <p className="text-sm font-bold text-gray-900 mb-3">Creatives near you</p>
            {creatives.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 text-sm">No creatives yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {creatives.map((c, i) => <CreativeCard key={c.id} creative={c} index={i} />)}
              </div>
            )}
          </div>
        ) : filteredPosts.length === 0 ? (
          /* ── Empty feed — show demo inspiration posts ── */
          <div className="space-y-5">
            {activeChip ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-sm text-gray-500">No posts in this category yet. Check back soon!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5 bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 mb-1">
                  <span className="text-lg">✂️</span>
                  <div>
                    <p className="text-sm font-semibold text-violet-900">Style inspiration</p>
                    <p className="text-xs text-violet-600">Sample posts — real creative work will appear here as creatives join</p>
                  </div>
                </div>
                {DEMO_POSTS.map(p => <DemoPostCard key={p.id} post={p} />)}
              </>
            )}

            {creatives.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-bold text-gray-900 mb-3">Verified creatives to follow</p>
                <div className="grid grid-cols-2 gap-3">
                  {creatives.slice(0, 4).map((c, i) => <CreativeCard key={c.id} creative={c} index={i} />)}
                </div>
                <Link href="/browse" className="flex items-center justify-center mt-3 text-sm text-violet-700 font-semibold hover:underline">
                  Browse all creatives →
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* ── Posts feed ── */
          <div className="space-y-5">
            {filteredPosts.map(post => (
              <PostCard key={post.id} post={post} userId={userId} onLike={handleLike} onFollow={handleFollow} following={following} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
