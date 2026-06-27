'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { SERVICE_LABELS, formatRelativeTime } from '@/lib/utils'
import { Heart, MessageSquare, Bookmark, UserPlus, UserCheck, X, Send, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Post, PostComment, Profile } from '@/types'

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
    const { data } = await supabase
      .from('post_comments')
      .select('*, author:profiles(*)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .limit(20)
    setComments(data || [])
  }

  const toggleComments = () => {
    if (!showComments) loadComments()
    setShowComments(v => !v)
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) { toast.error('Sign in to comment'); return }
    if (!commentText.trim()) return
    setPosting(true)
    const { error } = await supabase.from('post_comments').insert({
      post_id: post.id, user_id: userId, content: commentText.trim(),
    })
    if (error) { toast.error(error.message); setPosting(false); return }
    setCommentText('')
    setPosting(false)
    loadComments()
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link href={`/tailors/${post.creative_id}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {post.creative?.business_name?.[0]?.toUpperCase() || post.author?.full_name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
              {post.creative?.business_name || post.author?.full_name}
            </p>
            {post.service_type && (
              <p className="text-xs text-gray-400">{SERVICE_LABELS[post.service_type]}</p>
            )}
          </div>
        </Link>
        {!isOwnPost && userId && (
          <button
            onClick={() => onFollow(creativeUserId, isFollowing)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              isFollowing
                ? 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'
                : 'border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white'
            }`}
          >
            {isFollowing ? <><UserCheck size={12} /> Following</> : <><UserPlus size={12} /> Follow</>}
          </button>
        )}
      </div>

      {/* Image(s) */}
      {post.image_urls.length > 0 && (
        <div className="relative bg-gray-100 aspect-square">
          <img
            src={post.image_urls[imgIdx]}
            alt={post.caption || 'Post'}
            className="w-full h-full object-cover"
          />
          {post.image_urls.length > 1 && (
            <>
              {imgIdx > 0 && (
                <button onClick={() => setImgIdx(i => i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/60 transition-colors">
                  <ChevronLeft size={18} />
                </button>
              )}
              {imgIdx < post.image_urls.length - 1 && (
                <button onClick={() => setImgIdx(i => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/60 transition-colors">
                  <ChevronRight size={18} />
                </button>
              )}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {post.image_urls.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.id, post.liked_by_me || false)}
            className="flex items-center gap-1.5 group"
          >
            <Heart size={22} className={`transition-all ${post.liked_by_me ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-500 group-hover:text-red-400'}`} />
            <span className="text-sm font-medium text-gray-600">{post.likes_count}</span>
          </button>
          <button onClick={toggleComments} className="flex items-center gap-1.5 group">
            <MessageSquare size={22} className="text-gray-500 group-hover:text-violet-600 transition-colors" />
            <span className="text-sm font-medium text-gray-600">{post.comments_count}</span>
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
            <span className="font-semibold">{post.creative?.business_name || post.author?.full_name}</span>
            {' '}{post.caption}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1 mb-2">{formatRelativeTime(post.created_at)}</p>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
            {comments.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No comments yet — be first!</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs flex-shrink-0">
                  {c.author?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-900">{c.author?.full_name} </span>
                  <span className="text-xs text-gray-700">{c.content}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(c.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
          {userId && (
            <form onSubmit={submitComment} className="flex gap-2">
              <input
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="Add a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button type="submit" disabled={!commentText.trim() || posting}
                className="p-2 text-violet-700 hover:bg-violet-50 rounded-xl transition-colors disabled:opacity-40">
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default function FeedPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      await loadFollowing(user.id)
    }
    await loadPosts(user?.id || null)
    setLoading(false)
  }

  const loadFollowing = async (uid: string) => {
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', uid)
    setFollowing(new Set((data || []).map(f => f.following_id)))
  }

  const loadPosts = async (uid: string | null) => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_user_id_fkey(*),
        creative:tailor_profiles(*, user_id, business_name, city, state)
      `)
      .order('created_at', { ascending: false })
      .limit(40)

    if (!data) return

    if (uid) {
      const { data: liked } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', uid)
      const likedSet = new Set((liked || []).map(l => l.post_id))
      setPosts(data.map(p => ({ ...p, liked_by_me: likedSet.has(p.id) })))
    } else {
      setPosts(data)
    }
  }

  const handleLike = async (postId: string, liked: boolean) => {
    if (!userId) { toast.error('Sign in to like posts'); return }
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, liked_by_me: !liked, likes_count: liked ? p.likes_count - 1 : p.likes_count + 1 }
        : p
    ))
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    }
  }

  const handleFollow = async (creativeUserId: string, isFollowing: boolean) => {
    if (!userId) { toast.error('Sign in to follow creatives'); return }
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', creativeUserId)
      setFollowing(prev => { const s = new Set(prev); s.delete(creativeUserId); return s })
      toast.success('Unfollowed')
    } else {
      await supabase.from('follows').insert({ follower_id: userId, following_id: creativeUserId })
      setFollowing(prev => new Set([...prev, creativeUserId]))
      toast.success('Following!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900">Discover Creatives</h1>
          <Link href="/browse" className="text-sm text-violet-700 font-semibold hover:underline">
            Browse all →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">✂️</div>
            <h3 className="font-bold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-sm text-gray-500 mb-4">Creatives haven't posted anything yet</p>
            <Link href="/browse"
              className="inline-block px-5 py-2.5 bg-violet-700 text-white text-sm font-semibold rounded-xl hover:bg-violet-800 transition-colors">
              Browse Creatives
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                userId={userId}
                onLike={handleLike}
                onFollow={handleFollow}
                following={following}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
