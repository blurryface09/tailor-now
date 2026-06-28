'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SERVICE_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { CheckCircle, ArrowLeft } from 'lucide-react'

const SERVICE_ICONS: Record<string, string> = {
  custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
]

export default function EditCreativeProfile() {
  const router = useRouter()
  const supabase = createClient()
  const [tailorId, setTailorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    business_name: '',
    bio: '',
    city: '',
    state: '',
    address: '',
    specialties: [] as string[],
    delivery_types: [] as string[],
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'tailor') { router.push('/home'); return }
      const { data: tailor } = await supabase.from('tailor_profiles').select('*').eq('user_id', user.id).single()
      if (!tailor) { router.push('/onboarding/tailor'); return }
      setTailorId(tailor.id)
      setForm({
        business_name: tailor.business_name || '',
        bio: tailor.bio || '',
        city: tailor.city || '',
        state: tailor.state || '',
        address: tailor.address || '',
        specialties: tailor.specialties || [],
        delivery_types: tailor.delivery_types || [],
      })
      setLoading(false)
    })
  }, [])

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const canSave =
    form.business_name.trim().length >= 2 &&
    form.bio.trim().length >= 20 &&
    form.city.trim() &&
    form.state.trim() &&
    form.specialties.length > 0 &&
    form.delivery_types.length > 0

  const handleSave = async () => {
    if (!tailorId) return
    setSaving(true)
    const { error } = await supabase.from('tailor_profiles').update({
      business_name: form.business_name.trim(),
      bio: form.bio.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      address: form.address.trim() || null,
      specialties: form.specialties,
      delivery_types: form.delivery_types,
    }).eq('id', tailorId)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Profile updated!')
    router.push(`/tailors/${tailorId}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex justify-center py-24">
        <div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href={tailorId ? `/tailors/${tailorId}` : '/dashboard'} className="p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-500">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-sm text-gray-500">This is what customers see on your public page</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Business Info</h2>
            <Input label="Business name *" placeholder="e.g. Lagos Stitch & Style"
              value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City *" placeholder="e.g. Ikeja"
                value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                <select
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                >
                  <option value="">— Select state —</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <Input label="Shop address (optional)" placeholder="Shop number / street"
              value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                About your business * <span className="font-normal text-gray-400 text-xs">(min 20 characters)</span>
              </label>
              <textarea
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                rows={4}
                placeholder="Tell customers about your experience, style, specialties, and what makes you stand out..."
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              />
              <p className={`text-xs mt-1 ${form.bio.trim().length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                {form.bio.trim().length} / 20 minimum characters
              </p>
            </div>
          </div>

          {/* Specialties */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Specialties *</h2>
            <p className="text-sm text-gray-500 mb-4">Select all that apply.</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                <button key={k} type="button"
                  onClick={() => setForm(f => ({ ...f, specialties: toggle(f.specialties, k) }))}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border-2 transition-all duration-200 ${
                    form.specialties.includes(k)
                      ? 'border-violet-600 bg-violet-50 text-violet-700 font-semibold'
                      : 'border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600'
                  }`}>
                  {SERVICE_ICONS[k]} {v}
                  {form.specialties.includes(k) && <CheckCircle size={13} className="text-violet-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery types */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">How you work *</h2>
            <p className="text-sm text-gray-500 mb-4">You can offer both options.</p>
            <div className="space-y-3">
              {[
                { val: 'pickup_delivery', icon: '🚚', label: 'Pickup & Delivery', sub: 'You collect fabric and deliver the finished item' },
                { val: 'visit_shop', icon: '🏪', label: 'Visit My Shop', sub: 'Customers come to your workshop or shop' },
              ].map(opt => (
                <button key={opt.val} type="button"
                  onClick={() => setForm(f => ({ ...f, delivery_types: toggle(f.delivery_types, opt.val) }))}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    form.delivery_types.includes(opt.val) ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                  }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                    </div>
                    {form.delivery_types.includes(opt.val) && <CheckCircle size={18} className="text-violet-600 flex-shrink-0 mt-0.5" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button size="lg" className="w-full" loading={saving} disabled={!canSave} onClick={handleSave}>
            Save Changes
          </Button>
          {!canSave && (
            <p className="text-xs text-center text-amber-600">Fill in all required fields to save (bio needs at least 20 characters)</p>
          )}
        </div>
      </div>
    </div>
  )
}
