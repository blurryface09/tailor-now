'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SERVICE_LABELS } from '@/lib/utils'
import type { PortfolioItem } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Sparkles, Trash2, Upload, X } from 'lucide-react'

export default function PortfolioPage() {
  const supabase = createClient()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [tailorId, setTailorId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [polishing, setPolishing] = useState(false)
  const [originalImageUrl, setOriginalImageUrl] = useState('')
  const [form, setForm] = useState({ title: '', description: '', service_type: '', image_url: '' })

  const loadPortfolio = async (tid: string) => {
    const { data } = await supabase.from('portfolio_items').select('*').eq('tailor_id', tid).order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        supabase.from('tailor_profiles').select('id').eq('user_id', user.id).single().then(({ data }) => {
          if (data) {
            setTailorId(data.id)
            loadPortfolio(data.id)
          }
        })
      }
    })
  }, [])

  const uploadImage = async (file: File) => {
    if (!userId) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `portfolio/${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('portfolio').upload(path, file)
    if (error) { toast.error(error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(path)
    setOriginalImageUrl(publicUrl)
    setForm(f => ({ ...f, image_url: publicUrl, title: f.title || `Portfolio photo ${items.length + 1}` }))
    setUploading(false)
    toast.success('Image uploaded!')
  }

  const polishPhoto = async () => {
    if (!form.image_url) { toast.error('Upload a photo first'); return }
    setPolishing(true)
    try {
      const res = await fetch('/api/ai/polish-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: form.image_url,
          title: form.title,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Could not polish this photo')
        return
      }
      setForm(f => ({ ...f, image_url: data.imageUrl }))
      toast.success('Showroom photo ready!')
    } catch {
      toast.error('Could not polish this photo. Please try again.')
    } finally {
      setPolishing(false)
    }
  }

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tailorId) return
    const { error } = await supabase.from('portfolio_items').insert({
      tailor_id: tailorId,
      title: form.title.trim() || `Portfolio photo ${items.length + 1}`,
      description: form.description || null,
      service_type: form.service_type || null,
      image_url: form.image_url,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Portfolio item added!')
    setForm({ title: '', description: '', service_type: '', image_url: '' })
    setOriginalImageUrl('')
    setAdding(false)
    loadPortfolio(tailorId)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this portfolio item?')) return
    await supabase.from('portfolio_items').delete().eq('id', id)
    setItems(items.filter(i => i.id !== id))
    toast.success('Deleted')
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Portfolio</h1>
            <p className="text-zinc-500 text-sm">Showcase your best work to attract customers</p>
          </div>
          <Button onClick={() => setAdding(true)} size="md">
            <Plus size={16} /> Add Photo
          </Button>
        </div>

        {/* Add form */}
        {adding && (
          <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Add Portfolio Item</h2>
              <button onClick={() => setAdding(false)}><X size={18} className="text-zinc-600" /></button>
            </div>
            <form onSubmit={addItem} className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Photo</label>
                {form.image_url ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative h-48 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] sm:w-36">
                      <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                      <button type="button"
                        onClick={() => {
                          setForm(f => ({ ...f, image_url: '' }))
                          setOriginalImageUrl('')
                        }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-bold text-violet-200">
                        <Sparkles size={13} /> Showroom polish
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                        Make this upload cleaner, sharper, and showroom ready while keeping the outfit design unchanged.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={polishPhoto} disabled={polishing || uploading}>
                          {polishing ? (
                            <span className="h-3 w-3 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                          ) : (
                            <Sparkles size={14} />
                          )}
                          {polishing ? 'Polishing...' : 'Polish for showroom'}
                        </Button>
                        {originalImageUrl && originalImageUrl !== form.image_url && (
                          <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, image_url: originalImageUrl }))}>
                            Use original
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-40 h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-violet-400 transition-colors">
                    {uploading ? (
                      <div className="animate-spin w-6 h-6 border-2 border-violet-700 border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Upload size={24} className="text-zinc-600 mb-1" />
                        <span className="text-xs text-zinc-600">Upload photo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                  </label>
                )}
              </div>

              <Input label="Title" placeholder="e.g. Custom agbada suit" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Service type</label>
                <select className="w-full rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}>
                  <option value="">— Select service —</option>
                  {Object.entries(SERVICE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description (optional)</label>
                <textarea className="w-full rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  rows={2} placeholder="Brief description of this piece..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setAdding(false)} size="md">Cancel</Button>
                <Button type="submit" size="md" disabled={!form.image_url}>Add to Portfolio</Button>
              </div>
            </form>
          </div>
        )}

        {/* Grid */}
        {items.length === 0 && !adding ? (
          <div className="text-center py-20 bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08]">
            <div className="text-5xl mb-3">📸</div>
            <h3 className="font-semibold text-white mb-2">Your portfolio is empty</h3>
            <p className="text-zinc-500 text-sm mb-4">Add photos of your best work to attract more customers</p>
            <Button onClick={() => setAdding(true)}><Plus size={16} /> Add First Photo</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="group bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
                <div className="aspect-square bg-violet-50 relative overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">✂️</div>
                  )}
                  <button onClick={() => deleteItem(item.id)}
                    className="absolute top-2 right-2 bg-red-500/100 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                  {item.service_type && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      {SERVICE_LABELS[item.service_type]}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  {item.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
