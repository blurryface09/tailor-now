'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SERVICE_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Search, UserPlus } from 'lucide-react'

const SERVICE_ICONS: Record<string, string> = {
  custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

const toggle = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

export default function AdminOnboardTailorPage() {
  const supabase = createClient()

  // Step 1: find the user
  const [emailSearch, setEmailSearch] = useState('')
  const [foundUser, setFoundUser] = useState<{ id: string; full_name: string; email: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // Step 2: tailor profile
  const [form, setForm] = useState({
    business_name: '', bio: '', city: '', state: '', address: '',
    specialties: [] as string[], delivery_types: [] as string[],
    response_time_hours: '2',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const searchUser = async () => {
    if (!emailSearch.trim()) return
    setSearching(true)
    setNotFound(false)
    setFoundUser(null)

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', emailSearch.trim())
      .single()

    setSearching(false)
    if (!data) { setNotFound(true); return }
    setFoundUser(data)
    setForm(f => ({ ...f, business_name: data.full_name || '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foundUser) return
    if (!form.business_name.trim() || !form.city.trim() || !form.state.trim()) {
      toast.error('Business name, city and state are required')
      return
    }
    if (form.specialties.length === 0) { toast.error('Select at least one service'); return }
    if (form.delivery_types.length === 0) { toast.error('Select at least one work type'); return }

    setSubmitting(true)

    // Check if tailor profile already exists
    const { data: existing } = await supabase
      .from('tailor_profiles')
      .select('id')
      .eq('user_id', foundUser.id)
      .single()

    if (existing) {
      toast.error('This user already has a tailor profile')
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from('tailor_profiles').insert({
      user_id: foundUser.id,
      business_name: form.business_name.trim(),
      bio: form.bio.trim() || null,
      city: form.city.trim(),
      state: form.state.trim(),
      address: form.address.trim() || null,
      specialties: form.specialties,
      delivery_types: form.delivery_types,
      response_time_hours: parseInt(form.response_time_hours) || 2,
      is_verified: true,
    })

    if (error) { toast.error(error.message); setSubmitting(false); return }

    await supabase.from('profiles').update({ role: 'tailor' }).eq('id', foundUser.id)
    toast.success('Creative onboarded and verified!')
    setDone(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Onboard a Creative</h1>
            <p className="text-sm text-gray-500">Find a registered user and set them up as a verified creative</p>
          </div>
        </div>

        {done ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Creative onboarded!</h2>
            <p className="text-gray-500 text-sm mb-6">{foundUser?.full_name} is now a verified creative on TailorNow.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { setDone(false); setFoundUser(null); setEmailSearch(''); setForm({ business_name: '', bio: '', city: '', state: '', address: '', specialties: [], delivery_types: [], response_time_hours: '2' }) }}
                className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Onboard another
              </button>
              <Link href="/admin/tailors" className="px-5 py-2.5 text-sm font-semibold bg-violet-700 text-white rounded-xl hover:bg-violet-800 transition-colors">
                View all tailors
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Step 1: Find user */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-700 text-white text-xs flex items-center justify-center font-bold">1</span>
                Find the user account
              </h2>
              <p className="text-sm text-gray-500 mb-4">The person must have already signed up on TailorNow.</p>

              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="tailor@example.com"
                    value={emailSearch}
                    onChange={e => { setEmailSearch(e.target.value); setNotFound(false); setFoundUser(null) }}
                    onKeyDown={e => e.key === 'Enter' && searchUser()}
                  />
                </div>
                <div className="pt-[26px]">
                  <Button onClick={searchUser} loading={searching} type="button">
                    <Search size={16} /> Search
                  </Button>
                </div>
              </div>

              {notFound && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  No account found with that email. Ask them to sign up at <strong>tailornow.com/signup</strong> first.
                </div>
              )}

              {foundUser && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">{foundUser.full_name}</p>
                    <p className="text-xs text-green-700">{foundUser.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Tailor profile details */}
            {foundUser && (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-violet-700 text-white text-xs flex items-center justify-center font-bold">2</span>
                  Set up their creative profile
                </h2>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  This profile will be auto-verified. The creative can update their bio, portfolio and pricing after logging in.
                </p>

                <Input label="Business name *" placeholder="e.g. Lagos Stitch & Style" value={form.business_name}
                  onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} required />

                <div className="grid grid-cols-2 gap-3">
                  <Input label="City *" placeholder="Lagos" value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
                  <Input label="State *" placeholder="Lagos State" value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))} required />
                </div>

                <Input label="Shop address (optional)" placeholder="Street / shop number" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />

                <Input label="Avg response time (hours)" type="number" min="1" max="72" value={form.response_time_hours}
                  onChange={e => setForm(f => ({ ...f, response_time_hours: e.target.value }))} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio (optional)</label>
                  <textarea className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    rows={3} placeholder="Short description of the creative's work and experience..."
                    value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Services offered *</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                      <button key={k} type="button"
                        onClick={() => setForm(f => ({ ...f, specialties: toggle(f.specialties, k) }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                          form.specialties.includes(k) ? 'border-violet-600 bg-violet-50 text-violet-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-violet-300'
                        }`}>
                        {SERVICE_ICONS[k]} {v}
                        {form.specialties.includes(k) && <CheckCircle size={12} className="text-violet-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How they work with customers *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: 'pickup_delivery', icon: '🚚', label: 'Pickup & Delivery' },
                      { val: 'visit_shop',      icon: '🏪', label: 'Visit Shop' },
                    ].map(opt => (
                      <button key={opt.val} type="button"
                        onClick={() => setForm(f => ({ ...f, delivery_types: toggle(f.delivery_types, opt.val) }))}
                        className={`p-3 rounded-xl border-2 text-left flex items-center gap-2 transition-all ${
                          form.delivery_types.includes(opt.val) ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600 hover:border-violet-300'
                        }`}>
                        <span className="text-lg">{opt.icon}</span>
                        <span className="text-sm font-medium">{opt.label}</span>
                        {form.delivery_types.includes(opt.val) && <CheckCircle size={14} className="ml-auto text-violet-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" loading={submitting}>
                  <UserPlus size={16} /> Onboard & Verify Creative
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
