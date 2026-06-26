'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Star, MapPin, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { TailorProfile, Profile } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

type TailorWithProfile = TailorProfile & { profile: Profile }

export function AdminTailorsClient({ tailors: initial }: { tailors: TailorWithProfile[] }) {
  const supabase = createClient()
  const [tailors, setTailors] = useState(initial)
  const [search, setSearch] = useState('')

  const verify = async (id: string, verified: boolean) => {
    await supabase.from('tailor_profiles').update({ is_verified: verified }).eq('id', id)
    setTailors(t => t.map(x => x.id === id ? { ...x, is_verified: verified } : x))
    toast.success(verified ? 'Tailor verified!' : 'Verification removed')
  }

  const suspend = async (id: string, active: boolean) => {
    await supabase.from('tailor_profiles').update({ is_active: active }).eq('id', id)
    setTailors(t => t.map(x => x.id === id ? { ...x, is_active: active } : x))
    toast.success(active ? 'Tailor reactivated' : 'Tailor suspended')
  }

  const filtered = tailors.filter(t =>
    !search || t.business_name.toLowerCase().includes(search.toLowerCase()) ||
    t.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Tailors</h1>
        <input className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
          placeholder="Search tailors..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Tailor', 'Location', 'Rating', 'Orders', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(tailor => (
                <tr key={tailor.id} className="hover:bg-gray-50 transition-colors">
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
                  <td className="px-4 py-3 text-gray-600">
                    <span className="flex items-center gap-1"><MapPin size={12} />{tailor.city}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      {tailor.avg_rating?.toFixed(1) || '—'} ({tailor.total_reviews})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tailor.total_orders}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {tailor.is_verified && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full w-fit">
                          <CheckCircle size={11} /> Verified
                        </span>
                      )}
                      {!tailor.is_active && (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full w-fit">
                          <XCircle size={11} /> Suspended
                        </span>
                      )}
                      {!tailor.is_verified && tailor.is_active && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full w-fit">Unverified</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(tailor.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/tailors/${tailor.id}`} className="p-1.5 text-gray-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors" title="View profile">
                        <Eye size={15} />
                      </Link>
                      {!tailor.is_verified ? (
                        <button onClick={() => verify(tailor.id, true)} className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors" title="Verify">
                          <CheckCircle size={15} />
                        </button>
                      ) : (
                        <button onClick={() => verify(tailor.id, false)} className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors" title="Unverify">
                          <XCircle size={15} />
                        </button>
                      )}
                      {tailor.is_active ? (
                        <button onClick={() => suspend(tailor.id, false)} className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Suspend">
                          <XCircle size={15} />
                        </button>
                      ) : (
                        <button onClick={() => suspend(tailor.id, true)} className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors" title="Reactivate">
                          <CheckCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
