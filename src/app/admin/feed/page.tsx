'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ui/image-upload'
import { formatRelativeTime } from '@/lib/utils'
import { Plus, Trash2, X, Heart, MessageSquare, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { Post, Profile } from '@/types'

const FEED_TAGS = [
  { label: '🔥 Style of the Week', value: '🔥 Style of the Week' },
  { label: '🎨 Alte Style', value: '🎨 Alte Style' },
  { label: '👟 Street Wear', value: '👟 Street Wear' },
  { label: '🌍 Ankara & African Prints', value: '🌍 Ankara & African Prints' },
  { label: '💍 Bridal Inspo', value: '💍 Bridal Inspo' },
  { label: '✨ New Trends', value: '✨ New Trends' },
  { label: '😂 Fashion Memes', value: '😂 Fashion Memes' },
  { label: '🎉 Customer Spotlight', value: '🎉 Customer Spotlight' },
]

function extractTag(caption: string | null): string | null {
  if (!caption) return null
  const match = caption.match(/^\[(.+?)\]\n/)
  return match ? match[1] : null
}

export default function AdminFeedPage() {
  const supabase = createClient()
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [posts, setPosts] = useState<(Post & { author?: Profile })[]>([])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [contentTag, setContentTag] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (p?.role !== 'admin') { router.push('/browse'); return }
      setUserId(user.id)
      loadPosts(user.id)
    })
  }, [])

  const loadPosts = async (uid: string) => {
    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_user_id_fkey(*)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20)
    setPosts(data || [])
  }

  const reset = () => { setAdding(false); setImages([]); setCaption(''); setContentTag('') }

  const savePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    if (images.length === 0) { toast.error('Add at least one photo'); return }
    if (!caption.trim()) { toast.error('Add a caption'); return }
    setSaving(true)
    const fullCaption = contentTag ? `[${contentTag}]\n${caption.trim()}` : caption.trim()
    const { error } = await supabase.from('posts').insert({
      user_id: userId,
      creative_id: null,
      caption: fullCaption,
      image_urls: images,
      service_type: null,
    })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Post published to feed!')
    reset()
    setSaving(false)
    loadPosts(userId)
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post from the feed?')) return
    await supabase.from('posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    toast.success('Deleted')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feed Posts</h1>
            <p className="text-sm text-gray-500 mt-0.5">Post fashion inspiration, street wear, Ankara — anything that gets people excited</p>
          </div>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-violet-800 transition-colors shadow-sm shadow-violet-300">
              <Plus size={16} /> New Post
            </button>
          )}
        </div>

        {/* Compose form */}
        {adding && (
          <form onSubmit={savePost} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-900">New inspiration post</h2>
              <button type="button" onClick={reset}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Photos
              </label>
              <ImageUpload
                bucket="portfolio"
                folder="admin-feed"
                value={images}
                onChange={setImages}
                maxFiles={6}
                label="Upload photos"
                hint="Up to 6 photos"
              />
            </div>

            {/* Content tag */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Content Tag (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {FEED_TAGS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setContentTag(prev => prev === t.value ? '' : t.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                      contentTag === t.value
                        ? 'border-violet-600 bg-violet-50 text-violet-700'
                        : 'border-gray-200 text-gray-600 hover:border-violet-300'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={4}
                placeholder="The vibe, the story, the hashtags... make it editorial ✨"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
            </div>

            <Button type="submit" loading={saving} className="w-full" size="lg">
              <ImageIcon size={16} /> Publish to Feed
            </Button>
          </form>
        )}

        {/* Existing posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
              <div className="text-4xl mb-3">📸</div>
              <p className="text-sm">No posts yet. Create one above.</p>
            </div>
          ) : (
            posts.map(post => {
              const tag = extractTag(post.caption)
              const body = tag ? post.caption?.replace(/^\[.+?\]\n/, '') : post.caption
              return (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {post.image_urls?.length > 0 && (
                    <div className="relative h-56 bg-gray-100 overflow-hidden">
                      <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover" />
                      {post.image_urls.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                          +{post.image_urls.length - 1} more
                        </div>
                      )}
                      {tag && (
                        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          {tag}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {body && (
                          <p className="text-sm text-gray-800 leading-relaxed mb-2">{body}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Heart size={11} /> {post.likes_count ?? 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare size={11} /> {post.comments_count ?? 0}</span>
                          <span>{formatRelativeTime(post.created_at)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
