'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { ImageUpload } from '@/components/ui/image-upload'
import { SERVICE_LABELS, formatRelativeTime } from '@/lib/utils'
import {
  Plus, Trash2, X, Heart, MessageSquare, ShoppingBag,
  Tag, ToggleLeft, ToggleRight, Share2, ExternalLink,
  Sparkles, Copy, Check, ChevronDown, ChevronUp, Lightbulb,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Post } from '@/types'

function sharePost(postId: string) {
  const url = `${window.location.origin}/p/${postId}`
  if (navigator.share) {
    navigator.share({ title: 'Check this out on TailorNow', url }).catch(() => null)
  } else {
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied! 📋'))
  }
}

function buildPhotoPrompt(title: string, serviceType: string) {
  const outfit = title.trim() || `my ${serviceType ? SERVICE_LABELS[serviceType as keyof typeof SERVICE_LABELS] || serviceType : 'fashion piece'}`
  return `I'm a Nigerian fashion creative selling my work online. I have a photo of "${outfit}" that I want to make look more professional for a fashion marketplace.

Please tell me:
1. What background colour/setting would show this outfit best?
2. What lighting should I use (window light, outdoor, ring light)?
3. What angle or pose would make the outfit look its best?
4. How can I improve this photo for free using Canva or my phone?

Be specific and practical — I want real tips I can use today.`
}

