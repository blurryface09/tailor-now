'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'
import { SERVICE_LABELS } from '@/lib/utils'
import { CREATIVE_SUPPORT_EMAIL_URL, CREATIVE_SUPPORT_WHATSAPP_URL } from '@/lib/support'
import { NIGERIAN_STATES, citiesForState, matchState, matchCity } from '@/lib/nigeria-locations'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  CheckCircle, Camera, Upload, X, Navigation, MessageCircle,
  Mail, Shield, Scissors, Clock, BadgeCheck, FileText, Star,
} from 'lucide-react'

const SERVICE_ICONS: Record<string, string> = {
  custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

const STEPS = [
  { id: 'eligibility',  label: 'Eligibility',    icon: Shield },
  { id: 'business',     label: 'Business Info',   icon: FileText },
  { id: 'services',     label: 'Services',        icon: Scissors },
  { id: 'work_style',   label: 'Work Style',      icon: Clock },
  { id: 'profile',      label: 'Profile & Phone', icon: Camera },
  { id: 'gov_id',       label: 'Gov ID',          icon: BadgeCheck },
  { id: 'face_verify',  label: 'Face Verify',     icon: Camera },
  { id: 'pricing',      label: 'Pricing',         icon: Star },
  { id: 'portfolio',    label: 'Portfolio',       icon: Upload },
  { id: 'pledge',       label: 'Quality Pledge',  icon: CheckCircle },
]

const YEARS_OPTIONS = ['Less than 1 year', '1–2 years', '3–5 years', '6–10 years', '10+ years']
const TURNAROUND_OPTIONS = ['2–3 days', '4–7 days', '1–2 weeks', '2–4 weeks', '4+ weeks']
const GOV_ID_TYPES = ['NIN Slip', "Voter's Card", "Driver's Licence", 'International Passport', 'National ID Card']

export default function TailorOnboarding() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false)
  const [detecting, setDetecting] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [tailorId, setTailorId] = useState<string | null>(null)

  // Step 0 — eligibility checkboxes (UI only)
  const [eligibility, setEligibility] = useState({ pro: false, nigeria: false, ontime: false, standards: false })

  // Step 1 — business info
  const [form, setForm] = useState({
    business_name: '', bio: '', city: '', state: '', address: '',
    years_experience: '', instagram_url: '',
    specialties: [] as string[], delivery_types: [] as string[],
    turnaround_days: '',
  })

  // Steps 4–6
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [govIdType, setGovIdType] = useState('')
  const [govIdUrl, setGovIdUrl] = useState<string | null>(null)
  const [facePhotoUrl, setFacePhotoUrl] = useState<string | null>(null)

  // Step 7
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  // Step 8
  const [portfolioItems, setPortfolioItems] = useState<Array<{ id: string; image_url: string; title: string }>>([])
  const [portfolioForm, setPortfolioForm] = useState({ title: '', image_url: '' })

  // Step 9 — pledge
  const [pledges, setPledges] = useState({ delivery: false, honest: false, offplatform: false, conduct: false })
  const [pledgeName, setPledgeName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase.from('profiles').select('avatar_url, phone, full_name').eq('id', user.id).single()
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
      if (profile?.phone) setPhone(profile.phone)
      if (profile?.full_name) setPledgeName(profile.full_name)

      const { data: tailor } = await supabase.from('tailor_profiles').select('*').eq('user_id', user.id).single()
      if (tailor) {
        setTailorId(tailor.id)
        setForm({
          business_name:   tailor.business_name || '',
          bio:             tailor.bio || '',
          city:            tailor.city || '',
          state:           tailor.state || '',
          address:         tailor.address || '',
          years_experience: tailor.years_experience || '',
          instagram_url:   tailor.instagram_url || '',
          specialties:     tailor.specialties || [],
          delivery_types:  tailor.delivery_types || [],
          turnaround_days: tailor.turnaround_days || '',
        })
        if (tailor.face_photo_url) setFacePhotoUrl(tailor.face_photo_url)
        if (tailor.gov_id_url) setGovIdUrl(tailor.gov_id_url)
        if (tailor.min_price) setMinPrice(String(tailor.min_price))
        if (tailor.max_price) setMaxPrice(String(tailor.max_price))
        const { data: portfolio } = await supabase
          .from('portfolio_items').select('id, image_url, title')
          .eq('tailor_id', tailor.id).order('created_at', { ascending: false })
        if (portfolio) setPortfolioItems(portfolio)

        // Resume at first incomplete step (skip eligibility if resuming)
        if (!profile?.avatar_url || !profile?.phone) setStep(4)
        else if (!tailor.gov_id_url) setStep(5)
        else if (!tailor.face_photo_url) setStep(6)
        else if (!tailor.min_price || !tailor.max_price) setStep(7)
        else setStep(8)
      }
      setLoading(false)
    })
  }, [])

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const canNext = (): boolean => {
    switch (step) {
      case 0: return Object.values(eligibility).every(Boolean)
      case 1: return (
        form.business_name.trim().length >= 2 &&
        !!form.state && !!form.city &&
        form.address.trim().length > 0 &&
        form.bio.trim().length >= 20 &&
        !!form.years_experience
      )
      case 2: return form.specialties.length > 0
      case 3: return form.delivery_types.length > 0 && !!form.turnaround_days
      case 4: return !!avatarUrl && phone.trim().length >= 7
      case 5: return !!govIdUrl && !!govIdType
      case 6: return !!facePhotoUrl
      case 7: return !!(minPrice && maxPrice && parseInt(minPrice) > 0 && parseInt(maxPrice) >= parseInt(minPrice))
      case 8: return portfolioItems.length >= 3
      case 9: return Object.values(pledges).every(Boolean) && pledgeName.trim().length >= 3
      default: return false
    }
  }

  const uploadImage = async (
    file: File, path: string,
    onSuccess: (url: string) => void,
    setUploadFn: (v: boolean) => void
  ) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setUploadFn(true)
    const { error } = await supabase.storage.from('portfolio').upload(path, file, { upsert: true, contentType: file.type })
    if (error) { toast.error(error.message); setUploadFn(false); return }
    const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(path)
    onSuccess(publicUrl)
    setUploadFn(false)
  }

  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error('Location not supported'); return }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        const rawCity = data.address?.city || data.address?.town || data.address?.county || ''
        const rawState = data.address?.state || ''
        const matchedState = matchState(rawState) || ''
        const matchedCity = matchCity(rawCity, matchedState) || matchCity(rawCity) || ''
        if (matchedCity || matchedState) {
          setForm(f => ({ ...f, city: matchedCity || f.city, state: matchedState || f.state }))
          toast.success(`Detected: ${matchedCity}${matchedState ? `, ${matchedState}` : ''}`)
        } else { toast.error('Could not match your location. Select manually.') }
      } catch { toast.error('Location lookup failed. Select manually.') }
      setDetecting(false)
    }, (err) => {
      setDetecting(false)
      if (err.code === err.PERMISSION_DENIED) toast.error('Location permission denied. Select manually.')
      else toast.error('Could not get your location. Select manually.')
    }, { timeout: 10000 })
  }

  const saveCore = async (): Promise<string | null> => {
    if (!userId) return null
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').upsert({
      id: userId, email: user?.email,
      full_name: user?.user_metadata?.full_name || '',
      role: 'tailor',
    }, { onConflict: 'id' })
    const payload = {
      business_name:    form.business_name.trim(),
      bio:              form.bio.trim(),
      city:             form.city.trim(),
      state:            form.state.trim(),
      address:          form.address.trim(),
      specialties:      form.specialties,
      delivery_types:   form.delivery_types,
      years_experience: form.years_experience,
      instagram_url:    form.instagram_url.trim() || null,
      turnaround_days:  form.turnaround_days,
    }
    if (tailorId) {
      const { error } = await supabase.from('tailor_profiles').update(payload).eq('id', tailorId)
      setSaving(false)
      if (error) { toast.error(error.message); return null }
      return tailorId
    }
    const { data, error } = await supabase.from('tailor_profiles')
      .insert({ user_id: userId, ...payload }).select('id').single()
    setSaving(false)
    if (error) { toast.error(error.message); return null }
    setTailorId(data.id)
    return data.id
  }

  const handleNext = async () => {
    if (step === 3) {
      const id = await saveCore()
      if (!id) return
      setStep(4)
      return
    }
    if (step === 4 && userId) {
      setSaving(true)
      await supabase.from('profiles').update({ phone: phone.trim() }).eq('id', userId)
      setSaving(false)
    }
    if (step === 7 && tailorId) {
      setSaving(true)
      const { error } = await supabase.from('tailor_profiles').update({
        min_price: parseInt(minPrice), max_price: parseInt(maxPrice),
      }).eq('id', tailorId)
      setSaving(false)
      if (error) { toast.error(error.message); return }
    }
    setStep(s => s + 1)
  }

  const handleFinish = async () => {
    if (!tailorId || !userId) return
    setSaving(true)
    await supabase.from('tailor_profiles').update({ pledge_signed_at: new Date().toISOString() }).eq('id', tailorId)
    setSaving(false)
    fetch('/api/welcome', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: 'tailor' }),
    }).catch(() => {})
    toast.success("Profile submitted for review! You'll be notified once approved.")
    router.push('/dashboard')
  }

  const addPortfolioItem = async () => {
    if (!tailorId || !portfolioForm.title || !portfolioForm.image_url) return
    setSaving(true)
    const { data, error } = await supabase.from('portfolio_items').insert({
      tailor_id: tailorId, title: portfolioForm.title, image_url: portfolioForm.image_url,
    }).select('id, image_url, title').single()
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setPortfolioItems(p => [...p, data])
    setPortfolioForm({ title: '', image_url: '' })
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" />
    </div>
  )

  const progressPct = (step / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-violet-50/30 to-white px-4 py-10">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-5 justify-center">
            <Logo size="md" variant="full" animated />
          </Link>
          <h1 className="text-2xl font-black text-zinc-900">Apply as a Creative</h1>
          <p className="text-zinc-500 mt-1 text-sm">Complete all steps to be listed and discovered by customers</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500">Step {step + 1} of {STEPS.length}</span>
            <span className="text-xs font-bold text-violet-600">{STEPS[step].label}</span>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-700 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${
                i < step ? 'bg-violet-600' : i === step ? 'bg-violet-400 scale-150' : 'bg-zinc-200'
              }`} />
            ))}
          </div>
        </div>

        {/* Support banner */}
        <div className="mb-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-violet-800">Need help with your application?</p>
              <p className="text-xs text-violet-600 mt-0.5">Our team can guide you through each step.</p>
            </div>
            <div className="flex gap-2">
              <a href={CREATIVE_SUPPORT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-xs font-semibold text-white hover:bg-green-400 transition-colors">
                <MessageCircle size={13} /> WhatsApp
              </a>
              <a href={CREATIVE_SUPPORT_EMAIL_URL}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
                <Mail size={13} /> Email
              </a>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">

          {/* ── Step 0: Eligibility ── */}
          {step === 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Shield size={20} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="font-black text-zinc-900 text-lg">Eligibility Check</h2>
                  <p className="text-sm text-zinc-500">Confirm you meet our creative standards before applying</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Why we ask this</p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  TailorNow customers trust us to vet every creative. Only applicants who meet these standards are reviewed for listing.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'pro',       label: 'I am a professional tailor or fashion creative with a real business', sub: 'Hobby sewers or hobbyists are not eligible for this platform' },
                  { key: 'nigeria',   label: 'My business is physically located in Nigeria', sub: 'We only support creatives with a verifiable local presence' },
                  { key: 'ontime',    label: 'I commit to completing every accepted order on time', sub: 'Late deliveries damage customer trust and result in account penalties' },
                  { key: 'standards', label: "I understand TailorNow can remove my listing if I break platform standards", sub: 'Off-platform deals, fraud, or repeated complaints lead to permanent bans' },
                ].map(({ key, label, sub }) => (
                  <button key={key} type="button"
                    onClick={() => setEligibility(e => ({ ...e, [key]: !e[key as keyof typeof e] }))}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                      eligibility[key as keyof typeof eligibility]
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-zinc-200 hover:border-violet-300 bg-white'
                    }`}>
                    <div className="flex gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                        eligibility[key as keyof typeof eligibility]
                          ? 'border-violet-600 bg-violet-600'
                          : 'border-zinc-300'
                      }`}>
                        {eligibility[key as keyof typeof eligibility] && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 leading-snug">{label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{sub}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Business Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-zinc-600" />
                </div>
                <div>
                  <h2 className="font-black text-zinc-900 text-lg">Business Information</h2>
                  <p className="text-sm text-zinc-500">This is what customers see on your profile</p>
                </div>
              </div>

              <Input label="Business name *" placeholder="e.g. Lagos Stitch & Style"
                value={form.business_name}
                onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Years of experience *</label>
                <div className="flex flex-wrap gap-2">
                  {YEARS_OPTIONS.map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setForm(f => ({ ...f, years_experience: opt }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                        form.years_experience === opt
                          ? 'border-violet-600 bg-violet-600 text-white'
                          : 'border-zinc-200 text-zinc-600 hover:border-violet-300'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-zinc-700">State *</label>
                    <button type="button" onClick={detectLocation} disabled={detecting}
                      className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 disabled:opacity-40">
                      <Navigation size={11} className={detecting ? 'animate-spin' : ''} />
                      {detecting ? 'Detecting…' : 'Auto-detect'}
                    </button>
                  </div>
                  <select
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value, city: '' }))}>
                    <option value="">— State —</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">City *</label>
                  <select
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 disabled:text-zinc-400 disabled:bg-zinc-50"
                    value={form.city} disabled={!form.state}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
                    <option value="">{form.state ? '— City —' : 'Select state first'}</option>
                    {citiesForState(form.state).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <Input label="Shop / workshop address *" placeholder="e.g. 12 Balogun Market, Shop B4"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  About your business * <span className="font-normal text-zinc-400 text-xs">(min 20 characters)</span>
                </label>
                <textarea
                  className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                  rows={4}
                  placeholder="Tell customers about your experience, your style, and what makes you stand out..."
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                <p className={`text-xs mt-1 ${form.bio.trim().length >= 20 ? 'text-green-500 font-medium' : 'text-zinc-400'}`}>
                  {form.bio.trim().length}/20 minimum characters {form.bio.trim().length >= 20 ? '✓' : ''}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Instagram handle <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500">
                  <span className="px-3 py-2.5 text-sm text-zinc-400 border-r border-zinc-200 bg-zinc-50 flex-shrink-0">@</span>
                  <input type="text" placeholder="yourhandle"
                    className="flex-1 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none bg-white"
                    value={form.instagram_url}
                    onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Services ── */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <Scissors size={20} className="text-zinc-600" />
                </div>
                <div>
                  <h2 className="font-black text-zinc-900 text-lg">Your Services</h2>
                  <p className="text-sm text-zinc-500">Customers filter by these — select everything you offer</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                  <button key={k} type="button"
                    onClick={() => setForm(f => ({ ...f, specialties: toggle(f.specialties, k) }))}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border-2 font-semibold transition-all duration-200 ${
                      form.specialties.includes(k)
                        ? 'border-violet-600 bg-violet-50 text-violet-700 scale-[1.03]'
                        : 'border-zinc-200 text-zinc-600 bg-white hover:border-violet-300 hover:text-violet-600'
                    }`}>
                    {SERVICE_ICONS[k]} {v}
                    {form.specialties.includes(k) && <CheckCircle size={13} className="text-violet-600" />}
                  </button>
                ))}
              </div>
              {form.specialties.length === 0 && (
                <p className="text-xs text-zinc-400 mt-4">Select at least one service to continue</p>
              )}
            </div>
          )}

          {/* ── Step 3: Work Style + Turnaround ── */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={20} className="text-zinc-600" />
                </div>
                <div>
                  <h2 className="font-black text-zinc-900 text-lg">How You Work</h2>
                  <p className="text-sm text-zinc-500">Set clear expectations so customers know what to expect</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-zinc-700 mb-3">How do you work with customers? *</p>
                <div className="space-y-3">
                  {[
                    { val: 'pickup_delivery', icon: '🚚', label: 'Pickup & Delivery', sub: 'You collect fabric from the customer and deliver the finished item' },
                    { val: 'visit_shop', icon: '🏪', label: 'Visit My Workshop', sub: 'Customers come to your physical studio or shop for fittings and pickup' },
                  ].map(opt => (
                    <button key={opt.val} type="button"
                      onClick={() => setForm(f => ({ ...f, delivery_types: toggle(f.delivery_types, opt.val) }))}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                        form.delivery_types.includes(opt.val)
                          ? 'border-violet-600 bg-violet-50'
                          : 'border-zinc-200 hover:border-violet-300 bg-white'
                      }`}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{opt.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-zinc-900 text-sm">{opt.label}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{opt.sub}</p>
                        </div>
                        {form.delivery_types.includes(opt.val) && (
                          <CheckCircle size={18} className="text-violet-600 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-700 mb-3">Typical order turnaround time *</p>
                <div className="flex flex-wrap gap-2">
                  {TURNAROUND_OPTIONS.map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setForm(f => ({ ...f, turnaround_days: opt }))}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                        form.turnaround_days === opt
                          ? 'border-violet-600 bg-violet-600 text-white'
                          : 'border-zinc-200 text-zinc-600 bg-white hover:border-violet-300'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-400 mt-2">For a standard custom outfit from measurement to delivery</p>
              </div>
            </div>
          )}

          {/* ── Step 4: Profile Photo + Phone ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <Camera size={20} className="text-zinc-600" />
                </div>
                <div>
                  <h2 className="font-black text-zinc-900 text-lg">Profile Photo & Phone</h2>
                  <p className="text-sm text-zinc-500">Customers trust profiles with a real face and reachable number</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-3">Profile photo *</label>
                <div className="flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-zinc-200" />
                      : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold">
                          {form.business_name?.[0]?.toUpperCase() || '✂'}
                        </div>
                    }
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-600 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-violet-700 shadow-sm">
                      {uploading
                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Camera size={12} className="text-white" />}
                      <input type="file" accept="image/*" className="hidden" disabled={uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !userId) return
                          const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
                          await uploadImage(file, `avatars/${userId}.${ext}`, async (url) => {
                            await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
                            setAvatarUrl(url)
                            toast.success('Profile photo uploaded!')
                          }, setUploading)
                          e.target.value = ''
                        }} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-700">Clear photo of your face</p>
                    <p className="text-xs text-zinc-400 mt-0.5">JPG or PNG, max 5MB. Shown publicly on your profile.</p>
                    {avatarUrl && <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1 font-medium"><CheckCircle size={11} /> Uploaded</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Phone number * <span className="font-normal text-zinc-400 text-xs">(for customer calls & WhatsApp)</span>
                </label>
                <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500">
                  <span className="px-3 py-2.5 bg-zinc-50 text-sm text-zinc-500 border-r border-zinc-200 flex-shrink-0">+234</span>
                  <input type="tel" placeholder="08012345678" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none bg-white" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Government ID ── */}
          {step === 5 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <BadgeCheck size={20} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="font-black text-zinc-900 text-lg">Government ID Verification</h2>
                  <p className="text-sm text-zinc-500">Required to protect customers and confirm your identity</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">🔒 Private & Secure</p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Your government ID is only seen by TailorNow admins during verification. It is never shown to customers or stored publicly.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-zinc-700 mb-2">ID type *</label>
                <div className="flex flex-wrap gap-2">
                  {GOV_ID_TYPES.map(t => (
                    <button key={t} type="button"
                      onClick={() => setGovIdType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                        govIdType === t
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-zinc-200 text-zinc-600 bg-white hover:border-amber-300'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Upload ID photo *</label>
                {govIdUrl ? (
                  <div className="flex items-start gap-4">
                    <div className="relative w-36 h-24 rounded-xl overflow-hidden border-2 border-green-300 flex-shrink-0">
                      <img src={govIdUrl} alt="Gov ID" className="w-full h-full object-cover" />
                      <label className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full p-1 cursor-pointer">
                        {uploading
                          ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Camera size={11} />}
                        <input type="file" accept="image/*" className="hidden" disabled={uploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file || !userId || !tailorId) return
                            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
                            await uploadImage(file, `gov-ids/${userId}.${ext}`, async (url) => {
                              await supabase.from('tailor_profiles').update({ gov_id_url: url }).eq('id', tailorId)
                              setGovIdUrl(url)
                              toast.success('ID uploaded!')
                            }, setUploading)
                            e.target.value = ''
                          }} />
                      </label>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mb-1"><CheckCircle size={12} /> ID uploaded</p>
                      <p className="text-xs text-zinc-500">Type: {govIdType || 'Not selected'}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Click the camera to replace</p>
                    </div>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    uploading ? 'border-violet-300 bg-violet-50' : 'border-zinc-200 bg-zinc-50 hover:border-violet-300 hover:bg-violet-50/50'
                  }`}>
                    {uploading
                      ? <div className="animate-spin w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full" />
                      : <>
                          <Upload size={22} className="text-zinc-400 mb-2" />
                          <p className="text-sm font-semibold text-zinc-600">Tap to upload your ID</p>
                          <p className="text-xs text-zinc-400 mt-0.5">JPG, PNG or PDF · max 5MB</p>
                        </>
                    }
                    <input type="file" accept="image/*" className="hidden" disabled={uploading || !tailorId}
                      onChange={async (e) => {
                        if (!tailorId) { toast.error('Complete the previous steps first'); return }
                        const file = e.target.files?.[0]
                        if (!file || !userId) return
                        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
                        await uploadImage(file, `gov-ids/${userId}.${ext}`, async (url) => {
                          await supabase.from('tailor_profiles').update({ gov_id_url: url }).eq('id', tailorId)
                          setGovIdUrl(url)
                          toast.success('ID uploaded!')
                        }, setUploading)
                        e.target.value = ''
                      }} />
                  </label>
                )}
              </div>

              <div className="mt-4 space-y-1.5">
                {['Take a clear, well-lit photo of your ID', 'All four corners must be visible', 'Name and photo on the ID must be legible', 'Expired IDs are not accepted'].map(tip => (
                  <p key={tip} className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-400 flex-shrink-0" /> {tip}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 6: Face Verification ── */}
          {step === 6 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <Camera size={20} className="text-zinc-600" />
                </div>
                <div>
                  <h2 className="font-black text-zinc-900 text-lg">Face Verification</h2>
                  <p className="text-sm text-zinc-500">Admin-only — confirms you match your government ID</p>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-4">
                {facePhotoUrl ? (
                  <div className="relative flex-shrink-0">
                    <img src={facePhotoUrl} alt="Face" className="w-32 h-32 rounded-2xl object-cover border-2 border-green-300" />
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-600 border-2 border-white flex items-center justify-center cursor-pointer shadow-sm">
                      {uploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Camera size={11} className="text-white" />}
                      <input type="file" accept="image/*" className="hidden" disabled={uploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !userId || !tailorId) return
                          const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
                          await uploadImage(file, `faces/${userId}.${ext}`, async (url) => {
                            await supabase.from('tailor_profiles').update({ face_photo_url: url }).eq('id', tailorId)
                            setFacePhotoUrl(url)
                            toast.success('Face photo updated!')
                          }, setUploading)
                          e.target.value = ''
                        }} />
                    </label>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center w-32 h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                    uploading ? 'border-violet-300 bg-violet-50' : 'border-zinc-200 bg-zinc-50 hover:border-violet-300'
                  }`}>
                    {uploading
                      ? <div className="animate-spin w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full" />
                      : <><Camera size={22} className="text-zinc-400 mb-1" /><span className="text-xs text-zinc-500">Upload selfie</span></>}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file || !userId || !tailorId) return
                        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
                        await uploadImage(file, `faces/${userId}.${ext}`, async (url) => {
                          await supabase.from('tailor_profiles').update({ face_photo_url: url }).eq('id', tailorId)
                          setFacePhotoUrl(url)
                          toast.success('Face photo uploaded!')
                        }, setUploading)
                        e.target.value = ''
                      }} />
                  </label>
                )}

                <div className="space-y-2 pt-1">
                  <p className="text-sm font-semibold text-zinc-700">What to do:</p>
                  {[
                    'Take a clear selfie in good lighting',
                    'Hold a paper with today\'s date written on it',
                    'Your face must be clearly visible',
                    'Kept strictly private — admin eyes only',
                  ].map(tip => (
                    <p key={tip} className="text-xs text-zinc-500 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-zinc-400 flex-shrink-0 mt-1.5" /> {tip}
                    </p>
                  ))}
                </div>
              </div>

              {facePhotoUrl && (
                <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <CheckCircle size={12} /> Photo uploaded — you can retake if needed
                </p>
              )}
            </div>
          )}

          {/* ── Step 7: Pricing ── */}
          {step === 7 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Star size={20} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="font-black text-zinc-900 text-lg">Your Price Range</h2>
                  <p className="text-sm text-zinc-500">Typical range for a complete outfit (₦). Customers filter by budget.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Minimum (₦) *</label>
                  <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500">
                    <span className="px-3 py-2.5 bg-zinc-50 text-sm text-zinc-500 border-r border-zinc-200">₦</span>
                    <input type="number" min="0" placeholder="5,000"
                      className="flex-1 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none bg-white"
                      value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Maximum (₦) *</label>
                  <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500">
                    <span className="px-3 py-2.5 bg-zinc-50 text-sm text-zinc-500 border-r border-zinc-200">₦</span>
                    <input type="number" min="0" placeholder="150,000"
                      className="flex-1 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none bg-white"
                      value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                  </div>
                </div>
              </div>
              {minPrice && maxPrice && parseInt(maxPrice) < parseInt(minPrice) && (
                <p className="text-xs text-red-500 mt-2">Maximum must be at least as large as minimum</p>
              )}

              <div className="mt-5 p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                <p className="text-xs font-semibold text-zinc-600 mb-1">💡 Pricing tips</p>
                <ul className="text-xs text-zinc-500 space-y-1">
                  <li>• Be honest — misleading prices lead to disputes and poor reviews</li>
                  <li>• You can negotiate specific jobs within your range</li>
                  <li>• Most customers budget ₦15,000–₦80,000 for custom outfits</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── Step 8: Portfolio ── */}
          {step === 8 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <Upload size={20} className="text-zinc-600" />
                </div>
                <div>
                  <h2 className="font-black text-zinc-900 text-lg">Your Work Portfolio</h2>
                  <p className="text-sm text-zinc-500">Add at least 3 photos of real outfits you've made — this is the first thing customers see</p>
                </div>
              </div>

              {portfolioItems.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {portfolioItems.map(item => (
                    <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group border border-zinc-200">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          supabase.from('portfolio_items').delete().eq('id', item.id)
                          setPortfolioItems(p => p.filter(i => i.id !== item.id))
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow">
                        <X size={10} />
                      </button>
                      <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {portfolioItems.length < 6 && (
                <div className="border border-zinc-200 rounded-2xl p-4 space-y-3 bg-zinc-50">
                  <p className="text-xs font-semibold text-zinc-600">Add a photo</p>
                  {portfolioForm.image_url ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-zinc-200">
                      <img src={portfolioForm.image_url} alt="" className="w-full h-full object-cover" />
                      <button type="button"
                        onClick={() => setPortfolioForm(f => ({ ...f, image_url: '' }))}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      uploadingPortfolio ? 'border-violet-300 bg-violet-50' : 'border-zinc-300 bg-white hover:border-violet-400'
                    }`}>
                      {uploadingPortfolio
                        ? <div className="animate-spin w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full" />
                        : <><Upload size={18} className="text-zinc-400 mb-1" /><span className="text-xs text-zinc-500">Upload</span></>}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !userId) return
                          const ext = file.name.split('.').pop() || 'jpg'
                          await uploadImage(file, `portfolio/${userId}/${Date.now()}.${ext}`,
                            (url) => setPortfolioForm(f => ({ ...f, image_url: url })),
                            setUploadingPortfolio)
                          e.target.value = ''
                        }} />
                    </label>
                  )}
                  <input type="text" placeholder="Title — e.g. Custom Agbada Suit"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    value={portfolioForm.title}
                    onChange={e => setPortfolioForm(f => ({ ...f, title: e.target.value }))} />
                  <Button type="button" size="md" loading={saving}
                    disabled={!portfolioForm.title || !portfolioForm.image_url || saving}
                    onClick={addPortfolioItem}>
                    Add Photo
                  </Button>
                </div>
              )}

              <div className="mt-3 flex items-center gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: Math.max(portfolioItems.length + 1, 3) }, (_, i) => (
                    <div key={i} className={`w-5 h-1.5 rounded-full ${i < portfolioItems.length ? 'bg-violet-600' : 'bg-zinc-200'}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${portfolioItems.length >= 3 ? 'text-green-600' : 'text-zinc-500'}`}>
                  {portfolioItems.length}/3 minimum {portfolioItems.length >= 3 ? '✓' : ''}
                </p>
              </div>
            </div>
          )}

          {/* ── Step 9: Quality Pledge ── */}
          {step === 9 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="font-black text-zinc-900 text-lg">Quality Pledge</h2>
                  <p className="text-sm text-zinc-500">Every TailorNow Creative signs this before going live</p>
                </div>
              </div>

              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-5">
                <p className="text-sm text-violet-800 leading-relaxed font-medium">
                  "As a TailorNow Creative, I commit to protecting our customers' trust and upholding the standards that make this platform great."
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { key: 'delivery',    label: 'I will deliver every order on the agreed date', sub: 'If delays are unavoidable, I will communicate early and proactively with the customer' },
                  { key: 'honest',      label: 'I will provide accurate measurements, honest pricing, and no hidden charges', sub: 'Quotes I give are final unless fabric or design requirements change — and I will explain why' },
                  { key: 'offplatform', label: 'I will never solicit or accept off-platform payments from TailorNow customers', sub: 'Taking customers off-platform is a permanent ban offence — no exceptions' },
                  { key: 'conduct',     label: 'I will treat every customer with professionalism and respect', sub: 'Harassment, ghosting, or rude behaviour results in immediate suspension' },
                ].map(({ key, label, sub }) => (
                  <button key={key} type="button"
                    onClick={() => setPledges(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      pledges[key as keyof typeof pledges]
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-zinc-200 hover:border-violet-300 bg-white'
                    }`}>
                    <div className="flex gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                        pledges[key as keyof typeof pledges] ? 'border-violet-600 bg-violet-600' : 'border-zinc-300'
                      }`}>
                        {pledges[key as keyof typeof pledges] && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 leading-snug">{label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{sub}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Sign with your full name to confirm *
                </label>
                <input
                  type="text"
                  placeholder="Type your full legal name"
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 font-medium placeholder:text-zinc-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  value={pledgeName}
                  onChange={e => setPledgeName(e.target.value)}
                />
                <p className="text-xs text-zinc-400 mt-1">
                  By signing, you agree to all of the above. This is logged with a timestamp.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-zinc-100">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="px-5 py-2.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                ← Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" size="lg" className="flex-1" loading={saving}
                disabled={!canNext() || saving} onClick={handleNext}>
                Continue →
              </Button>
            ) : (
              <Button type="button" size="lg" className="flex-1" loading={saving}
                disabled={!canNext() || saving} onClick={handleFinish}>
                Submit Application →
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Your application is reviewed within 24–48 hours · Questions? <a href={CREATIVE_SUPPORT_WHATSAPP_URL} className="text-violet-600 hover:underline">Chat with us</a>
        </p>
      </div>
    </div>
  )
}
