'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Filter, Star, CheckCircle, Clock, Zap, Navigation } from 'lucide-react'
import toast from 'react-hot-toast'
import { SERVICE_LABELS, cn } from '@/lib/utils'
import { NIGERIAN_STATES, citiesForState, matchState, matchCity } from '@/lib/nigeria-locations'
import { calcScore, getLevel } from '@/lib/creative-score'
import type { TailorProfile, Profile } from '@/types'

type TailorWithProfile = TailorProfile & { profile: Profile }

interface BrowseClientProps {
  tailors: TailorWithProfile[]
  initialService?: string
  initialCity?: string
  initialState?: string
  initialQuery?: string
  isFiltered?: boolean
}

const SERVICE_ICONS: Record<string, string> = {
  custom_outfit: '👗',
  alterations: '✂️',
  bridal: '💍',
  ready_to_wear: '👕',
  fabric_sourcing: '🧵',
  uniforms: '👔',
}

const COVER_GRADIENTS = [
  'from-violet-500 to-purple-700',
  'from-indigo-500 to-violet-600',
  'from-purple-600 to-pink-500',
  'from-violet-600 to-indigo-700',
  'from-fuchsia-500 to-violet-600',
  'from-violet-700 to-purple-500',
]

const DEMO_TAILORS: TailorWithProfile[] = [
  { id: 'demo-1', user_id: 'demo-1', business_name: "Adaeze Couture", bio: "Lagos-based fashion house specialising in Aso-Oke, Ankara, and custom bridal gowns. 10+ years experience.", city: "Lagos", state: "Lagos", specialties: ["bridal", "custom_outfit", "alterations"], is_verified: true, avg_rating: 4.9, total_reviews: 134, total_orders: 312, response_time_hours: 2, profile: { id: 'demo-1', full_name: "Adaeze Okonkwo", role: "tailor" } as Profile } as TailorWithProfile,
  { id: 'demo-2', user_id: 'demo-2', business_name: "Kemi Stitch & Style", bio: "Your go-to for office wear, casual fits, and alterations. Fast turnaround guaranteed.", city: "Abuja", state: "FCT (Abuja)", specialties: ["custom_outfit", "alterations", "ready_to_wear"], is_verified: true, avg_rating: 4.7, total_reviews: 88, total_orders: 201, response_time_hours: 4, profile: { id: 'demo-2', full_name: "Kemi Adeyemi", role: "tailor" } as Profile } as TailorWithProfile,
  { id: 'demo-3', user_id: 'demo-3', business_name: "Emeka Fashion House", bio: "Men's agbada, suits, and senator wear. We deliver quality traditional and western wear across Nigeria.", city: "Enugu", state: "Enugu", specialties: ["custom_outfit", "uniforms"], is_verified: false, avg_rating: 4.5, total_reviews: 52, total_orders: 120, response_time_hours: 6, profile: { id: 'demo-3', full_name: "Emeka Nwosu", role: "tailor" } as Profile } as TailorWithProfile,
  { id: 'demo-4', user_id: 'demo-4', business_name: "Zara Fabrics & Sewing", bio: "Fabric sourcing, school uniforms, and custom designs. Serving Port Harcourt since 2015.", city: "Port Harcourt", state: "Rivers", specialties: ["fabric_sourcing", "uniforms", "alterations"], is_verified: true, avg_rating: 4.8, total_reviews: 76, total_orders: 185, response_time_hours: 3, profile: { id: 'demo-4', full_name: "Zara Williams", role: "tailor" } as Profile } as TailorWithProfile,
  { id: 'demo-5', user_id: 'demo-5', business_name: "Adeola Bridal Studio", bio: "Luxury bridal couture and asoebi coordination. We make your big day unforgettable.", city: "Ibadan", state: "Oyo", specialties: ["bridal", "custom_outfit"], is_verified: true, avg_rating: 5.0, total_reviews: 41, total_orders: 89, response_time_hours: 1, profile: { id: 'demo-5', full_name: "Adeola Fashola", role: "tailor" } as Profile } as TailorWithProfile,
  { id: 'demo-6', user_id: 'demo-6', business_name: "TrendWear by Chidi", bio: "Ready-to-wear and quick alterations. Same-day service available in Kano.", city: "Kano", state: "Kano", specialties: ["ready_to_wear", "alterations"], is_verified: false, avg_rating: 4.3, total_reviews: 29, total_orders: 67, response_time_hours: 8, profile: { id: 'demo-6', full_name: "Chidi Okafor", role: "tailor" } as Profile } as TailorWithProfile,
]

