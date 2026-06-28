'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Star, MapPin, Eye, ChevronDown, Mail, Phone } from 'lucide-react'
import { formatDate, SERVICE_LABELS } from '@/lib/utils'
import type { TailorProfile, Profile } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

type TailorWithProfile = TailorProfile & { profile: Profile }

const SERVICE_ICONS: Record<string, string> = {
  custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

export function AdminTailorsClient({ tailors: initial }: { tailors: TailorWithProfile[] }) {
  const supabase = createClient()
  const [tailors, setTailors] = useState(initial)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'suspended'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const verify = async (id: string, verified: boolean) => {
    const { error } = await supabase.from('tailor_profiles').update({ is_verified: verified }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setTailors(t => t.map(x => x.id === id ? { ...x, is_verified: verified } : x))
    toast.success(verified ? 'Creative verified!' : 'Verification removed')
  }

  const suspend = async (id: string, active: boolean) => {
    const { error } = await supabase.from('tailor_profiles').update({ is_active: active }).eq('id', id)
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Tailors</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tailors.length} tailors registered</p>
        </div>
        <input
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
          placeholder="Search by name, email, city..." value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all', 'unverified', 'verified', 'suspended'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-violet-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} <span className="ml-1 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['', 'Creative', 'Contact', 'Location', 'Rating', 'Orders', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No tailors found</td></tr>
              )}
              {filtered.map(tailor => (
                <>
                  <tr key={tailor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <button onClick={() => setExpanded(expanded === tailor.id ? null : tailor.id)}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${expanded === tailor.id ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                          {tailor.business_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tailor.business_name}</p>
                          <p className="text-xs text-gray-400">{tailor.profile?.full_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {tailor.profile?.email && (
                          <p className="flex items-center gap-1 text-xs text-gray-500"><Mail size={11} /> {tailor.profile.email}</p>
                        )}
                        {tailor.profile?.phone && (
                          <p className="flex items-center gap-1 text-xs text-gray-500"><Phone size={11} /> {tailor.profile.phone}</p>
                        )}
                        {!tailor.profile?.email && !tailor.profile?.phone && (
                          <p className="text-xs text-gray-300">—</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-gray-600"><MapPin size={11} />{tailor.city}, {tailor.state}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span className="font-medium">{tailor.avg_rating?.toFixed(1) || '—'}</span>
                        <span className="text-gray-400 text-xs">({tailor.total_reviews})</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">{tailor.total_orders}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {tailor.is_verified
                          ? <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full w-fit"><CheckCircle size={11} /> Verified</span>
                          : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full w-fit">Unverified</span>}
                        {!tailor.is_active && <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full w-fit"><XCircle size={11} /> Suspended</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(tailor.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/tailors/${tailor.id}`} className="p-1.5 text-gray-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors" title="View profile">
                          <Eye size={15} />
                        </Link>
                        {!tailor.is_verified
                          ? <button onClick={() => verify(tailor.id, true)} className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors" title="Verify"><CheckCircle size={15} /></button>
                          : <button onClick={() => verify(tailor.id, false)} className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors" title="Unverify"><XCircle size={15} /></button>}
                        {tailor.is_active
                          ? <button onClick={() => suspend(tailor.id, false)} className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Suspend"><XCircle size={15} /></button>
                          : <button onClick={() => suspend(tailor.id, true)} className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors" title="Reactivate"><CheckCircle size={15} /></button>}
                      </div>
                    </td>
                  </tr>

                  {expanded === tailor.id && (
                    <tr key={`${tailor.id}-exp`} className="bg-violet-50/50">
                      <td />
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Services offered</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(tailor.specialties || []).length === 0
                                ? <span className="text-xs text-gray-400">None listed</span>
                                : (tailor.specialties || []).map(s => (
                                  <span key={s} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                                    {SERVICE_ICONS[s]} {SERVICE_LABELS[s]}
                                  </span>
                                ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Delivery types</p>
                            <div className="flex flex-col gap-1">
                              {(tailor.delivery_types || []).length === 0
                                ? <span className="text-xs text-gray-400">None listed</span>
                                : (tailor.delivery_types || []).map(d => (
                                  <span key={d} className="text-xs text-gray-600">
                                    {d === 'pickup_delivery' ? '🚚 Pickup & Delivery' : '🏪 Visit Shop'}
                                  </span>
                                ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Bio</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{tailor.bio || <span className="text-gray-300">No bio provided</span>}</p>
                          </div>
                        </div>
                        {tailor.address && (
                          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1"><MapPin size={11} /> {tailor.address}</p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
