'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { ImageUpload } from '@/components/ui/image-upload'
import { FABRIC_TYPE_LABELS } from '@/types'
import type { Fabric, FabricType } from '@/types'
import { Plus, X, Trash2, Edit2, Package, ToggleLeft, ToggleRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const FABRIC_TYPES = Object.entries(FABRIC_TYPE_LABELS) as [FabricType, string][]
const PATTERNS = ['solid', 'print', 'stripe', 'check', 'floral', 'geometric', 'embroidered', 'lace']

const EMPTY_FORM = {
  name: '', fabric_type: 'ankara' as FabricType, colors: '',
  pattern: 'solid', image_urls: [] as string[],
  price_per_yard: '', yards_in_stock: '', min_yards: '2',
  is_available: true, description: '',
}

export default function AdminFabricsPage() {
  const supabase = createClient()
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Fabric | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [filterType, setFilterType] = useState('')

  useEffect(() => { loadFabrics() }, [])

  const loadFabrics = async () => {
    const { data } = await supabase.from('fabrics').select('*').order('created_at', { ascending: false })
    setFabrics(data || [])
    setLoading(false)
  }

  const openAdd = () => {
    setForm({ ...EMPTY_FORM })
    setEditing(null)
    setAdding(true)
  }

  const openEdit = (f: Fabric) => {
    setForm({
      name: f.name, fabric_type: f.fabric_type, colors: f.colors.join(', '),
      pattern: f.pattern, image_urls: f.image_urls,
      price_per_yard: String(f.price_per_yard), yards_in_stock: String(f.yards_in_stock),
      min_yards: String(f.min_yards), is_available: f.is_available,
      description: f.description || '',
    })
    setEditing(f)
    setAdding(true)
  }

  const closeForm = () => { setAdding(false); setEditing(null) }

  const saveFabric = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.fabric_type || !form.price_per_yard) {
      toast.error('Name, type, and price are required'); return
    }
    if (form.image_urls.length === 0) { toast.error('Add at least one photo'); return }
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      fabric_type: form.fabric_type,
      colors: form.colors.split(',').map(c => c.trim()).filter(Boolean),
      pattern: form.pattern,
      image_urls: form.image_urls,
      price_per_yard: parseFloat(form.price_per_yard),
      yards_in_stock: parseFloat(form.yards_in_stock || '0'),
      min_yards: parseFloat(form.min_yards || '2'),
      is_available: form.is_available,
      description: form.description.trim() || null,
    }

    const { error } = editing
      ? await supabase.from('fabrics').update(payload).eq('id', editing.id)
      : await supabase.from('fabrics').insert(payload)

    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success(editing ? 'Fabric updated!' : 'Fabric added to catalogue!')
    closeForm()
    loadFabrics()
    setSaving(false)
  }

  const deleteFabric = async (id: string) => {
    if (!confirm('Remove this fabric from the catalogue?')) return
    await supabase.from('fabrics').delete().eq('id', id)
    setFabrics(prev => prev.filter(f => f.id !== id))
    toast.success('Removed')
  }

  const toggleAvailability = async (f: Fabric) => {
    await supabase.from('fabrics').update({ is_available: !f.is_available }).eq('id', f.id)
    setFabrics(prev => prev.map(x => x.id === f.id ? { ...x, is_available: !x.is_available } : x))
  }

  const displayed = filterType ? fabrics.filter(f => f.fabric_type === filterType) : fabrics

  return (
    <div className="min-h-screen bg-[#09090B]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/3 w-96 h-96 bg-amber-600/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl" />
      </div>
      <Navbar />

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 text-zinc-500 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors">
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Package size={22} className="text-amber-400" /> Fabric Catalogue
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {fabrics.length} fabrics · {fabrics.filter(f => f.is_available).length} available
              </p>
            </div>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black px-5 py-2.5 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-amber-500/30 text-sm">
            <Plus size={16} /> Add Fabric
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[['', 'All'], ...FABRIC_TYPES].map(([val, label]) => (
            <button key={val} onClick={() => setFilterType(val as string)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${filterType === val ? 'bg-amber-400 text-black border-amber-400' : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Form panel */}
        {adding && (
          <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 mb-8 shadow-2xl"
            style={{ animation: 'fade-up 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-white text-lg">{editing ? 'Edit fabric' : 'Add new fabric'}</h2>
              <button onClick={closeForm} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveFabric}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <ImageUpload
                    bucket="portfolio"
                    folder="fabrics"
                    value={form.image_urls}
                    onChange={v => setForm(f => ({ ...f, image_urls: v }))}
                    maxFiles={5}
                    label="Fabric photos"
                    hint="Show the fabric texture clearly — multiple angles"
                  />
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Fabric name</label>
                    <input className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 transition-all"
                      placeholder="e.g. Deep Navy Ankara, Ivory Silk Crepe…"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>

                  {/* Type + Pattern */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Type</label>
                      <select className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/60 transition-all"
                        value={form.fabric_type} onChange={e => setForm(f => ({ ...f, fabric_type: e.target.value as FabricType }))}>
                        {FABRIC_TYPES.map(([k, v]) => <option key={k} value={k} className="bg-zinc-900">{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Pattern</label>
                      <select className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/60 transition-all"
                        value={form.pattern} onChange={e => setForm(f => ({ ...f, pattern: e.target.value }))}>
                        {PATTERNS.map(p => <option key={p} value={p} className="bg-zinc-900 capitalize">{p}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Colors <span className="text-zinc-600">(comma-separated)</span></label>
                    <input className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 transition-all"
                      placeholder="Navy, White, Gold"
                      value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} />
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Price/yard (₦)</label>
                      <input type="number" min="0" className="w-full rounded-xl bg-white/[0.06] border border-amber-500/30 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 transition-all"
                        placeholder="2500"
                        value={form.price_per_yard} onChange={e => setForm(f => ({ ...f, price_per_yard: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">In stock (yds)</label>
                      <input type="number" min="0" className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 transition-all"
                        placeholder="50"
                        value={form.yards_in_stock} onChange={e => setForm(f => ({ ...f, yards_in_stock: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Min yards</label>
                      <input type="number" min="1" className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 transition-all"
                        placeholder="2"
                        value={form.min_yards} onChange={e => setForm(f => ({ ...f, min_yards: e.target.value }))} />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description <span className="text-zinc-600">(optional)</span></label>
                    <textarea className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60 transition-all resize-none"
                      rows={2} placeholder="Weight, feel, best use cases…"
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>

                  {/* Availability */}
                  <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.07] rounded-xl">
                    <span className="text-sm font-medium text-zinc-300">Available to customers</span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}>
                      {form.is_available
                        ? <ToggleRight size={28} className="text-amber-400" />
                        : <ToggleLeft size={28} className="text-zinc-600" />}
                    </button>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={closeForm}
                      className="flex-1 py-3 rounded-xl border border-white/[0.1] text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black transition-all shadow-lg shadow-amber-500/30 text-sm">
                      {saving ? <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : (editing ? 'Save changes' : 'Add to catalogue')}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Fabrics grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/[0.04] rounded-2xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-24 bg-white/[0.03] rounded-3xl border border-white/[0.07]">
            <div className="text-5xl mb-4">🧵</div>
            <h3 className="font-bold text-white mb-2">No fabrics yet</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">Add your first fabric to the catalogue so customers can choose when placing orders</p>
            <button onClick={openAdd}
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/30 text-sm">
              <Plus size={16} /> Add First Fabric
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayed.map((fabric, idx) => (
              <div key={fabric.id}
                className="group relative bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-amber-500/20 transition-all duration-300"
                style={{ animation: 'fade-up 0.4s ease both', animationDelay: `${idx * 40}ms` }}>
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden relative">
                  {fabric.image_urls[0]
                    ? <img src={fabric.image_urls[0]} alt={fabric.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <div className="w-full h-full bg-white/[0.05] flex items-center justify-center text-3xl">🧵</div>
                  }
                  {/* Unavailable overlay */}
                  {!fabric.is_available && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-xs font-bold text-zinc-400 bg-black/60 px-3 py-1.5 rounded-full border border-white/[0.1]">OUT OF STOCK</span>
                    </div>
                  )}
                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(fabric)}
                      className="p-1.5 bg-black/70 text-zinc-300 hover:text-white rounded-lg backdrop-blur-sm transition-colors">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => deleteFabric(fabric.id)}
                      className="p-1.5 bg-black/70 text-zinc-300 hover:text-red-400 rounded-lg backdrop-blur-sm transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-bold text-white text-sm truncate mb-0.5">{fabric.name}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-500 capitalize">{FABRIC_TYPE_LABELS[fabric.fabric_type] ?? fabric.fabric_type}</span>
                    <span className="text-xs font-black text-amber-400">₦{fabric.price_per_yard.toLocaleString()}/yd</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-600">{fabric.yards_in_stock} yds left</span>
                    <button onClick={() => toggleAvailability(fabric)} className="transition-colors">
                      {fabric.is_available
                        ? <ToggleRight size={20} className="text-amber-400" />
                        : <ToggleLeft size={20} className="text-zinc-600" />}
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
