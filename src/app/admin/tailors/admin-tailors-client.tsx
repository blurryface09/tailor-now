'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Star, MapPin, Eye, Mail, Phone, Search } from 'lucide-react'
import { formatDate, SERVICE_LABELS } from '@/lib/utils'
import type { TailorProfile, Profile } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

type TailorWithProfile = TailorProfile & { profile: Profile }

const SERVICE_ICONS: Record<string, string> = {
  street_wear: '🧢', custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

export function AdminTailorsClient({ tailors: initial }: { tailors: TailorWithProfile[] }) {
  const supabase = createClient()
  const [tailors, setTailors] = useState(initial)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'suspended'>('all')
  const [loading, setLoading] = useState<string | null>(null)

  const verify = async (id: string, verified: boolean) => {
    setLoading(id)
    const { error } = await supabase.from('tailor_profiles').update({ is_verified: verified }).eq('id', id)
    setLoading(null)
    if (error) { toast.error(error.message); return }
    setTailors(t => t.map(x => x.id === id ? { ...x, is_verified: verified } : x))
    toast.success(verified ? 'Creative verified!' : 'Verification removed')
  }

  const suspend = async (id: string, active: boolean) => {
    setLoading(id)
    const { error } = await supabase.from('tailor_profiles').update({ is_active: active }).eq('id', id)
    setLoading(null)
    if (error) { toast.error(error.message); return }
    setTailors(t => t.map(x => x.id === id ? { ...x, is_active: active } : x))
    toast.success(active ? 'Creative reactivated' : 'Creative suspended')
  }

  const filtered = tailors.filter(t => {
    const matchesSearch = !search ||
      t.business_name.toLowerCase().includes(search.toLowerCase()) ||
      t.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.city?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'verified' ? t.is_verified :
      filter === 'unverified' ? (!t.is_verified && t.is_active) :
      !t.is_active
    return matchesSearch && matchesFilter
  })

  const counts = {
    all: tailors.length,
    verified: tailors.filter(t => t.is_verified).length,
    unverified: tailors.filter(t => !t.is_verified && t.is_active).length,
    suspended: tailors.filter(t => !t.is_active).length,
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Creatives</h1>
        <p className="text-sm text-gray-500 mt-0.5">{tailors.length} registered</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="Search by name, email, city..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['all', 'unverified', 'verified', 'suspended'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-violet-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400">No creatives found</p>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map(tailor => (
          <div key={tailor.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              {(tailor as any).profile?.avatar_url ? (
                <img src={(tailor as any).profile.avatar_url} alt={tailor.business_name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg flex-shrink-0">
                  {tailor.business_name?.[0]?.toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{tailor.business_name}</p>
                    <p className="text-xs text-gray-500">{tailor.profile?.full_name}</p>
                  </div>
                  {/* Status badge */}
                  <div className="flex-shrink-0">
                    {tailor.is_verified
                      ? <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"><CheckCircle size={10} /> Verified</span>
                      : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pending</span>}
                    {!tailor.is_active && <span className="ml-1 inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium"><XCircle size={10} /> Suspended</span>}
                  </div>
                </div>

                {/* Contact + location */}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  {tailor.profile?.email && (
                    <span className="flex items-center gap-1 text-xs text-gray-400"><Mail size={10} /> {tailor.profile.email}</span>
                  )}
                  {tailor.profile?.phone && (
                    <span className="flex items-center gap-1 text-xs text-gray-400"><Phone size={10} /> {tailor.profile.phone}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={10} /> {tailor.city}, {tailor.state}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    {tailor.avg_rating?.toFixed(1) || '—'} ({tailor.total_reviews})
                  </span>
                  <span>{tailor.total_orders} orders</span>
                  <span>{formatDate(tailor.created_at)}</span>
                </div>

                {/* Bio */}
                {tailor.bio && (
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{tailor.bio}</p>
                )}

                {/* Specialties */}
                {(tailor.specialties || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tailor.specialties.map(s => (
                      <span key={s} className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">
                        {SERVICE_ICONS[s]} {SERVICE_LABELS[s]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
              <Link href={`/tailors/${tailor.id}`}
                className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
                <Eye size={12} /> View
              </Link>

              {!tailor.is_verified ? (
                <button onClick={() => verify(tailor.id, true)} disabled={loading === tailor.id}
                  className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50">
                  <CheckCircle size={12} /> {loading === tailor.id ? 'Verifying…' : 'Verify'}
                </button>
              ) : (
                <button onClick={() => verify(tailor.id, false)} disabled={loading === tailor.id}
                  className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50">
                  <XCircle size={12} /> Remove verification
                </button>
              )}

              {tailor.is_active ? (
                <button onClick={() => suspend(tailor.id, false)} disabled={loading === tailor.id}
                  className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 ml-auto">
                  <XCircle size={12} /> Suspend
                </button>
              ) : (
                <button onClick={() => suspend(tailor.id, true)} disabled={loading === tailor.id}
                  className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50 ml-auto">
                  <CheckCircle size={12} /> Reactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
