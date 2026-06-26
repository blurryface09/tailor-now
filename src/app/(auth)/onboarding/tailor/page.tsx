'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'
import { SERVICE_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

const SERVICE_ICONS: Record<string, string> = {
  custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

const STEPS = ['Business Info', 'Services', 'How You Work']

export default function TailorOnboarding() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    business_name: '', bio: '', city: '', state: '', address: '',
    specialties: [] as string[], delivery_types: [] as string[],
  })

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const canNext = () => {
    if (step === 0) return form.business_name.trim().length >= 2 && form.city.trim() && form.state.trim()
    if (step === 1) return form.specialties.length > 0
    if (step === 2) return form.delivery_types.length > 0
    return false
  }

  const handleSubmit = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('tailor_profiles').insert({
      user_id: user.id,
      business_name: form.business_name.trim(),
      bio: form.bio.trim() || null,
      city: form.city.trim(),
      state: form.state.trim(),
      address: form.address.trim() || null,
      specialties: form.specialties,
      delivery_types: form.delivery_types,
    })

    if (error) { toast.error(error.message); setLoading(false); return }
    await supabase.from('profiles').update({ role: 'tailor' }).eq('id', user.id)
    toast.success('Profile created! Welcome to TailorNow.')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6 justify-center">
            <Logo size="md" variant="full" animated />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Set up your tailor profile</h1>
          <p className="text-gray-500 mt-1 text-sm">This is what customers see when they find you</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-violet-700 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block truncate transition-colors ${i === step ? 'text-violet-700' : i < step ? 'text-green-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 transition-all duration-300 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">

          {/* Step 0 — Business info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">Tell us about your business</h2>
                <p className="text-sm text-gray-500 mb-4">Customers will see your business name, location, and bio.</p>
              </div>
              <Input label="Business name *" placeholder="e.g. Lagos Stitch & Style" value={form.business_name}
                onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="City *" placeholder="Lagos" value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                <Input label="State *" placeholder="Lagos State" value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
              </div>
              <Input label="Shop address (optional)" placeholder="Shop number / street" value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">About your business (optional)</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={3} placeholder="Tell customers about your experience, style, and what makes you special..."
                  value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Step 1 — Services */}
          {step === 1 && (
            <div>
              <h2 className="font-bold text-gray-900 mb-1">What services do you offer?</h2>
              <p className="text-sm text-gray-500 mb-4">Select all that apply — customers will filter by these.</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                  <button key={k} type="button"
                    onClick={() => setForm(f => ({ ...f, specialties: toggle(f.specialties, k) }))}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border-2 transition-all duration-200 ${
                      form.specialties.includes(k)
                        ? 'border-violet-600 bg-violet-50 text-violet-700 font-semibold scale-[1.04]'
                        : 'border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600'
                    }`}>
                    {SERVICE_ICONS[k]} {v}
                    {form.specialties.includes(k) && <CheckCircle size={13} className="text-violet-600" />}
                  </button>
                ))}
              </div>
              {form.specialties.length === 0 && (
                <p className="text-xs text-amber-600 mt-3">Please select at least one service</p>
              )}
            </div>
          )}

          {/* Step 2 — Delivery */}
          {step === 2 && (
            <div>
              <h2 className="font-bold text-gray-900 mb-1">How do you work with customers?</h2>
              <p className="text-sm text-gray-500 mb-4">You can offer both options.</p>
              <div className="space-y-3">
                {[
                  { val: 'pickup_delivery', icon: '🚚', label: 'Pickup & Delivery', sub: 'You collect fabric from customer and deliver the finished item' },
                  { val: 'visit_shop',      icon: '🏪', label: 'Visit My Shop',      sub: 'Customers come to your workshop or shop' },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setForm(f => ({ ...f, delivery_types: toggle(f.delivery_types, opt.val) }))}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      form.delivery_types.includes(opt.val)
                        ? 'border-violet-600 bg-violet-50'
                        : 'border-gray-200 hover:border-violet-300'
                    }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                      </div>
                      {form.delivery_types.includes(opt.val) && (
                        <CheckCircle size={18} className="text-violet-600 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {form.delivery_types.length === 0 && (
                <p className="text-xs text-amber-600 mt-3">Please select at least one option</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                size="lg"
                className="flex-1"
                disabled={!canNext()}
                onClick={() => setStep(s => s + 1)}
              >
                Continue →
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="flex-1"
                loading={loading}
                disabled={!canNext()}
                onClick={handleSubmit}
              >
                Create Profile →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
