'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ui/image-upload'
import { SERVICE_LABELS, formatRelativeTime } from '@/lib/utils'
import { Plus, Trash2, X, Heart, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Post } from '@/types'

export default function CreativePostsPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [creativeId, setCreativeId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [serviceType, setServiceType] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase.from('tailor_profiles').select('id').eq('user_id', user.id).single().then(({ data }) => {
        if (data) { setCreativeId(data.id); loadPosts(data.id, user.id) }
      })
    })
  }, [])

  const loadPosts = async (cid: string, uid: string) => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('creative_id', cid)
      .order('created_at', { ascending: false })
    setPosts(data || [])
  }

  const savePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !creativeId) return
    if (images.length === 0) { toast.error('Add at least one photo'); return }
    setSaving(true)
    const { error } = await supabase.from('posts').insert({
      user_id: userId,
      creative_id: creativeId,
      caption: caption.trim() || null,
      image_urls: images,
      service_type: serviceType || null,
    })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Post published!')
    setImages([]); setCaption(''); setServiceType(''); setAdding(false); setSaving(false)
    loadPosts(creativeId, userId)
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return
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
            <h1 className="text-2xl font-bold text-gray-900">My Posts</h1>
            <p className="text-sm text-gray-500">Share your work to attract customers</p>
          </div>
          <Button onClick={() => setAdding(true)} size="md">
            <Plus size={16} /> New Post
          </Button>
        </div>

        {/* Create post */}
        {adding && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">New Post</h2>
              <button onClick={() => { setAdding(false); setImages([]); setCaption(''); setServiceType('') }}>
                <X size={18} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={savePost} className="space-y-4">
              <ImageUpload
                bucket="portfolio"
                folder={`posts/${userId}`}
                value={images}
                onChange={setImages}
                maxFiles={6}
                label="Photos (up to 6)"
                hint="Show your work — finished pieces, WIP, fabrics, anything inspiring"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Caption</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={3}
                  placeholder="Describe this piece, the occasion, the fabric…"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category (optional)</label>
                <select
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                >
                  <option value="">— Select category —</option>
                  {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" size="md" onClick={() => setAdding(false)}>Cancel</Button>
                <Button type="submit" size="md" loading={saving} disabled={images.length === 0}>Publish Post</Button>
              </div>
            </form>
          </div>
        )}

        {/* Posts grid */}
        {posts.length === 0 && !adding ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">📸</div>
            <h3 className="font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-sm text-gray-500 mb-4">Share your first piece and start attracting customers</p>
            <Button onClick={() => setAdding(true)}><Plus size={16} /> Create First Post</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {post.image_urls?.[0] && (
                  <div className="flex gap-1 bg-gray-100">
                    {post.image_urls.slice(0, 3).map((url, i) => (
                      <div key={i} className={`${post.image_urls.length === 1 ? 'w-full' : 'flex-1'} aspect-square overflow-hidden`}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {post.image_urls.length > 3 && (
                      <div className="flex-1 aspect-square bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm">
                        +{post.image_urls.length - 3}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  {post.caption && <p className="text-sm text-gray-800 mb-2">{post.caption}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Heart size={14} /> {post.likes_count}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={14} /> {post.comments_count}</span>
                      <span className="text-xs text-gray-400">{formatRelativeTime(post.created_at)}</span>
                    </div>
                    <button onClick={() => deletePost(post.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
