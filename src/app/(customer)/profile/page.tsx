'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Profile, Measurements } from '@/types'
import toast from 'react-hot-toast'
import { Ruler, User, Phone, MapPin, CheckCircle } from 'lucide-react'

const MEASUREMENT_FIELDS = [
  { key: 'chest',         label: 'Chest',         hint: 'Fullest part of chest' },
  { key: 'waist',         label: 'Waist',         hint: 'Natural waistline' },
  { key: 'hips',          label: 'Hips',          hint: 'Fullest part of hips' },
  { key: 'inseam',        label: 'Inseam',        hint: 'Crotch to ankle' },
  { key: 'shoulder',      label: 'Shoulder',      hint: 'Shoulder tip to tip' },
  { key: 'sleeve_length', label: 'Sleeve',        hint: 'Shoulder to wrist' },
  { key: 'neck',          label: 'Neck',          hint: 'Around base of neck' },
  { key: 'thigh',         label: 'Thigh',         hint: 'Fullest part of thigh' },
  { key: 'ankle',         label: 'Ankle',         hint: 'Around ankle bone' },
  { key: 'back_length',   label: 'Back Length',   hint: 'Nape of neck to waist' },
]

export default function ProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [measurements, setMeasurements] = useState<Partial<Measurements>>({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingMeasurements, setSavingMeasurements] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
        supabase.from('measurements').select('*').eq('user_id', user.id).single().then(({ data }) => {
          if (data) setMeasurements(data)
        })
      }
    })
  }, [])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSavingProfile(true)
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name, phone: profile.phone,
      address: profile.address, city: profile.city, state: profile.state,
    }).eq('id', profile.id)
    if (error) toast.error(error.message)
    else toast.success('Profile saved!')
    setSavingProfile(false)
  }

  const saveMeasurements = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSavingMeasurements(true)
    const { error } = await supabase.from('measurements').upsert({
      ...measurements, user_id: profile.id, updated_at: new Date().toISOString(),
    })
    if (error) toast.error(error.message)
    else toast.success('Measurements saved!')
    setSavingMeasurements(false)
  }

  const filled = MEASUREMENT_FIELDS.filter(f => (measurements as Record<string, unknown>)[f.key]).length
  const pct = Math.round((filled / MEASUREMENT_FIELDS.length) * 100)

  if (!profile) return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" /></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Profile header */}
        <div className="bg-gradient-to-br from-violet-700 to-violet-900 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl font-black">
              {profile.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold">{profile.full_name}</h1>
              <p className="text-violet-300 text-sm">{profile.email || profile.phone}</p>
              <span className="inline-block mt-1 text-xs bg-white/20 px-2.5 py-0.5 rounded-full capitalize">{profile.role}</span>
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6">
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2"><User size={18} className="text-violet-600" /> Personal Details</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <Input label="Full name" value={profile.full_name || ''} icon={<User size={16} />}
              onChange={e => setProfile(p => p ? { ...p, full_name: e.target.value } : p)} />
            <Input label="Phone number" type="tel" value={profile.phone || ''} icon={<Phone size={16} />}
              onChange={e => setProfile(p => p ? { ...p, phone: e.target.value } : p)} />
            <Input label="Address" value={profile.address || ''} icon={<MapPin size={16} />}
              onChange={e => setProfile(p => p ? { ...p, address: e.target.value } : p)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" value={profile.city || ''}
                onChange={e => setProfile(p => p ? { ...p, city: e.target.value } : p)} />
              <Input label="State" value={profile.state || ''}
                onChange={e => setProfile(p => p ? { ...p, state: e.target.value } : p)} />
            </div>
            <Button type="submit" loading={savingProfile}>Save Profile</Button>
          </form>
        </div>

        {/* Measurements */}
        <div id="measurements" className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Ruler size={18} className="text-violet-600" /> My Measurements
            </h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pct === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-400'}`}>
              {filled}/{MEASUREMENT_FIELDS.length} filled
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/[0.06] rounded-full h-2 mb-1 mt-3">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct === 100 ? '#16a34a' : '#7c3aed' }}
            />
          </div>
          <p className="text-xs text-zinc-600 mb-5">
            {pct === 100
              ? <span className="text-green-400 font-medium flex items-center gap-1"><CheckCircle size={12} /> All measurements saved — tailors can use them automatically</span>
              : 'Fill in your measurements once and they\'ll be shared with tailors on every order.'}
          </p>

          {/* Guide tip */}
          <div className="bg-violet-50 border border-violet-500/20 rounded-xl px-4 py-3 mb-5 text-xs text-violet-700">
            <span className="font-semibold">How to measure:</span> Use a soft tape measure. Measure in inches, standing straight in light clothing. Ask someone to help for accuracy.
          </div>

          <form onSubmit={saveMeasurements}>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {MEASUREMENT_FIELDS.map(f => {
                const val = (measurements as Record<string, unknown>)[f.key]
                const isFilled = val !== undefined && val !== null && val !== ''
                return (
                  <div key={f.key} className="relative">
                    <Input
                      label={`${f.label} (inches)`}
                      type="number" step="0.5" min="0"
                      placeholder={f.hint}
                      value={val as string || ''}
                      onChange={e => setMeasurements(m => ({ ...m, [f.key]: e.target.value ? parseFloat(e.target.value) : null }))}
                    />
                    {isFilled && (
                      <CheckCircle size={13} className="absolute right-3 top-[38px] text-green-500 pointer-events-none" />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Notes for tailors</label>
              <textarea
                className="w-full rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                rows={3}
                placeholder="e.g. broad shoulders, prefer extra room in chest, petite frame..."
                value={measurements.notes || ''}
                onChange={e => setMeasurements(m => ({ ...m, notes: e.target.value }))}
              />
            </div>
            <Button type="submit" loading={savingMeasurements}><Ruler size={16} /> Save Measurements</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
