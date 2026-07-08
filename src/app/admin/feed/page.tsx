'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ui/image-upload'
import { formatRelativeTime } from '@/lib/utils'
import { Plus, Trash2, X, Heart, MessageSquare, ImageIcon, Sparkles, Edit3, Save, Download, ImagePlus, Check, ChevronLeft, ChevronRight } from 'lucide-react'
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

type PendingImage = { file: File; preview: string; imgIndex: number }

export default function AdminFeedPage() {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [userId, setUserId] = useState<string | null>(null)
  const [posts, setPosts] = useState<(Post & { author?: Profile })[]>([])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [contentTag, setContentTag] = useState('')

  // per-post pending image replacement (select → preview → save)
  const [pending, setPending] = useState<Record<string, PendingImage>>({})
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  // per-post text editing
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCaption, setEditCaption] = useState('')

  // per-post current image index (for multi-image posts)
  const [imgIndex, setImgIndex] = useState<Record<string, number>>({})

  // AI polish
  const [polishingPostId, setPolishingPostId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (p?.role !== 'admin') { router.push('/browse'); return }
      setUserId(user.id)
      loadPosts()
    })
  }, [])

  async function loadPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_user_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(60)
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
    loadPosts()
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post from the feed?')) return
    await supabase.from('posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    toast.success('Deleted')
  }

  // ── Text editing ─────────────────────────────────────────────────────────────

  const startEdit = (post: Post & { author?: Profile }) => {
    const tag = extractTag(post.caption)
    setEditingPostId(post.id)
    setEditTitle(post.title || '')
    setEditCaption(tag ? post.caption?.replace(/^\[.+?\]\n/, '') || '' : post.caption || '')
  }

  const saveEdit = async (post: Post & { author?: Profile }) => {
    const tag = extractTag(post.caption)
    const nextCaption = tag ? `[${tag}]\n${editCaption.trim()}` : editCaption.trim() || null
    const res = await fetch('/api/admin/posts/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post.id, title: editTitle.trim() || null, caption: nextCaption }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { toast.error(data.error || 'Could not save'); return }
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, title: editTitle.trim() || null, caption: nextCaption } : p))
    setEditingPostId(null)
    toast.success('Post updated')
  }

  // ── Image replacement: select → preview → save ────────────────────────────

  const selectReplacement = (postId: string, imgIdx: number, file: File) => {
    // revoke previous preview blob if any
    const prev = pending[postId]
    if (prev) URL.revokeObjectURL(prev.preview)
    setPending(p => ({ ...p, [postId]: { file, preview: URL.createObjectURL(file), imgIndex: imgIdx } }))
  }

  const discardReplacement = (postId: string) => {
    const prev = pending[postId]
    if (prev) URL.revokeObjectURL(prev.preview)
    setPending(p => { const n = { ...p }; delete n[postId]; return n })
  }

  const saveReplacement = async (post: Post & { author?: Profile }) => {
    const item = pending[post.id]
    if (!item) return
    setUploadingId(post.id)
    try {
      const ext = item.file.name.split('.').pop() || 'jpg'
      const path = `admin-feed/replacements/${post.id}-${item.imgIndex}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(path, item.file, { contentType: item.file.type, upsert: true })
      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(path)
      const nextImages = [...(post.image_urls || [])]
      nextImages[item.imgIndex] = publicUrl

      const upd = await fetch('/api/admin/posts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, image_urls: nextImages }),
      })
      if (!upd.ok) throw new Error((await upd.json().catch(() => ({}))).error || 'Could not update post')

      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, image_urls: nextImages } : p))
      discardReplacement(post.id)
      toast.success('Image saved — live in feed now')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingId(null)
    }
  }

  // ── AI polish ────────────────────────────────────────────────────────────────

  const polishPostImage = async (post: Post & { author?: Profile }) => {
    const imageUrl = post.image_urls?.[0]
    if (!imageUrl) { toast.error('This post has no image to polish'); return }
    setPolishingPostId(post.id)
    try {
      const res = await fetch('/api/ai/polish-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, title: post.title || post.caption || 'TailorNow feed post' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not polish this image')
      const nextImages = [data.imageUrl as string, ...(post.image_urls || []).slice(1)]
      const upd = await fetch('/api/admin/posts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, image_urls: nextImages }),
      })
      if (!upd.ok) throw new Error((await upd.json().catch(() => ({}))).error || 'Could not save polished image')
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, image_urls: nextImages } : p))
      toast.success('AI polished and saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not polish this image')
    } finally {
      setPolishingPostId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Feed Posts</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Post inspiration, replace images, polish the feed</p>
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
          <form onSubmit={savePost} className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-white">New inspiration post</h2>
              <button type="button" onClick={reset}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Photos</label>
              <ImageUpload bucket="portfolio" folder="admin-feed" value={images} onChange={setImages} maxFiles={6} label="Upload photos" hint="Up to 6 photos" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Content Tag (optional)</label>
              <div className="flex flex-wrap gap-2">
                {FEED_TAGS.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => setContentTag(prev => prev === t.value ? '' : t.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${contentTag === t.value ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-white/[0.1] text-zinc-400 hover:border-violet-300'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Caption</label>
              <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4}
                placeholder="The vibe, the story, the hashtags... make it editorial ✨"
                className="w-full border border-white/[0.1] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none" />
            </div>
            <Button type="submit" loading={saving} className="w-full" size="lg">
              <ImageIcon size={16} /> Publish to Feed
            </Button>
          </form>
        )}

        {/* Posts list */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] text-zinc-600">
              <div className="text-4xl mb-3">📸</div>
              <p className="text-sm">No posts yet. Create one above.</p>
            </div>
          ) : (
            posts.map(post => {
              const tag = extractTag(post.caption)
              const body = tag ? post.caption?.replace(/^\[.+?\]\n/, '') : post.caption
              const urls = post.image_urls || []
              const curIdx = imgIndex[post.id] ?? 0
              const hasPending = !!pending[post.id]
              const pendingItem = pending[post.id]
              const isSaving = uploadingId === post.id

              return (
                <div key={post.id} className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">

                  {/* ── Image viewer ── */}
                  {urls.length > 0 && (
                    <div className="relative bg-black/40">

                      {/* Tag pill */}
                      {tag && !hasPending && (
                        <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          {tag}
                        </div>
                      )}

                      {/* Pending badge */}
                      {hasPending && (
                        <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                          <span className="block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Unsaved replacement — image {(pendingItem.imgIndex) + 1}
                        </div>
                      )}

                      {/* Main image */}
                      <img
                        src={hasPending ? pendingItem.preview : urls[curIdx]}
                        alt=""
                        className="w-full object-contain max-h-[540px]"
                        style={{ display: 'block' }}
                      />

                      {/* Multi-image nav (only when no pending) */}
                      {!hasPending && urls.length > 1 && (
                        <>
                          <button
                            onClick={() => setImgIndex(p => ({ ...p, [post.id]: Math.max(0, (p[post.id] ?? 0) - 1) }))}
                            disabled={curIdx === 0}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white disabled:opacity-30 transition-all">
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            onClick={() => setImgIndex(p => ({ ...p, [post.id]: Math.min(urls.length - 1, (p[post.id] ?? 0) + 1) }))}
                            disabled={curIdx === urls.length - 1}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white disabled:opacity-30 transition-all">
                            <ChevronRight size={16} />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                            {urls.map((_, i) => (
                              <button key={i} onClick={() => setImgIndex(p => ({ ...p, [post.id]: i }))}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === curIdx ? 'bg-white scale-125' : 'bg-white/40'}`} />
                            ))}
                          </div>
                        </>
                      )}

                      {/* Save / Discard bar when pending */}
                      {hasPending && (
                        <div className="absolute bottom-0 inset-x-0 flex items-center gap-3 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
                          <button
                            onClick={() => saveReplacement(post)}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
                            {isSaving
                              ? <span className="block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                              : <Check size={15} />}
                            {isSaving ? 'Saving…' : 'Save to feed'}
                          </button>
                          <button
                            onClick={() => discardReplacement(post.id)}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                            <X size={14} /> Discard
                          </button>
                          <span className="ml-auto text-xs text-white/50 hidden sm:block">
                            Not saved yet — click Save to go live
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Toolbar ── */}
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2 border-b border-white/[0.06]">
                    {/* Download current image */}
                    {urls[curIdx] && !hasPending && (
                      <a href={urls[curIdx]} download target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                        title="Download this image">
                        <Download size={13} /> Download
                      </a>
                    )}

                    {/* Replace current image */}
                    {!hasPending && (
                      <label className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer">
                        <ImagePlus size={13} />
                        {urls.length > 1 ? `Replace photo ${curIdx + 1}` : 'Replace image'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={el => { fileInputRefs.current[post.id] = el }}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            e.currentTarget.value = ''
                            if (file) selectReplacement(post.id, curIdx, file)
                          }}
                        />
                      </label>
                    )}

                    {/* AI polish */}
                    {!hasPending && (
                      <button onClick={() => polishPostImage(post)} disabled={!!polishingPostId}
                        className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors disabled:opacity-40">
                        {polishingPostId === post.id
                          ? <span className="block h-3 w-3 rounded-full border border-amber-400/40 border-t-amber-400 animate-spin" />
                          : <Sparkles size={13} />}
                        AI Polish
                      </button>
                    )}

                    <div className="ml-auto flex items-center gap-1">
                      <button onClick={() => startEdit(post)}
                        className="p-1.5 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors" title="Edit text">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => deletePost(post.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete post">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* ── Post body ── */}
                  <div className="p-4">
                    {editingPostId === post.id ? (
                      <div className="space-y-2">
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title"
                          className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        <textarea value={editCaption} onChange={e => setEditCaption(e.target.value)} rows={3} placeholder="Caption"
                          className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(post)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-3 py-2 text-xs font-bold text-white hover:bg-violet-800">
                            <Save size={13} /> Save
                          </button>
                          <button onClick={() => setEditingPostId(null)}
                            className="rounded-xl border border-white/[0.1] px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {post.title && <p className="text-sm font-bold text-white leading-relaxed mb-1">{post.title}</p>}
                        {body && <p className="text-sm text-zinc-300 leading-relaxed mb-3">{body}</p>}
                        <div className="flex items-center gap-4 text-xs text-zinc-600">
                          <span className="flex items-center gap-1"><Heart size={11} /> {post.likes_count ?? 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare size={11} /> {post.comments_count ?? 0}</span>
                          <span>{formatRelativeTime(post.created_at)}</span>
                          {post.author && <span className="text-zinc-700">by {post.author.full_name || 'Admin'}</span>}
                        </div>
                      </>
                    )}
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
