'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/logo'
import { SERVICE_LABELS } from '@/lib/utils'
import { CREATIVE_SUPPORT_LABEL, CREATIVE_SUPPORT_URL } from '@/lib/support'
import { NIGERIAN_STATES, citiesForState, matchState, matchCity } from '@/lib/nigeria-locations'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { CheckCircle, Camera, Upload, X, Navigation, MessageCircle } from 'lucide-react'

const SERVICE_ICONS: Record<string, string> = {
  custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

const STEPS = [
  'Business Info',
  'Services',
  'How You Work',
  'Profile & Phone',
  'Face Verification',
  'Pricing',
  'Portfolio',
]

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

  const [form, setForm] = useState({
    business_name: '', bio: '', city: '', state: '', address: '',
    specialties: [] as string[], delivery_types: [] as string[],
  })
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [facePhotoUrl, setFacePhotoUrl] = useState<string | null>(null)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [portfolioItems, setPortfolioItems] = useState<Array<{ id: string; image_url: string; title: string }>>([])
  const [portfolioForm, setPortfolioForm] = useState({ title: '', image_url: '' })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase.from('profiles').select('avatar_url, phone').eq('id', user.id).single()
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
      if (profile?.phone) setPhone(profile.phone)

      const { data: tailor } = await supabase.from('tailor_profiles').select('*').eq('user_id', user.id).single()
      if (tailor) {
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
        if (tailor.face_photo_url) setFacePhotoUrl(tailor.face_photo_url)
        if (tailor.min_price) setMinPrice(String(tailor.min_price))
        if (tailor.max_price) setMaxPrice(String(tailor.max_price))

        const { data: portfolio } = await supabase
          .from('portfolio_items').select('id, image_url, title')
          .eq('tailor_id', tailor.id).order('created_at', { ascending: false })
        if (portfolio) setPortfolioItems(portfolio)

        // Resume: jump to first incomplete step
        if (!profile?.avatar_url || !profile?.phone) setStep(3)
        else if (!tailor.face_photo_url) setStep(4)
        else if (!tailor.min_price || !tailor.max_price) setStep(5)
        else setStep(6)
      }

      setLoading(false)
    })
  }, [])

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const canNext = (): boolean => {
    if (step === 0) return (
      form.business_name.trim().length >= 2 &&
      !!form.state && !!form.city &&
      form.address.trim().length > 0 &&
      form.bio.trim().length >= 20
    )
    if (step === 1) return form.specialties.length > 0
    if (step === 2) return form.delivery_types.length > 0
    if (step === 3) return !!avatarUrl && phone.trim().length >= 7
    if (step === 4) return !!facePhotoUrl
    if (step === 5) return !!(
      minPrice && maxPrice &&
      parseInt(minPrice) > 0 &&
      parseInt(maxPrice) >= parseInt(minPrice)
    )
    if (step === 6) return portfolioItems.length >= 2
    return false
  }

  const uploadImage = async (
    file: File,
    path: string,
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
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
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
            toast.success(`Location detected: ${matchedCity}${matchedState ? `, ${matchedState}` : ''}`)
          } else {
            toast.error('Could not match your location. Select manually.')
          }
        } catch { toast.error('Location lookup failed. Select manually.') }
        setDetecting(false)
      },
      (err) => {
        setDetecting(false)
        if (err.code === err.PERMISSION_DENIED) toast.error('Location permission denied. Select manually.')
        else if (err.code === err.TIMEOUT) toast.error('Location request timed out. Select manually.')
        else toast.error('Could not get your location. Select manually.')
      },
      { timeout: 10000 }
    )
  }

  const saveCore = async (): Promise<string | null> => {
    if (!userId) return null
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').upsert({
      id: userId,
      email: user?.email,
      full_name: user?.user_metadata?.full_name || '',
      role: 'tailor',
    }, { onConflict: 'id' })
    const payload = {
      business_name: form.business_name.trim(),
      bio: form.bio.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      address: form.address.trim(),
      specialties: form.specialties,
      delivery_types: form.delivery_types,
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
    if (step === 2) {
      const id = await saveCore()
      if (!id) return
      setStep(3)
      return
    }
    if (step === 3 && userId) {
      setSaving(true)
      await supabase.from('profiles').update({ phone: phone.trim() }).eq('id', userId)
      setSaving(false)
    }
    if (step === 5 && tailorId) {
      setSaving(true)
      const { error } = await supabase.from('tailor_profiles').update({
        min_price: parseInt(minPrice),
        max_price: parseInt(maxPrice),
      }).eq('id', tailorId)
      setSaving(false)
      if (error) { toast.error(error.message); return }
    }
    setStep(s => s + 1)
  }

  const handleFinish = () => {
    fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: 'tailor' }),
    }).catch(() => {})
    toast.success("Profile submitted for review! You'll be notified once approved.")
    router.push('/dashboard')
  }

  const addPortfolioItem = async () => {
    if (!tailorId || !portfolioForm.title || !portfolioForm.image_url) return
    setSaving(true)
    const { data, error } = await supabase.from('portfolio_items').insert({
      tailor_id: tailorId,
      title: portfolioForm.title,
      image_url: portfolioForm.image_url,
    }).select('id, image_url, title').single()
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setPortfolioItems(p => [...p, data])
    setPortfolioForm({ title: '', image_url: '' })
  }

  if (loading) return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#09090B] px-4 py-12">
      <div className="max-w-lg mx-auto">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6 justify-center">
            <Logo size="md" variant="full" animated />
          </Link>
          <h1 className="text-2xl font-bold text-white">Set up your creative profile</h1>
          <p className="text-zinc-500 mt-1 text-sm">Complete all steps to be listed and found by customers</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-3">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              i < step ? 'bg-green-400' : i === step ? 'bg-violet-600' : 'bg-white/[0.08]'
            }`} />
          ))}
        </div>
        <p className="text-center text-xs text-zinc-500 mb-6">
          Step {step + 1} of {STEPS.length} — <span className="font-medium text-zinc-300">{STEPS[step]}</span>
        </p>

        <div className="mb-5 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-violet-200">Need help finishing onboarding?</p>
              <p className="text-xs text-violet-300/80 mt-0.5">
                Reach TailorNow support and we&apos;ll help you complete your creative profile.
              </p>
            </div>
            <a
              href={CREATIVE_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition-colors hover:bg-violet-500"
            >
              <MessageCircle size={16} />
              {CREATIVE_SUPPORT_LABEL}
            </a>
          </div>
        </div>

        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6">

          {/* Step 0 — Business Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-white mb-1">Tell us about your business</h2>
                <p className="text-sm text-zinc-500 mb-4">Customers will see your name, location, and bio.</p>
              </div>
              <Input label="Business name *" placeholder="e.g. Lagos Stitch & Style"
                value={form.business_name}
                onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-zinc-300">State *</label>
                    <button type="button" onClick={detectLocation} disabled={detecting}
                      className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-300 disabled:opacity-50">
                      <Navigation size={11} className={detecting ? 'animate-spin' : ''} />
                      {detecting ? 'Detecting…' : 'Detect'}
                    </button>
                  </div>
                  <select
                    className="w-full rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value, city: '' }))}>
                    <option value="">— Select state —</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">City *</label>
                  <select
                    className="w-full rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-[#09090B] disabled:text-zinc-600"
                    value={form.city}
                    disabled={!form.state}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
                    <option value="">{form.state ? '— Select city —' : 'Select a state first'}</option>
                    {citiesForState(form.state).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <Input label="Shop address *" placeholder="e.g. 12 Balogun Market, Shop B4"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  About your business * <span className="font-normal text-zinc-600 text-xs">(min 20 chars)</span>
                </label>
                <textarea
                  className="w-full rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={4}
                  placeholder="Tell customers about your experience, style, and what makes you stand out..."
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                <p className={`text-xs mt-1 ${form.bio.trim().length >= 20 ? 'text-green-400' : 'text-zinc-600'}`}>
                  {form.bio.trim().length}/20 minimum characters
                </p>
              </div>
            </div>
          )}

          {/* Step 1 — Services */}
          {step === 1 && (
            <div>
              <h2 className="font-bold text-white mb-1">What services do you offer?</h2>
              <p className="text-sm text-zinc-500 mb-4">Select all that apply — customers filter by these.</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                  <button key={k} type="button"
                    onClick={() => setForm(f => ({ ...f, specialties: toggle(f.specialties, k) }))}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border-2 transition-all duration-200 ${
                      form.specialties.includes(k)
                        ? 'border-violet-600 bg-violet-50 text-violet-400 font-semibold scale-[1.04]'
                        : 'border-white/[0.1] text-zinc-400 hover:border-violet-300 hover:text-violet-600'
                    }`}>
                    {SERVICE_ICONS[k]} {v}
                    {form.specialties.includes(k) && <CheckCircle size={13} className="text-violet-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — How You Work */}
          {step === 2 && (
            <div>
              <h2 className="font-bold text-white mb-1">How do you work with customers?</h2>
              <p className="text-sm text-zinc-500 mb-4">You can offer both options.</p>
              <div className="space-y-3">
                {[
                  { val: 'pickup_delivery', icon: '🚚', label: 'Pickup & Delivery', sub: 'You collect fabric from the customer and deliver the finished item' },
                  { val: 'visit_shop',      icon: '🏪', label: 'Visit My Shop',      sub: 'Customers come to your workshop or shop' },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setForm(f => ({ ...f, delivery_types: toggle(f.delivery_types, opt.val) }))}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      form.delivery_types.includes(opt.val) ? 'border-violet-600 bg-violet-50' : 'border-white/[0.1] hover:border-violet-300'
                    }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{opt.label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{opt.sub}</p>
                      </div>
                      {form.delivery_types.includes(opt.val) && (
                        <CheckCircle size={18} className="text-violet-600 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Profile Photo + Phone */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-bold text-white mb-1">Profile photo & phone number</h2>
                <p className="text-sm text-zinc-500 mb-4">Your photo builds trust. Customers may call or WhatsApp your number.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Profile photo *</label>
                <div className="flex items-center gap-5">
                  <div className="relative flex-shrink-0">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-white/[0.08]" />
                      : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/100 to-purple-700 flex items-center justify-center text-white text-2xl font-bold">
                          {form.business_name?.[0]?.toUpperCase() || '✂'}
                        </div>
                    }
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-700 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-violet-800 transition-colors">
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
                    <p className="text-sm font-medium text-zinc-300">Clear photo of your face</p>
                    <p className="text-xs text-zinc-600 mt-0.5">JPG or PNG, max 5MB</p>
                    {avatarUrl && (
                      <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <CheckCircle size={10} /> Uploaded
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Phone number * <span className="font-normal text-zinc-600 text-xs">(customers can call/WhatsApp)</span>
                </label>
                <div className="flex items-center border border-white/[0.1] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
                  <span className="px-3 py-2.5 bg-[#09090B] text-sm text-zinc-500 border-r border-white/[0.1] flex-shrink-0">+234</span>
                  <input type="tel" placeholder="08012345678" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Face Verification */}
          {step === 4 && (
            <div>
              <h2 className="font-bold text-white mb-1">Face verification photo</h2>
              <p className="text-sm text-zinc-500 mb-4">
                A clear selfie holding a piece of paper with today&apos;s date.
                Used only by admin for identity verification — never shown publicly.
              </p>
              <div className="flex items-start gap-4 mb-4">
                {facePhotoUrl ? (
                  <div className="relative flex-shrink-0">
                    <img src={facePhotoUrl} alt="Face verification" className="w-28 h-28 rounded-xl object-cover border-2 border-green-500/20" />
                    <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-700 border-2 border-white flex items-center justify-center cursor-pointer">
                      {uploading
                        ? <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Camera size={10} className="text-white" />}
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
                  <label className={`flex flex-col items-center justify-center w-28 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${uploading ? 'border-violet-300 bg-violet-50' : 'border-white/[0.1] hover:border-violet-400 hover:bg-violet-500/10'}`}>
                    {uploading
                      ? <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                      : <><Camera size={20} className="text-zinc-600 mb-1" /><span className="text-xs text-zinc-600">Upload</span></>}
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
                <ul className="text-xs text-zinc-500 space-y-1.5 pt-1">
                  <li>• Clear, well-lit selfie</li>
                  <li>• Hold paper with today&apos;s date</li>
                  <li>• Face must be clearly visible</li>
                  <li>• Kept private — admin eyes only</li>
                </ul>
              </div>
              {facePhotoUrl && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle size={12} /> Photo uploaded — you can retake it if needed.
                </p>
              )}
            </div>
          )}

          {/* Step 5 — Pricing */}
          {step === 5 && (
            <div>
              <h2 className="font-bold text-white mb-1">Your price range</h2>
              <p className="text-sm text-zinc-500 mb-4">Typical range for a full outfit (₦). Customers filter by budget.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Minimum (₦) *</label>
                  <div className="flex items-center border border-white/[0.1] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
                    <span className="px-3 py-2.5 bg-[#09090B] text-sm text-zinc-500 border-r border-white/[0.1]">₦</span>
                    <input type="number" min="0" placeholder="5000"
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Maximum (₦) *</label>
                  <div className="flex items-center border border-white/[0.1] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
                    <span className="px-3 py-2.5 bg-[#09090B] text-sm text-zinc-500 border-r border-white/[0.1]">₦</span>
                    <input type="number" min="0" placeholder="150000"
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                  </div>
                </div>
              </div>
              {minPrice && maxPrice && parseInt(maxPrice) < parseInt(minPrice) && (
                <p className="text-xs text-red-500 mt-2">Maximum must be at least as large as minimum</p>
              )}
            </div>
          )}

          {/* Step 6 — Portfolio */}
          {step === 6 && (
            <div>
              <h2 className="font-bold text-white mb-1">Upload your work</h2>
              <p className="text-sm text-zinc-500 mb-4">
                Add at least 2 photos of outfits you&apos;ve made. This is the first thing customers see.
              </p>

              {portfolioItems.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {portfolioItems.map(item => (
                    <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          supabase.from('portfolio_items').delete().eq('id', item.id)
                          setPortfolioItems(p => p.filter(i => i.id !== item.id))
                        }}
                        className="absolute top-1 right-1 bg-red-500/100 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
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
                <div className="border border-white/[0.08] rounded-xl p-4 space-y-3">
                  <p className="text-xs font-medium text-zinc-300">Add a photo</p>
                  {portfolioForm.image_url ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden">
                      <img src={portfolioForm.image_url} alt="" className="w-full h-full object-cover" />
                      <button type="button"
                        onClick={() => setPortfolioForm(f => ({ ...f, image_url: '' }))}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-violet-400 transition-colors">
                      {uploadingPortfolio
                        ? <div className="animate-spin w-5 h-5 border-2 border-violet-700 border-t-transparent rounded-full" />
                        : <><Upload size={18} className="text-zinc-600 mb-1" /><span className="text-xs text-zinc-600">Upload</span></>}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !userId) return
                          const ext = file.name.split('.').pop() || 'jpg'
                          await uploadImage(
                            file,
                            `portfolio/${userId}/${Date.now()}.${ext}`,
                            (url) => setPortfolioForm(f => ({ ...f, image_url: url })),
                            setUploadingPortfolio
                          )
                          e.target.value = ''
                        }} />
                    </label>
                  )}
                  <input
                    type="text"
                    placeholder="Title (e.g. Custom agbada suit)"
                    className="w-full rounded-xl border border-white/[0.1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={portfolioForm.title}
                    onChange={e => setPortfolioForm(f => ({ ...f, title: e.target.value }))}
                  />
                  <Button type="button" size="md" loading={saving}
                    disabled={!portfolioForm.title || !portfolioForm.image_url || saving}
                    onClick={addPortfolioItem}>
                    Add Photo
                  </Button>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: Math.max(portfolioItems.length + 1, 2) }, (_, i) => (
                    <div key={i} className={`w-5 h-1.5 rounded-full ${i < portfolioItems.length ? 'bg-violet-600' : 'bg-white/[0.08]'}`} />
                  ))}
                </div>
                <p className={`text-xs ${portfolioItems.length >= 2 ? 'text-green-400 font-medium' : 'text-zinc-600'}`}>
                  {portfolioItems.length}/2 minimum {portfolioItems.length >= 2 ? '✓' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white border border-white/[0.1] rounded-xl hover:bg-white/[0.06] transition-colors">
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
                Submit Profile →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
