'use client'
export const dynamic = 'force-dynamic'
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
    <div className="min-h-screen bg-[#09090B]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
      </div>
      <Navbar />
      <div className="relative max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Posts</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Share your work — clients browse the showroom to find and book you</p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/30 hover:scale-[1.03] active:scale-[0.97] text-sm">
            <Plus size={16} /> New Post
          </button>
        </div>

        {/* Create post panel */}
        {adding && (
          <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 mb-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white text-lg">New Post</h2>
              <button onClick={() => { setAdding(false); setImages([]); setCaption(''); setServiceType('') }}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={savePost} className="space-y-5">
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
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Caption</label>
                <textarea
                  className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.08] transition-all resize-none"
                  rows={3}
                  placeholder="Describe this piece, the occasion, the fabric…"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category (optional)</label>
                <select
                  className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/60 transition-all"
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                >
                  <option value="" className="bg-zinc-900">— Select category —</option>
                  {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                    <option key={k} value={k} className="bg-zinc-900">{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setAdding(false)}
                  className="flex-1 py-3 rounded-xl border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/20 transition-colors text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={images.length === 0 || saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:opacity-50 text-white font-semibold transition-all shadow-lg shadow-violet-500/30 text-sm">
                  {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts */}
        {posts.length === 0 && !adding ? (
          <div className="text-center py-24 bg-white/[0.03] rounded-3xl border border-white/[0.07]">
            <div className="text-5xl mb-4">📸</div>
            <h3 className="font-bold text-white mb-2">No posts yet</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">Share your first piece and get discovered by clients browsing the showroom</p>
            <button onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/30 text-sm">
              <Plus size={16} /> Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white/[0.04] border border-white/[0.07] rounded-3xl overflow-hidden group hover:border-violet-500/20 transition-all duration-300">
                {post.image_urls?.[0] && (
                  <div className="flex gap-1">
                    {post.image_urls.slice(0, 3).map((url, i) => (
                      <div key={i} className={`${post.image_urls.length === 1 ? 'w-full' : 'flex-1'} aspect-square overflow-hidden`}>
                        <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    ))}
                    {post.image_urls.length > 3 && (
                      <div className="flex-1 aspect-square bg-white/[0.06] flex items-center justify-center text-zinc-400 font-semibold text-sm">
                        +{post.image_urls.length - 3}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  {post.caption && <p className="text-sm text-zinc-300 mb-3 leading-relaxed">{post.caption}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span className="flex items-center gap-1.5"><Heart size={14} className="text-zinc-600" /> {post.likes_count}</span>
                      <span className="flex items-center gap-1.5"><MessageSquare size={14} className="text-zinc-600" /> {post.comments_count}</span>
                      <span className="text-xs text-zinc-600">{formatRelativeTime(post.created_at)}</span>
                    </div>
                    <button onClick={() => deletePost(post.id)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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