function buildCaptionPrompt(title: string, serviceType: string) {
  const outfit = title.trim() || 'my latest fashion piece'
  const category = serviceType ? SERVICE_LABELS[serviceType as keyof typeof SERVICE_LABELS] || serviceType : 'custom fashion'
  return `I'm a Nigerian fashion creative on TailorNow. Write me a compelling product listing for:

Outfit: ${outfit}
Category: ${category}

Please write:
1. A punchy product title (max 6 words, no fluff)
2. A 2–3 sentence description that makes clients want to book — mention fabric, occasion, and what makes it special
3. A "What's included" line (e.g. fitting session, delivery, alterations)
4. 6 hashtags for Nigerian fashion reach on Instagram and TikTok

Keep the tone confident, premium, and Nigerian. No generic phrases like "high quality" — be specific.`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
        copied
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-white/[0.08] text-zinc-300 hover:bg-white/[0.14] hover:text-white border border-white/[0.1]'
      }`}>
      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy prompt</>}
    </button>
  )
}

function ReachTipsPanel({ title, serviceType }: { title: string; serviceType: string }) {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<'photo' | 'caption'>('photo')

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.07] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-2">
          <Lightbulb size={15} className="text-violet-400 flex-shrink-0" />
          <span className="text-sm font-bold text-violet-200">Get more reach — tips & ChatGPT prompts</span>
        </div>
        {open ? <ChevronUp size={15} className="text-violet-400" /> : <ChevronDown size={15} className="text-violet-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Tab switcher */}
          <div className="flex gap-1 bg-white/[0.06] p-1 rounded-xl">
            <button type="button" onClick={() => setTab('photo')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tab === 'photo' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
              📸 Photo tips
            </button>
            <button type="button" onClick={() => setTab('caption')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tab === 'caption' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
              ✍️ Caption prompt
            </button>
          </div>

          {tab === 'photo' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { icon: '✅', text: 'Use natural daylight — shoot near a window or outside in soft shade' },
                  { icon: '✅', text: 'Plain background: white wall, neutral curtain, or a clean door' },
                  { icon: '✅', text: 'Show the full outfit — head to ankles, no cut edges' },
                  { icon: '✅', text: 'Steam or press the garment before shooting' },
                  { icon: '✅', text: 'Upload 3–6 angles: front, back, detail shot, styled on a model' },
                  { icon: '❌', text: 'Avoid busy backgrounds, cars, harsh phone flash, or dark rooms' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                    <span className="flex-shrink-0 mt-0.5">{tip.icon}</span>
                    <span>{tip.text}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-white/[0.05] border border-white/[0.08] p-3">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-2">Paste this into ChatGPT to get photo tips for your specific outfit</p>
                <pre className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans mb-2">{buildPhotoPrompt(title, serviceType)}</pre>
                <CopyButton text={buildPhotoPrompt(title, serviceType)} />
              </div>
            </div>
          )}

          {tab === 'caption' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Paste the prompt below into <span className="text-violet-300 font-semibold">ChatGPT</span>, <span className="text-violet-300 font-semibold">Claude</span>, or any AI — it will write your title, description, and hashtags.
                {(title || serviceType) && <span className="text-violet-400 font-semibold"> We've pre-filled it with your details.</span>}
              </p>
              <div className="rounded-xl bg-white/[0.05] border border-white/[0.08] p-3">
                <pre className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans mb-2">{buildCaptionPrompt(title, serviceType)}</pre>
                <CopyButton text={buildCaptionPrompt(title, serviceType)} />
              </div>
              <p className="text-[11px] text-zinc-600">Tip: fill in the title and category fields first — the prompt updates automatically.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CreativePostsPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [creativeId, setCreativeId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string>('')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [polishing, setPolishing] = useState(false)
  const [originalImages, setOriginalImages] = useState<string[]>([])

  // form state
  const [images, setImages] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [priceEnabled, setPriceEnabled] = useState(false)
  const [price, setPrice] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase.from('tailor_profiles').select('id, business_name').eq('user_id', user.id).single().then(({ data }) => {
        if (data?.business_name) setBusinessName(data.business_name)
        if (data) { setCreativeId(data.id); loadPosts(data.id) }
      })
    })
  }, [])

  async function loadPosts(cid: string) {
    const { data } = await supabase.from('posts').select('*').eq('creative_id', cid).order('created_at', { ascending: false })
    setPosts(data || [])
  }

  const resetForm = () => {
    setImages([]); setOriginalImages([]); setTitle(''); setCaption(''); setServiceType('')
    setPriceEnabled(false); setPrice(''); setIsAvailable(true); setAdding(false)
  }

  const handleImagesChange = (nextImages: string[]) => {
    setImages(nextImages)
    setOriginalImages(current => current.length ? current : nextImages)
  }

  const polishImages = async () => {
    if (images.length === 0) { toast.error('Add at least one photo first'); return }
    setPolishing(true)
    try {
      const polished = await Promise.all(images.map(async imageUrl => {
        const res = await fetch('/api/ai/polish-portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, title }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Could not polish this photo')
        return data.imageUrl as string
      }))
      setOriginalImages(current => current.length ? current : images)
      setImages(polished)
      toast.success('Showroom photos ready!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not polish these photos')
    } finally {
      setPolishing(false)
    }
  }

  const savePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !creativeId) return
    if (images.length === 0) { toast.error('Add at least one photo'); return }
    const parsedPrice = priceEnabled && price ? parseFloat(price.replace(/,/g, '')) : null
    if (priceEnabled && price && isNaN(parsedPrice!)) { toast.error('Enter a valid price'); return }
    setSaving(true)
    const { data: inserted, error } = await supabase.from('posts').insert({
      user_id: userId,
      creative_id: creativeId,
      caption: caption.trim() || null,
      title: title.trim() || null,
      image_urls: images,
      service_type: serviceType || null,
      post_type: 'product',
      price: parsedPrice,
      is_available: isAvailable,
    }).select('id').single()
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Product posted! 🎉')
    // Notify followers in background
    fetch('/api/posts/notify-followers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: inserted?.id, creativeUserId: userId, postTitle: title.trim() || null, businessName }),
    }).catch(() => null)
    resetForm()
    loadPosts(creativeId)
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    toast.success('Deleted')
  }

  return (
    <div className="min-h-screen bg-[#140F1E]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-600/5 rounded-full blur-3xl" />
      </div>
      <Navbar />

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShoppingBag size={20} className="text-amber-400" /> My Products
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">Post your work — clients shop the feed and book directly</p>
          </div>
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black px-4 py-2.5 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97] text-sm shadow-lg shadow-amber-500/30">
            <Plus size={16} /> New Post
          </button>
        </div>

        {/* Create post panel */}
        {adding && (
          <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 mb-6 shadow-2xl"
            style={{ animation: 'fade-up 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white text-lg">Post a product</h2>
              <button onClick={resetForm}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={savePost} className="space-y-5">
              {/* Tips & prompts panel — shown before upload */}
              <ReachTipsPanel title={title} serviceType={serviceType} />

              {/* Image upload */}
              <ImageUpload
                bucket="portfolio"
                folder={`posts/${userId}`}
                value={images}
                onChange={handleImagesChange}
                maxFiles={6}
                label="Photos (up to 6)"
                hint="Show multiple angles — more photos = more bookings"
              />

              {/* AI polish (only shown after images are added) */}
              {images.length > 0 && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-amber-200">Showroom polish</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        Turn uploaded photos into cleaner, sharper marketplace images while keeping the outfit unchanged.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={polishImages} disabled={polishing || saving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-black text-black transition-colors hover:bg-amber-300 disabled:opacity-50">
                        {polishing ? <span className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : <Sparkles size={14} />}
                        {polishing ? 'Polishing...' : 'AI polish'}
                      </button>
                      {originalImages.length > 0 && originalImages.join('|') !== images.join('|') && (
                        <button type="button" onClick={() => setImages(originalImages)}
                          className="rounded-xl border border-white/[0.12] px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/25 hover:text-white">
                          Use original
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Product title</label>
                <input
                  type="text"
                  className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.08] transition-all"
                  placeholder="e.g. Midnight Blue Co-ord Set, Beaded Bridal Gown…"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              {/* Category */}
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

              {/* Price toggle */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-amber-400" />
                    <span className="text-sm font-semibold text-white">Set a price</span>
                    <span className="text-xs text-zinc-600">(optional)</span>
                  </div>
                  <button type="button" onClick={() => setPriceEnabled(v => !v)} className="transition-colors">
                    {priceEnabled
                      ? <ToggleRight size={28} className="text-amber-400" />
                      : <ToggleLeft size={28} className="text-zinc-600" />}
                  </button>
                </div>
                {priceEnabled && (
                  <div className="flex items-center gap-3" style={{ animation: 'fade-up 0.25s ease both' }}>
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₦</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full rounded-xl bg-white/[0.06] border border-amber-500/30 pl-8 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 transition-all"
                        placeholder="35,000"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                      />
                    </div>
                    <button type="button" onClick={() => setIsAvailable(v => !v)}
                      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${isAvailable ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/[0.04] border-white/[0.1] text-zinc-500'}`}>
                      {isAvailable ? '✓ Available' : 'Unavailable'}
                    </button>
                  </div>
                )}
                {!priceEnabled && (
                  <p className="text-xs text-zinc-600">Leave off if you prefer to discuss price in chat</p>
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
                <textarea
                  className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.08] transition-all resize-none"
                  rows={3}
                  placeholder="Describe the piece — fabric, occasion, turnaround time, what makes it special…"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetForm}
                  className="flex-1 py-3 rounded-xl border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/20 transition-colors text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={images.length === 0 || saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black transition-all shadow-lg shadow-amber-500/30 text-sm">
                  {saving ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : <><ShoppingBag size={15} /> Publish</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts grid */}
        {posts.length === 0 && !adding ? (
          <div className="text-center py-24 bg-white/[0.03] rounded-3xl border border-white/[0.07]">
            <div className="text-5xl mb-4">🛍️</div>
            <h3 className="font-bold text-white mb-2">No products yet</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">Post your first piece and start getting orders from clients browsing the feed</p>
            <button onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/30 text-sm">
              <Plus size={16} /> Add First Product
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, idx) => (
              <div key={post.id}
                className="bg-white/[0.04] border border-white/[0.07] rounded-3xl overflow-hidden group hover:border-amber-500/20 transition-all duration-300"
                style={{ animation: 'fade-up 0.5s ease both', animationDelay: `${idx * 60}ms` }}>
                {post.image_urls?.[0] && (
                  <div className="flex gap-0.5">
                    {post.image_urls.slice(0, 3).map((url, i) => (
                      <div key={i} className={`${post.image_urls.length === 1 ? 'w-full' : 'flex-1'} aspect-square overflow-hidden`}>
                        <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"  loading="lazy"/>
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
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      {post.title && <p className="font-bold text-white text-sm truncate">{post.title}</p>}
                      {post.caption && <p className="text-sm text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">{post.caption}</p>}
                    </div>
                    {post.price && (
                      <span className="flex-shrink-0 bg-amber-400/15 border border-amber-500/30 text-amber-400 text-xs font-black px-2.5 py-1 rounded-full">
                        ₦{post.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span className="flex items-center gap-1.5"><Heart size={13} className="text-zinc-600" /> {post.likes_count}</span>
                      <span className="flex items-center gap-1.5"><MessageSquare size={13} className="text-zinc-600" /> {post.comments_count}</span>
                      <span className="text-xs text-zinc-600">{formatRelativeTime(post.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => sharePost(post.id)}
                        className="p-1.5 text-zinc-600 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        title="Share product link">
                        <Share2 size={14} />
                      </button>
                      <Link href={`/p/${post.id}`} target="_blank"
                        className="p-1.5 text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                        title="View product page">
                        <ExternalLink size={14} />
                      </Link>
                      <button onClick={() => deletePost(post.id)}
                        className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
