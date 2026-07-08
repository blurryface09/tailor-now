'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Download, Upload, Edit3, Save, X, Search, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { PortfolioItem } from '@/types'

type ItemWithCreative = PortfolioItem & {
  tailor: {
    id: string
    business_name: string | null
    user_id: string
    profile: { full_name: string | null; email: string | null } | null
  } | null
}

export default function AdminPortfolioPage() {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<ItemWithCreative[]>([])
  const [filtered, setFiltered] = useState<ItemWithCreative[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [replacingId, setReplacingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (p?.role !== 'admin') { router.push('/browse'); return }
      loadItems()
    })
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    if (!q) { setFiltered(items); return }
    setFiltered(items.filter(it =>
      it.title?.toLowerCase().includes(q) ||
      it.tailor?.business_name?.toLowerCase().includes(q) ||
      it.tailor?.profile?.full_name?.toLowerCase().includes(q) ||
      it.service_type?.toLowerCase().includes(q)
    ))
  }, [search, items])

  async function loadItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*, tailor:tailor_profiles(id, business_name, user_id, profile:profiles(full_name, email))')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) { toast.error(error.message); setLoading(false); return }
    setItems((data as ItemWithCreative[]) || [])
    setLoading(false)
  }

  const creativeName = (it: ItemWithCreative) =>
    it.tailor?.business_name || it.tailor?.profile?.full_name || 'Unknown creative'

  const startEdit = (it: ItemWithCreative) => {
    setEditingId(it.id)
    setEditTitle(it.title || '')
    setEditDesc(it.description || '')
  }

  const saveEdit = async (it: ItemWithCreative) => {
    setSavingId(it.id)
    const { error } = await supabase
      .from('portfolio_items')
      .update({ title: editTitle.trim() || it.title, description: editDesc.trim() || null })
      .eq('id', it.id)
    setSavingId(null)
    if (error) { toast.error(error.message); return }
    setItems(prev => prev.map(p => p.id === it.id ? { ...p, title: editTitle.trim() || it.title, description: editDesc.trim() || null } : p))
    setEditingId(null)
    toast.success('Updated')
  }

  const replaceImage = async (it: ItemWithCreative, file: File) => {
    setReplacingId(it.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `admin-portfolio/replacements/${it.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(path)

      const res = await fetch('/api/admin/portfolio/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioItemId: it.id, imageUrl: publicUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update portfolio item')

      setItems(prev => prev.map(p => p.id === it.id ? { ...p, image_url: publicUrl } : p))
      toast.success('Image replaced — live on their profile')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setReplacingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Creative Portfolio</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Download any image, polish it in Canva or Photoshop, then upload it back — it goes live on their profile immediately.
            </p>
          </div>
          <div className="text-xs text-zinc-400 bg-white border border-zinc-200 rounded-xl px-3 py-2 shadow-sm">
            {items.length} items from all creatives
          </div>
        </div>

        {/* Tip banner */}
        <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          <span className="font-semibold">No AI credits?</span> Click <span className="font-mono bg-violet-100 px-1 rounded">↓</span> to download an image, edit it in Canva / PhotoRoom / Photoshop, then click <span className="font-mono bg-violet-100 px-1 rounded">↑</span> to upload the polished version back. It replaces the original instantly.
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by creative name, title, or service type…"
            className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-zinc-200 animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200">
            <ImageIcon size={32} className="mx-auto mb-3 text-zinc-300" />
            <p className="text-sm text-zinc-500">{search ? 'No results for that search.' : 'No portfolio items yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(it => (
              <div key={it.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                {/* Image */}
                <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
                  {it.image_url
                    ? <img src={it.image_url} alt={it.title || ''} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-zinc-300"><ImageIcon size={28} /></div>
                  }
                  {it.service_type && (
                    <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                      {it.service_type.replace(/_/g, ' ')}
                    </div>
                  )}
                  {/* Download + Upload buttons over image */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                    {it.image_url && (
                      <a
                        href={it.image_url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        title="Download this image"
                        className="w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-emerald-600 text-white rounded-full transition-colors">
                        <Download size={14} />
                      </a>
                    )}
                    <label
                      title="Upload polished replacement"
                      className="w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-violet-600 text-white rounded-full transition-colors cursor-pointer">
                      {replacingId === it.id
                        ? <span className="block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        : <Upload size={14} />}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={replacingId === it.id}
                        ref={el => { fileInputRefs.current[it.id] = el }}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          e.currentTarget.value = ''
                          if (file) replaceImage(it, file)
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Info + edit */}
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide truncate">
                    {creativeName(it)}
                  </p>

                  {editingId === it.id ? (
                    <div className="space-y-1.5">
                      <input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <textarea
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        placeholder="Description"
                        rows={2}
                        className="w-full text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => saveEdit(it)}
                          disabled={savingId === it.id}
                          className="flex items-center gap-1 text-[10px] font-bold bg-violet-700 text-white px-2.5 py-1.5 rounded-lg hover:bg-violet-800 disabled:opacity-60">
                          <Save size={11} /> {savingId === it.id ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-[10px] text-zinc-500 px-2.5 py-1.5 rounded-lg hover:bg-zinc-100">
                          <X size={11} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-zinc-900 line-clamp-2 leading-snug">{it.title || 'Untitled'}</p>
                      {it.description && (
                        <p className="text-[11px] text-zinc-500 line-clamp-2 leading-snug">{it.description}</p>
                      )}
                      <button
                        onClick={() => startEdit(it)}
                        className="mt-auto flex items-center gap-1 text-[10px] text-zinc-400 hover:text-violet-600 transition-colors self-start">
                        <Edit3 size={11} /> Edit text
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