export function BrowseClient({ tailors, initialService, initialCity, initialState, initialQuery, isFiltered }: BrowseClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialQuery || '')
  const [selectedService, setSelectedService] = useState(initialService || '')
  const [selectedState, setSelectedState] = useState(initialState || '')
  const [selectedCity, setSelectedCity] = useState(initialCity || '')
  const [locating, setLocating] = useState(false)
  // Only show demo profiles when the platform genuinely has no real tailors yet (no filter applied).
  // If a search/filter legitimately finds zero matches, show a real empty state instead.
  const isDemo = tailors.length === 0 && !isFiltered
  const displayTailors = isDemo ? DEMO_TAILORS : tailors

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (selectedService) params.set('service', selectedService)
    if (selectedState) params.set('state', selectedState)
    if (selectedCity) params.set('city', selectedCity)
    if (search.trim()) params.set('q', search.trim())
    router.push(`/browse?${params.toString()}`)
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location not supported on this device')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const rawCity = data.address?.city || data.address?.town || data.address?.county || ''
          const rawState = data.address?.state || ''
          const matchedState = matchState(rawState) || ''
          const matchedCity = matchCity(rawCity, matchedState) || matchCity(rawCity) || ''
          if (matchedCity || matchedState) {
            setSelectedState(matchedState)
            setSelectedCity(matchedCity)
            toast.success(`Location detected: ${matchedCity}${matchedState ? `, ${matchedState}` : ''}`)
            const params = new URLSearchParams()
            if (selectedService) params.set('service', selectedService)
            if (matchedState) params.set('state', matchedState)
            if (matchedCity) params.set('city', matchedCity)
            router.push(`/browse?${params.toString()}`)
          } else {
            toast.error('Could not match your location to a known city. Select manually below.')
          }
        } catch {
          toast.error('Could not get location details. Select your city manually.')
        }
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Location permission denied. Select your state and city manually.')
        } else if (err.code === err.TIMEOUT) {
          toast.error('Location request timed out. Select manually below.')
        } else {
          toast.error('Could not get your location. Select manually below.')
        }
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }

  const filtered = displayTailors.filter(t =>
    !search ||
    t.business_name.toLowerCase().includes(search.toLowerCase()) ||
    t.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    (t.specialties || []).some(s => SERVICE_LABELS[s]?.toLowerCase().includes(search.toLowerCase())) ||
    t.bio?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8 fade-up">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
              placeholder="Search creatives, styles, or looks (e.g. Ankara, bridal, agbada)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFilter()}
            />
          </div>
          <div className="relative flex-1 md:flex-none">
            <select
              className="appearance-none pl-3 pr-8 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all w-full md:w-36 bg-white"
              value={selectedState}
              onChange={e => { setSelectedState(e.target.value); setSelectedCity('') }}
            >
              <option value="">Any state</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="relative flex-1 md:flex-none">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <select
              className="appearance-none pl-10 pr-8 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all w-full md:w-40 bg-white disabled:bg-gray-50 disabled:text-gray-400"
              value={selectedCity}
              disabled={!selectedState}
              onChange={e => setSelectedCity(e.target.value)}
            >
              <option value="">{selectedState ? 'Any city' : 'Pick a state first'}</option>
              {citiesForState(selectedState).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={detectLocation}
            disabled={locating}
            title="Detect my location"
            className="flex items-center justify-center gap-1.5 border border-violet-200 bg-violet-50 text-violet-700 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-violet-100 transition-all duration-200 disabled:opacity-60 flex-shrink-0"
          >
            <Navigation size={15} className={locating ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{locating ? 'Finding...' : 'Near me'}</span>
          </button>
          <button
            onClick={handleFilter}
            className="flex items-center justify-center gap-2 bg-violet-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-violet-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] shadow-sm shadow-violet-300 flex-shrink-0"
          >
            <Filter size={16} /> Search
          </button>
        </div>

        {/* Service chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setSelectedService('')}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
              !selectedService
                ? 'bg-violet-700 text-white shadow-sm shadow-violet-300'
                : 'bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700'
            )}
          >
            All Services
          </button>
          {Object.entries(SERVICE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedService(selectedService === key ? '' : key)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                selectedService === key
                  ? 'bg-violet-700 text-white shadow-sm shadow-violet-300 scale-[1.04]'
                  : 'bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700'
              )}
            >
              {SERVICE_ICONS[key]} {label}
            </button>
          ))}
        </div>
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 fade-up">
          <span className="text-amber-500 text-xl">✂️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Sample profiles</p>
            <p className="text-xs text-amber-700">These are demo creatives. Real creatives will appear here once they sign up.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5 fade-up-1">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{filtered.length}</span> creatives found
        </p>
        {filtered.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full font-medium">
            <Zap size={12} /> Ready to book
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 fade-up">
          <div className="text-6xl mb-4">✂️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No creatives found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tailor, i) => (
            <TailorCard key={tailor.id} tailor={tailor} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function TailorCard({ tailor, index }: { tailor: TailorWithProfile; index: number }) {
  const gradient = COVER_GRADIENTS[index % COVER_GRADIENTS.length]
  const delayClass = ['fade-up', 'fade-up-1', 'fade-up-2', 'fade-up-3', 'fade-up-4', 'fade-up-5'][index % 6]
  const isDemo = tailor.id.startsWith('demo-')
  const cardClass = cn('group bg-white rounded-2xl border border-gray-100 hover:border-violet-200 transition-all duration-300 overflow-hidden card-lift', delayClass)

  const body = (
    <>
      <div className={cn('h-36 bg-gradient-to-br relative overflow-hidden', gradient)}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <div className="absolute right-4 bottom-2 text-white/20 text-7xl leading-none select-none">✂</div>
        {tailor.is_verified && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-semibold text-violet-700 shadow-sm">
            <CheckCircle size={11} className="text-violet-600" /> Verified
          </div>
        )}
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          {(tailor as any).profile?.avatar_url ? (
            <img src={(tailor as any).profile.avatar_url} alt={tailor.business_name}
              className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-violet-700 font-black text-xl border-2 border-white group-hover:scale-105 transition-transform duration-300">
              {tailor.business_name?.[0]?.toUpperCase() || '✂'}
            </div>
          )}
        </div>
      </div>
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-gray-900 group-hover:text-violet-700 transition-colors leading-tight text-base">
            {tailor.business_name}
          </h3>
          <div className="flex items-center gap-1 text-sm flex-shrink-0 ml-2">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span className="font-semibold text-gray-900">{tailor.avg_rating?.toFixed(1) || 'New'}</span>
            <span className="text-gray-400 text-xs">({tailor.total_reviews})</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          <MapPin size={11} /> {tailor.city}, {tailor.state}
        </p>
        {tailor.bio && <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{tailor.bio}</p>}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(tailor.specialties || []).slice(0, 3).map(s => (
            <span key={s} className="text-xs bg-violet-50 text-violet-600 px-2.5 py-1 rounded-full font-medium">
              {SERVICE_ICONS[s]} {SERVICE_LABELS[s]}
            </span>
          ))}
          {(tailor.specialties || []).length > 3 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
              +{tailor.specialties.length - 3} more
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          {(() => {
            const lvl = getLevel(calcScore({ profile_likes: tailor.profile_likes, profile_views: tailor.profile_views, total_orders: tailor.total_orders }))
            return (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${lvl.bg} ${lvl.color} ${lvl.border}`}>
                {lvl.emoji} {lvl.level}
              </span>
            )
          })()}
          <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
            {tailor.total_orders} orders
          </span>
        </div>
        <div className="mt-3 overflow-hidden max-h-0 group-hover:max-h-12 transition-all duration-300">
          <div className="pt-1">
            <div className="w-full bg-violet-700 text-white text-xs font-bold py-2.5 rounded-xl text-center tracking-wide">
              {isDemo ? 'Coming Soon' : 'Book Now'}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  if (isDemo) {
    return (
      <div className={cardClass} onClick={() => toast('Real creative profiles coming soon! Creatives are joining daily.', { icon: '✂️' })}>
        {body}
      </div>
    )
  }

  return (
    <Link href={`/tailors/${tailor.id}`} className={cardClass}>
      {body}
    </Link>
  )
}
