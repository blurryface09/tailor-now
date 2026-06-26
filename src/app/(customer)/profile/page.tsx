'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Profile, Measurements } from '@/types'
import toast from 'react-hot-toast'
import { Ruler, User, Phone, MapPin } from 'lucide-react'

const MEASUREMENT_FIELDS = [
  { key: 'chest', label: 'Chest (inches)' },
  { key: 'waist', label: 'Waist (inches)' },
  { key: 'hips', label: 'Hips (inches)' },
  { key: 'inseam', label: 'Inseam (inches)' },
  { key: 'shoulder', label: 'Shoulder (inches)' },
  { key: 'sleeve_length', label: 'Sleeve length (inches)' },
  { key: 'neck', label: 'Neck (inches)' },
  { key: 'thigh', label: 'Thigh (inches)' },
  { key: 'ankle', label: 'Ankle (inches)' },
  { key: 'back_length', label: 'Back length (inches)' },
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

  if (!profile) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" /></div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 text-2xl font-bold">
              {profile.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile.full_name}</h1>
              <p className="text-sm text-gray-500">{profile.email || profile.phone}</p>
            </div>
          </div>
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
        <div id="measurements" className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Ruler size={20} className="text-violet-700" />
            <h2 className="text-lg font-bold text-gray-900">My Measurements</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">Saved measurements are automatically shared with tailors when you place an order.</p>
          <form onSubmit={saveMeasurements}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {MEASUREMENT_FIELDS.map(f => (
                <Input key={f.key} label={f.label} type="number" step="0.5" min="0"
                  value={(measurements as Record<string, unknown>)[f.key] as string || ''}
                  onChange={e => setMeasurements(m => ({ ...m, [f.key]: e.target.value ? parseFloat(e.target.value) : null }))} />
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes for tailors</label>
              <textarea className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
                rows={3} placeholder="e.g. I have broad shoulders, prefer extra room in chest..."
                value={measurements.notes || ''}
                onChange={e => setMeasurements(m => ({ ...m, notes: e.target.value }))} />
            </div>
            <Button type="submit" loading={savingMeasurements}><Ruler size={16} /> Save Measurements</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
