'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SERVICE_LABELS } from '@/lib/utils'
import { NIGERIAN_STATES, citiesForState, matchState, matchCity } from '@/lib/nigeria-locations'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { CheckCircle, ArrowLeft, Navigation, Camera, AlertCircle } from 'lucide-react'

const SERVICE_ICONS: Record<string, string> = {
  street_wear: '🧢', custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

export default function EditCreativeProfile() {
  const router = useRouter()
  const supabase = createClient()
  const [tailorId, setTailorId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [facePhotoUrl, setFacePhotoUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingFace, setUploadingFace] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [phone, setPhone] = useState('')

  const [form, setForm] = useState({
    business_name: '',
    bio: '',
    city: '',
    state: '',
    address: '',
    specialties: [] as string[],
    delivery_types: [] as string[],
    min_price: '',
    max_price: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: profileData } = await supabase.from('profiles').select('role, avatar_url, phone').eq('id', user.id).single()
      if (profileData?.role !== 'tailor') { router.push('/home'); return }
      setUserId(user.id)
      setAvatarUrl(profileData?.avatar_url || null)
      setPhone(profileData?.phone || '')
      const { data: tailor } = await supabase.from('tailor_profiles').select('*').eq('user_id', user.id).single()
      if (!tailor) { router.push('/onboarding/tailor'); return }
      setTailorId(tailor.id)
      setFacePhotoUrl(tailor.face_photo_url || null)
      setForm({
        business_name: tailor.business_name || '',
        bio: tailor.bio || '',
        city: tailor.city || '',
        state: tailor.state || '',
        address: tailor.address || '',
        specialties: tailor.specialties || [],
        delivery_types: tailor.delivery_types || [],
        min_price: tailor.min_price ? String(tailor.min_price) : '',
        max_price: tailor.max_price ? String(tailor.max_price) : '',
      })
      setLoading(false)
    })
  }, [])

  const uploadImage = async (
    file: File,
    path: string,
    onSuccess: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setUploading(true)
    const { error } = await supabase.storage.from('portfolio').upload(path, file, { upsert: true, contentType: file.type })
    if (error) { toast.error(error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(path)
    onSuccess(publicUrl)
    setUploading(false)
  }

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    await uploadImage(file, `avatars/${userId}.${ext}`, async (url) => {
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
      setAvatarUrl(url)
      toast.success('Profile photo updated!')
    }, setUploadingAvatar)
    e.target.value = ''
  }

  const uploadFace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId || !tailorId) return
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    await uploadImage(file, `faces/${userId}.${ext}`, async (url) => {
      await supabase.from('tailor_profiles').update({ face_photo_url: url }).eq('id', tailorId)
      setFacePhotoUrl(url)
      toast.success('Face photo uploaded!')
    }, setUploadingFace)
    e.target.value = ''
  }

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

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
            toast.error('Could not match your location to a known city. Select manually below.')
          }
        } catch { toast.error('Location lookup failed. Select manually below.') }
        setDetecting(false)
      },
      (err) => {
        setDetecting(false)
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Location permission denied. Select your state and city manually.')
        } else if (err.code === err.TIMEOUT) {
          toast.error('Location request timed out. Select manually below.')
        } else {
          toast.error('Could not get your location. Select manually below.')
        }
      },
      { timeout: 10000 }
    )
  }

  const canSave =
    form.business_name.trim().length >= 2 &&
    form.bio.trim().length >= 20 &&
    form.city.trim() &&
    form.state.trim() &&
    form.specialties.length > 0 &&
    form.delivery_types.length > 0

  const handleSave = async () => {
    if (!tailorId || !userId) return
    setSaving(true)
    const [tailorRes, profileRes] = await Promise.all([
      supabase.from('tailor_profiles').update({
        business_name: form.business_name.trim(),
        bio: form.bio.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        address: form.address.trim() || null,
        specialties: form.specialties,
        delivery_types: form.delivery_types,
        min_price: form.min_price ? parseInt(form.min_price) : null,
        max_price: form.max_price ? parseInt(form.max_price) : null,
      }).eq('id', tailorId),
      phone.trim()
        ? supabase.from('profiles').update({ phone: phone.trim() }).eq('id', userId)
        : Promise.resolve({ error: null }),
    ])
    setSaving(false)
    if (tailorRes.error) { toast.error(tailorRes.error.message); return }
    if (profileRes.error) { toast.error(profileRes.error.message); return }
    toast.success('Profile updated!')
    router.push(`/tailors/${tailorId}`)
  }

  // Completeness checklist
  const checks = [
    { label: 'Profile photo', done: !!avatarUrl },
    { label: 'Phone number', done: !!phone.trim() },
    { label: 'Shop address', done: !!form.address.trim() },
    { label: 'Face photo', done: !!facePhotoUrl },
    { label: 'Price range', done: !!(form.min_price && form.max_price) },
  ]
  const doneCount = checks.filter(c => c.done).length

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
            <p className="text-sm text-gray-500">This is what customers and admin see</p>
          </div>
        </div>

        {/* Verification checklist banner */}
        <div className={`rounded-2xl border p-4 mb-5 ${doneCount === checks.length ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm font-semibold ${doneCount === checks.length ? 'text-green-700' : 'text-amber-700'}`}>
              {doneCount === checks.length ? 'Profile complete — ready for verification!' : `Complete your profile to get verified (${doneCount}/${checks.length})`}
            </p>
            <div className="flex gap-0.5">
              {checks.map((c, i) => (
                <div key={i} className={`w-5 h-1.5 rounded-full ${c.done ? 'bg-green-500' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {checks.map(c => (
              <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.done ? 'text-green-700' : 'text-amber-700'}`}>
                {c.done ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                {c.label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {/* Profile photo */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Profile Photo <span className="text-red-500 text-sm">*</span></h2>
              {avatarUrl && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12} /> Uploaded</span>}
            </div>
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold">
                    {form.business_name?.[0]?.toUpperCase() || '✂'}
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-700 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-violet-800 transition-colors">
                  {uploadingAvatar
                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera size={12} className="text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploadingAvatar} />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Your profile picture</p>
                <p className="text-xs text-gray-400 mt-0.5">Clear photo of your face — builds customer trust</p>
                <p className="text-xs text-gray-400">JPG or PNG, max 5MB</p>
              </div>
            </div>
          </div>

          {/* Face / identity photo */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-900">Face Verification Photo <span className="text-red-500 text-sm">*</span></h2>
              {facePhotoUrl && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12} /> Uploaded</span>}
            </div>
            <p className="text-sm text-gray-500 mb-4">A clear selfie holding a piece of paper with today's date. Used only for admin identity verification — not shown publicly.</p>
            <div className="flex items-start gap-4">
              {facePhotoUrl ? (
                <div className="relative flex-shrink-0">
                  <img src={facePhotoUrl} alt="Face verification" className="w-24 h-24 rounded-xl object-cover border-2 border-green-200" />
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-700 border-2 border-white flex items-center justify-center cursor-pointer hover:bg-violet-800 transition-colors">
                    {uploadingFace ? <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={10} className="text-white" />}
                    <input type="file" accept="image/*" className="hidden" onChange={uploadFace} disabled={uploadingFace} />
                  </label>
                </div>
              ) : (
                <label className={`flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${uploadingFace ? 'border-violet-300 bg-violet-50' : 'border-gray-200 hover:border-violet-400 hover:bg-violet-50'}`}>
                  {uploadingFace
                    ? <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                    : <><Camera size={20} className="text-gray-400 mb-1" /><span className="text-xs text-gray-400">Upload</span></>}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadFace} disabled={uploadingFace} />
                </label>
              )}
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Clear, well-lit selfie</li>
                <li>• Hold a paper with today's date</li>
                <li>• Face clearly visible</li>
                <li>• Kept private by admin</li>
              </ul>
            </div>
          </div>

          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Business Info</h2>
            <Input label="Business name *" placeholder="e.g. Lagos Stitch & Style"
              value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} />

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone number * <span className="font-normal text-gray-400 text-xs">(customers can call/WhatsApp you)</span>
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
                <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-500 border-r border-gray-200 flex-shrink-0">+234</span>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">State *</label>
                  <button type="button" onClick={detectLocation} disabled={detecting}
                    className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 disabled:opacity-50">
                    <Navigation size={11} className={detecting ? 'animate-spin' : ''} />
                    {detecting ? 'Detecting…' : 'Detect'}
                  </button>
                </div>
                <select
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value, city: citiesForState(e.target.value).includes(f.city) ? f.city : '' }))}
                >
                  <option value="">— Select state —</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                <select
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50 disabled:text-gray-400"
                  value={form.city}
                  disabled={!form.state}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                >
                  <option value="">{form.state ? '— Select city —' : 'Select a state first'}</option>
                  {citiesForState(form.state).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <Input label="Shop address * (street / shop number)" placeholder="e.g. 12 Balogun Market, Shop B4"
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

          {/* Price range */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Price Range *</h2>
            <p className="text-sm text-gray-500 mb-4">Your typical price range for outfits (₦). Customers use this to find creatives in their budget.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Minimum (₦)</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
                  <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-500 border-r border-gray-200">₦</span>
                  <input type="number" min="0" placeholder="5000"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                    value={form.min_price} onChange={e => setForm(f => ({ ...f, min_price: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Maximum (₦)</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500">
                  <span className="px-3 py-2.5 bg-gray-50 text-sm text-gray-500 border-r border-gray-200">₦</span>
                  <input type="number" min="0" placeholder="150000"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                    value={form.max_price} onChange={e => setForm(f => ({ ...f, max_price: e.target.value }))} />
                </div>
              </div>
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

          {/* Portfolio reminder */}
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-violet-800 mb-1">Don't forget your portfolio</p>
            <p className="text-xs text-violet-700">Upload at least 2 photos of your work to complete your profile. Go to <strong>My Portfolio</strong> in your dashboard.</p>
          </div>

          <Button size="lg" className="w-full" loading={saving} disabled={!canSave} onClick={handleSave}>
            Save Changes
          </Button>
          {!canSave && (
            <p className="text-xs text-center text-amber-600">Fill in all required fields (bio needs at least 20 characters)</p>
          )}
        </div>
      </div>
    </div>
  )
}
