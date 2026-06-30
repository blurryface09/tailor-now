'use client'
import { useState } from 'react'
import { CheckCircle, XCircle, Star, MapPin, Eye, Mail, Phone, Search, AlertCircle, MessageSquare, Send, X } from 'lucide-react'
import { formatDate, SERVICE_LABELS } from '@/lib/utils'
import type { TailorProfile, Profile } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

type TailorWithProfile = TailorProfile & {
  profile: Profile & { avatar_url?: string | null }
  face_photo_url?: string | null
  min_price?: number | null
  max_price?: number | null
  portfolio_count?: number
}

const SERVICE_ICONS: Record<string, string> = {
  street_wear: '🧢', custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

function completeness(t: TailorWithProfile): { label: string; done: boolean }[] {
  return [
    { label: 'Profile photo', done: !!t.profile?.avatar_url },
    { label: 'Phone number', done: !!t.profile?.phone },
    { label: 'Address', done: !!t.address },
    { label: 'Face photo', done: !!t.face_photo_url },
    { label: 'Portfolio pics', done: (t.portfolio_count ?? 0) >= 2 },
    { label: 'Price range', done: !!(t.min_price && t.max_price) },
  ]
}

type ComposeTarget = { tailorUserId: string; name: string; email: string | null }

function ComposeModal({ target, onClose }: { target: ComposeTarget; onClose: () => void }) {
  const [tab, setTab] = useState<'message' | 'email'>('message')
  const [subject, setSubject] = useState('Update on your TailorNow profile')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!body.trim()) return
    setSending(true)
    if (tab === 'message') {
      const res = await fetch('/api/admin/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tailorUserId: target.tailorUserId, content: body }),
      })
      setSending(false)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || `Error ${res.status}`)
        return
      }
      toast.success('In-app message sent!')
    } else {
      if (!target.email) { toast.error('No email on file'); setSending(false); return }
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: target.email, toName: target.name, subject, body }),
      })
      setSending(false)
      if (!res.ok) { const { error } = await res.json(); toast.error(error || 'Failed'); return }
      toast.success('Email sent!')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Contact {target.name}</h3>
            <p className="text-xs text-gray-400">{target.email || 'No email on file'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={16} /></button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-4 pb-0">
          {(['message', 'email'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === t ? 'bg-violet-700 text-white' : 'border border-gray-200 text-gray-600 hover:border-violet-300'}`}>
              {t === 'message' ? '💬 In-app message' : '✉️ Email'}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {tab === 'email' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <input className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {tab === 'message' ? 'Message' : 'Body'}
            </label>
            <textarea
              rows={6}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder={tab === 'message'
                ? 'Hi! Your profile is pending verification. Please add your face photo and price range to complete setup.'
                : 'Write your message to the creative...'}
              value={body} onChange={e => setBody(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">{body.length} characters</p>
          </div>

          {/* Quick templates */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Quick templates:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Complete profile', text: 'Hi! Your profile is pending verification. Please complete your profile by adding a face photo, phone number, shop address, price range, and at least 2 portfolio photos. Once done, we will review and verify you.' },
                { label: 'Verified!', text: 'Great news! Your TailorNow profile has been verified. You are now visible to customers as a verified creative. Keep your profile updated and respond promptly to orders.' },
                { label: 'Suspended', text: 'Your TailorNow account has been temporarily suspended. Please contact us at hello@tailornow.shop if you believe this is an error or to resolve any outstanding issues.' },
              ].map(t => (
                <button key={t.label} onClick={() => setBody(t.text)}
                  className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-violet-50 hover:text-violet-700 transition-colors">
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={send} disabled={!body.trim() || sending}
            className="w-full flex items-center justify-center gap-2 bg-violet-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-violet-800 transition-colors disabled:opacity-50">
            <Send size={14} /> {sending ? 'Sending…' : tab === 'message' ? 'Send message' : 'Send email'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminTailorsClient({ tailors: initial }: { tailors: TailorWithProfile[] }) {
  const [tailors, setTailors] = useState(initial)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'suspended'>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [compose, setCompose] = useState<ComposeTarget | null>(null)

  const adminPatch = async (id: string, field: string, value: unknown) => {
    const res = await fetch('/api/admin/creative', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, field, value }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || `Error ${res.status}`)
      return false
    }
    return true
  }

  const verify = async (id: string, verified: boolean) => {
    setLoading(id)
    const ok = await adminPatch(id, 'is_verified', verified)
    setLoading(null)
    if (!ok) return
    setTailors(t => t.map(x => x.id === id ? { ...x, is_verified: verified } : x))
    toast.success(verified ? 'Creative verified!' : 'Verification removed')
  }

  const suspend = async (id: string, active: boolean) => {
    setLoading(id)
    const ok = await adminPatch(id, 'is_active', active)
    setLoading(null)
    if (!ok) return
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

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="Search by name, email, city..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

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

      <div className="space-y-3">
        {filtered.map(tailor => {
          const checks = completeness(tailor)
          const doneCount = checks.filter(c => c.done).length
          const allDone = doneCount === checks.length
          const isExpanded = expanded === tailor.id

          return (
            <div key={tailor.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                {tailor.profile?.avatar_url ? (
                  <img src={tailor.profile.avatar_url} alt={tailor.business_name}
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
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {tailor.is_verified
                        ? <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium"><CheckCircle size={10} /> Verified</span>
                        : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Pending</span>}
                      {!tailor.is_active && <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium"><XCircle size={10} /> Suspended</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                    {tailor.profile?.email && (
                      <span className="flex items-center gap-1 text-xs text-gray-400"><Mail size={10} /> {tailor.profile.email}</span>
                    )}
                    {tailor.profile?.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-400"><Phone size={10} /> {tailor.profile.phone}</span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={10} /> {tailor.city}, {tailor.state}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-0.5">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      {tailor.avg_rating?.toFixed(1) || '—'} ({tailor.total_reviews})
                    </span>
                    <span>{tailor.total_orders} orders</span>
                    <span>{formatDate(tailor.created_at)}</span>
                  </div>

                  {/* Profile completeness bar */}
                  <button onClick={() => setExpanded(isExpanded ? null : tailor.id)}
                    className="flex items-center gap-2 mt-2 w-full text-left">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${(doneCount / checks.length) * 100}%` }} />
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${allDone ? 'text-green-600' : 'text-amber-600'}`}>
                      {doneCount}/{checks.length} {allDone ? '✓' : ''}
                    </span>
                  </button>

                  {/* Expandable checklist */}
                  {isExpanded && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {checks.map(c => (
                        <div key={c.label} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${c.done ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {c.done ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                          {c.label}
                        </div>
                      ))}
                      {tailor.face_photo_url && (
                        <div className="col-span-2 mt-1">
                          <img src={tailor.face_photo_url} alt="Face" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                        </div>
                      )}
                    </div>
                  )}

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
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                <Link href={`/tailors/${tailor.id}`}
                  className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <Eye size={12} /> View
                </Link>

                <button
                  onClick={() => setCompose({ tailorUserId: tailor.user_id, name: tailor.profile?.full_name || tailor.business_name, email: tailor.profile?.email || null })}
                  className="flex items-center gap-1.5 text-xs text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-colors">
                  <MessageSquare size={12} /> Message
                </button>

                {!allDone && !tailor.is_verified && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    <AlertCircle size={12} /> Profile incomplete
                  </span>
                )}

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
          )
        })}
      </div>

      {compose && <ComposeModal target={compose} onClose={() => setCompose(null)} />}
    </div>
  )
}
