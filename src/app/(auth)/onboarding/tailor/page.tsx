'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SERVICE_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

const SERVICE_ICONS: Record<string, string> = { custom_outfit: '👗', alterations: '✂️', bridal: '💍', ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔' }

export default function TailorOnboarding() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    business_name: '', bio: '', city: '', state: '', address: '',
    specialties: [] as string[], delivery_types: [] as string[],
  })

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('tailor_profiles').insert({
      user_id: user.id,
      business_name: form.business_name,
      bio: form.bio || null,
      city: form.city,
      state: form.state,
      address: form.address || null,
      specialties: form.specialties,
      delivery_types: form.delivery_types,
    })

    if (error) { toast.error(error.message); setLoading(false); return }
    await supabase.from('profiles').update({ role: 'tailor' }).eq('id', user.id)
    toast.success('Profile created! Welcome to TailorNow 🎉')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-violet-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">TN</span>
            </div>
            <span className="font-bold text-gray-900 text-xl">Tailor<span className="text-violet-700">Now</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Set up your tailor profile</h1>
          <p className="text-gray-500 mt-1">This is what customers will see when they find you</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Business name" placeholder="e.g. Lagos Stitch & Style" value={form.business_name}
              onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} required />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">About your business</label>
              <textarea className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                rows={3} placeholder="Tell customers about your experience, style, and what makes you special..."
                value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="City" placeholder="Lagos" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
              <Input label="State" placeholder="Lagos State" value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))} required />
            </div>

            <Input label="Shop/Work address (optional)" placeholder="Shop address" value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What services do you offer?</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                  <button key={k} type="button"
                    onClick={() => setForm(f => ({ ...f, specialties: toggle(f.specialties, k) }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border-2 transition-all ${form.specialties.includes(k) ? 'border-violet-600 bg-violet-50 text-violet-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {SERVICE_ICONS[k]} {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How do you work with customers?</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ val: 'pickup_delivery', label: '🚚 Pickup & Delivery', sub: 'Collect fabric, deliver finished item' },
                  { val: 'visit_shop', label: '🏪 Visit My Shop', sub: 'Customers come to you' }].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setForm(f => ({ ...f, delivery_types: toggle(f.delivery_types, opt.val) }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${form.delivery_types.includes(opt.val) ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={loading}
              disabled={!form.business_name || !form.city || !form.state || form.specialties.length === 0}>
              Create Tailor Profile →
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
