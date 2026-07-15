'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SERVICE_LABELS, formatCurrency } from '@/lib/utils'
import type { TailorService } from '@/types'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

export default function PricingPage() {
  const supabase = createClient()
  const [services, setServices] = useState<TailorService[]>([])
  const [tailorId, setTailorId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const emptyForm = { service_type: 'custom_outfit', title: '', description: '', base_price: '', min_days: '3', max_days: '14', price_negotiable: true }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('tailor_profiles').select('id').eq('user_id', user.id).single().then(({ data }) => {
        if (data) { setTailorId(data.id); loadServices(data.id) }
      })
    })
  }, [])

  const loadServices = async (tid: string) => {
    const { data } = await supabase.from('tailor_services').select('*').eq('tailor_id', tid).order('created_at')
    setServices(data || [])
  }

  const saveService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tailorId) return
    const payload = {
      tailor_id: tailorId,
      service_type: form.service_type,
      title: form.title,
      description: form.description || null,
      base_price: parseFloat(form.base_price),
      min_days: parseInt(form.min_days),
      max_days: parseInt(form.max_days),
      price_negotiable: form.price_negotiable,
    }
    if (editingId) {
      const { error } = await supabase.from('tailor_services').update(payload).eq('id', editingId)
      if (error) { toast.error(error.message); return }
      toast.success('Service updated!')
    } else {
      const { error } = await supabase.from('tailor_services').insert(payload)
      if (error) { toast.error(error.message); return }
      toast.success('Service added!')
    }
    setForm(emptyForm); setAdding(false); setEditingId(null); loadServices(tailorId)
  }

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return
    await supabase.from('tailor_services').delete().eq('id', id)
    setServices(services.filter(s => s.id !== id))
    toast.success('Deleted')
  }

  const startEdit = (s: TailorService) => {
    setForm({ service_type: s.service_type, title: s.title, description: s.description || '', base_price: String(s.base_price), min_days: String(s.min_days), max_days: String(s.max_days), price_negotiable: s.price_negotiable })
    setEditingId(s.id); setAdding(true)
  }

  const SERVICE_ICONS: Record<string, string> = { street_wear: '🧢', custom_outfit: '👗', alterations: '✂️', bridal: '💍', ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔' }

  return (
    <div className="min-h-screen bg-[#140F1E]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Services & Pricing</h1>
            <p className="text-sm text-zinc-500">Set what you offer and your rates</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setEditingId(null); setAdding(true) }} size="md">
            <Plus size={16} /> Add Service
          </Button>
        </div>

        {/* Form */}
        {adding && (
          <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">{editingId ? 'Edit Service' : 'New Service'}</h2>
              <button onClick={() => { setAdding(false); setEditingId(null) }}><X size={18} className="text-zinc-600" /></button>
            </div>
            <form onSubmit={saveService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Service type</label>
                <select className="w-full rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}>
                  {Object.entries(SERVICE_LABELS).map(([k, v]) => <option key={k} value={k}>{SERVICE_ICONS[k]} {v}</option>)}
                </select>
              </div>
              <Input label="Service title" placeholder="e.g. Custom agbada & isiagu" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description (optional)</label>
                <textarea className="w-full rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Base price (₦)" type="number" placeholder="e.g. 15000" value={form.base_price}
                  onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} required />
                <Input label="Min days" type="number" min="1" value={form.min_days}
                  onChange={e => setForm(f => ({ ...f, min_days: e.target.value }))} required />
                <Input label="Max days" type="number" min="1" value={form.max_days}
                  onChange={e => setForm(f => ({ ...f, max_days: e.target.value }))} required />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.price_negotiable} onChange={e => setForm(f => ({ ...f, price_negotiable: e.target.checked }))}
                  className="w-4 h-4 rounded accent-violet-700" />
                <span className="text-sm text-zinc-300">Price is negotiable</span>
              </label>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => { setAdding(false); setEditingId(null) }}>Cancel</Button>
                <Button type="submit" disabled={!form.title || !form.base_price}>
                  <Check size={16} /> {editingId ? 'Save Changes' : 'Add Service'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {services.length === 0 && !adding ? (
          <div className="text-center py-20 bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08]">
            <div className="text-5xl mb-3">✂️</div>
            <h3 className="font-semibold text-white mb-2">No services yet</h3>
            <p className="text-zinc-500 text-sm mb-4">Add the services you offer so customers can book you</p>
            <Button onClick={() => setAdding(true)}><Plus size={16} /> Add First Service</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map(s => (
              <div key={s.id} className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{SERVICE_ICONS[s.service_type]}</span>
                      <h3 className="font-semibold text-white">{s.title}</h3>
                      <span className="text-xs bg-violet-50 text-violet-400 px-2 py-0.5 rounded-full">{SERVICE_LABELS[s.service_type]}</span>
                    </div>
                    {s.description && <p className="text-sm text-zinc-400 mb-2">{s.description}</p>}
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span>⏱ {s.min_days}–{s.max_days} days</span>
                      {s.price_negotiable && <span>🤝 Negotiable</span>}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xl font-bold text-violet-700">{formatCurrency(s.base_price)}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => startEdit(s)} className="p-1.5 text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => deleteService(s.id)} className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
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
