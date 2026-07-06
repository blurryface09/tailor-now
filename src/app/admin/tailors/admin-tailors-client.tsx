'use client'
import { useState } from 'react'
import {
  CheckCircle, XCircle, Star, MapPin, Eye, Mail, Phone, Search,
  AlertCircle, MessageSquare, Send, X, ChevronRight, User,
  Image as ImageIcon, DollarSign, ShieldCheck, Package, Calendar,
  BadgeCheck, Info,
} from 'lucide-react'
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

function completenessChecks(t: TailorWithProfile) {
  return [
    { key: 'photo',     label: 'Profile photo',    done: !!t.profile?.avatar_url,              icon: <User size={14} /> },
    { key: 'phone',     label: 'Phone number',     done: !!t.profile?.phone,                   icon: <Phone size={14} /> },
    { key: 'address',   label: 'Shop address',     done: !!t.address,                          icon: <MapPin size={14} /> },
    { key: 'face',      label: 'Face / ID photo',  done: !!t.face_photo_url,                   icon: <ShieldCheck size={14} /> },
    { key: 'portfolio', label: '2+ portfolio pics', done: (t.portfolio_count ?? 0) >= 2,        icon: <ImageIcon size={14} /> },
    { key: 'price',     label: 'Price range',      done: !!(t.min_price && t.max_price),        icon: <DollarSign size={14} /> },
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
      toast.success('Message sent!')
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
      <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div>
            <h3 className="font-bold text-white">Contact {target.name}</h3>
            <p className="text-xs text-zinc-600">{target.email || 'No email on file'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors"><X size={16} /></button>
        </div>
        <div className="flex gap-2 p-4 pb-0">
          {(['message', 'email'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === t ? 'bg-violet-700 text-white' : 'border border-white/[0.1] text-zinc-400 hover:border-violet-300'}`}>
              {t === 'message' ? '💬 In-app message' : '✉️ Email'}
            </button>
          ))}
        </div>
        <div className="p-4 space-y-3">
          {tab === 'email' && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Subject</label>
              <input className="w-full rounded-xl border border-white/[0.1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">{tab === 'message' ? 'Message' : 'Body'}</label>
            <textarea rows={5}
              className="w-full rounded-xl border border-white/[0.1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="Write your message..."
              value={body} onChange={e => setBody(e.target.value)} />
            <p className="text-xs text-zinc-600 mt-0.5">{body.length} chars</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Complete profile', text: 'Hi! Your profile is pending verification. Please add a face photo, phone number, shop address, price range, and at least 2 portfolio photos. Once complete we will review and verify you within 24 hours.' },
              { label: 'Verified ✓', text: 'Great news! Your TailorNow profile has been verified. You are now visible to customers as a verified creative. Keep your profile updated and respond promptly to enquiries.' },
              { label: 'Suspended', text: 'Your TailorNow account has been temporarily suspended. Contact us at hello@tailornow.shop to resolve any outstanding issues.' },
            ].map(t => (
              <button key={t.label} onClick={() => setBody(t.text)}
                className="text-xs px-2.5 py-1 bg-white/[0.06] text-zinc-400 rounded-full hover:bg-violet-500/10 hover:text-violet-400 transition-colors">
                {t.label}
              </button>
            ))}
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

function DetailDrawer({ tailor, onClose, onVerify, onSuspend, onCompose, loading }:
  {
    tailor: TailorWithProfile
    onClose: () => void
    onVerify: (id: string, verified: boolean) => void
    onSuspend: (id: string, active: boolean) => void
    onCompose: (t: ComposeTarget) => void
    loading: string | null
  }) {
  const checks = completenessChecks(tailor)
  const done = checks.filter(c => c.done).length
  const pct = Math.round((done / checks.length) * 100)

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Drawer */}
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white/[0.05] backdrop-blur-xl border-b border-white/[0.08] px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-white">Creative Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.06] rounded-xl transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Identity */}
          <div className="flex items-start gap-4">
            {tailor.profile?.avatar_url ? (
              <img src={tailor.profile.avatar_url} alt={tailor.business_name}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-white/[0.1]" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-400 font-bold text-2xl flex-shrink-0">
                {tailor.business_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white">{tailor.business_name}</h3>
                {tailor.is_verified && <BadgeCheck size={16} className="text-violet-600 flex-shrink-0" />}
              </div>
              <p className="text-sm text-zinc-500">{tailor.profile?.full_name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {tailor.is_verified
                  ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                  : <span className="text-xs bg-amber-100 text-amber-400 px-2 py-0.5 rounded-full font-medium">Pending</span>}
                {!tailor.is_active && <span className="text-xs bg-red-100 text-red-400 px-2 py-0.5 rounded-full font-medium">Suspended</span>}
              </div>
            </div>
          </div>

          {/* Profile completeness */}
          <div className="bg-[#09090B] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-zinc-300">Profile completeness</span>
              <span className={`text-sm font-bold ${pct === 100 ? 'text-green-400' : 'text-amber-600'}`}>{pct}%</span>
            </div>
            <div className="w-full h-2 bg-white/[0.08] rounded-full mb-3 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: pct === 100 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626' }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {checks.map(c => (
                <div key={c.key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${c.done ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-600'}`}>
                  <span className={c.done ? 'text-green-500' : 'text-red-400'}>{c.icon}</span>
                  <span className="truncate">{c.label}</span>
                  {c.done ? <CheckCircle size={12} className="ml-auto flex-shrink-0" /> : <AlertCircle size={12} className="ml-auto flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Contact information */}
          <div>
            <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Contact Info</h4>
            <div className="space-y-2">
              <InfoRow icon={<Mail size={14} />} label="Email" value={tailor.profile?.email} missing="Not provided" />
              <InfoRow icon={<Phone size={14} />} label="Phone" value={tailor.profile?.phone} missing="Not added" />
              <InfoRow icon={<MapPin size={14} />} label="Location" value={tailor.city ? `${tailor.city}, ${tailor.state}` : null} missing="Not set" />
              <InfoRow icon={<MapPin size={14} />} label="Address" value={tailor.address} missing="Not added" />
            </div>
          </div>

          {/* Business info */}
          <div>
            <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Business Info</h4>
            <div className="space-y-2">
              <InfoRow icon={<DollarSign size={14} />} label="Price range"
                value={(tailor.min_price && tailor.max_price) ? `₦${(tailor.min_price / 1000).toFixed(0)}k – ₦${(tailor.max_price / 1000).toFixed(0)}k` : null}
                missing="Not set" />
              <InfoRow icon={<Package size={14} />} label="Portfolio photos"
                value={tailor.portfolio_count != null ? `${tailor.portfolio_count} photo${tailor.portfolio_count !== 1 ? 's' : ''}` : null}
                missing="None uploaded"
                warn={(tailor.portfolio_count ?? 0) < 2} />
              <InfoRow icon={<Calendar size={14} />} label="Joined" value={formatDate(tailor.created_at)} />
              <InfoRow icon={<Star size={14} />} label="Rating"
                value={tailor.avg_rating > 0 ? `${tailor.avg_rating.toFixed(1)} ★ (${tailor.total_reviews} reviews)` : null}
                missing="No reviews yet" />
              <InfoRow icon={<Package size={14} />} label="Orders" value={tailor.total_orders > 0 ? `${tailor.total_orders} completed` : null} missing="No orders yet" />
            </div>
          </div>

          {/* Bio */}
          <div>
            <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Bio</h4>
            {tailor.bio ? (
              <p className="text-sm text-zinc-300 bg-[#09090B] rounded-xl p-3 leading-relaxed">{tailor.bio}</p>
            ) : (
              <p className="text-sm text-zinc-600 italic bg-[#09090B] rounded-xl p-3">No bio added</p>
            )}
          </div>

          {/* Specialties */}
          {(tailor.specialties || []).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Specialties</h4>
              <div className="flex flex-wrap gap-1.5">
                {tailor.specialties.map(s => (
                  <span key={s} className="text-xs bg-violet-500/10 text-violet-300 px-2.5 py-1 rounded-full border border-violet-500/20 font-medium">
                    {SERVICE_ICONS[s]} {SERVICE_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Face photo */}
          <div>
            <h4 className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">Face / ID Photo</h4>
            {tailor.face_photo_url ? (
              <img src={tailor.face_photo_url} alt="Face verification"
                className="w-28 h-28 rounded-2xl object-cover border border-white/[0.1] shadow-sm" />
            ) : (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} /> Not uploaded — required for verification
              </div>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="sticky bottom-0 bg-white/[0.05] backdrop-blur-xl border-t border-white/[0.08] p-4 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => onCompose({ tailorUserId: tailor.user_id, name: tailor.profile?.full_name || tailor.business_name, email: tailor.profile?.email || null })}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm text-violet-400 bg-violet-50 border border-violet-200 px-3 py-2.5 rounded-xl hover:bg-violet-100 transition-colors font-medium">
              <MessageSquare size={14} /> Message
            </button>
            <Link href={`/tailors/${tailor.id}`} target="_blank"
              className="flex-1 flex items-center justify-center gap-1.5 text-sm text-zinc-400 border border-white/[0.1] px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors font-medium">
              <Eye size={14} /> View public
            </Link>
          </div>
          <div className="flex gap-2">
            {!tailor.is_verified ? (
              <button onClick={() => onVerify(tailor.id, true)} disabled={loading === tailor.id}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm text-green-700 bg-green-500/10 border border-green-200 px-3 py-2.5 rounded-xl hover:bg-green-100 transition-colors font-semibold disabled:opacity-50">
                <CheckCircle size={14} /> {loading === tailor.id ? 'Verifying…' : 'Verify creative'}
              </button>
            ) : (
              <button onClick={() => onVerify(tailor.id, false)} disabled={loading === tailor.id}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 rounded-xl hover:bg-amber-100 transition-colors font-semibold disabled:opacity-50">
                <XCircle size={14} /> Remove verification
              </button>
            )}
            {tailor.is_active ? (
              <button onClick={() => onSuspend(tailor.id, false)} disabled={loading === tailor.id}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm text-red-600 bg-red-500/10 border border-red-200 px-3 py-2.5 rounded-xl hover:bg-red-100 transition-colors font-semibold disabled:opacity-50">
                <XCircle size={14} /> Suspend
              </button>
            ) : (
              <button onClick={() => onSuspend(tailor.id, true)} disabled={loading === tailor.id}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm text-green-700 bg-green-500/10 border border-green-200 px-3 py-2.5 rounded-xl hover:bg-green-100 transition-colors font-semibold disabled:opacity-50">
                <CheckCircle size={14} /> Reactivate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, missing, warn }: {
  icon: React.ReactNode; label: string; value?: string | null; missing?: string; warn?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
      <span className="text-zinc-600 flex-shrink-0">{icon}</span>
      <span className="text-xs text-zinc-600 w-24 flex-shrink-0">{label}</span>
      {value ? (
        <span className={`text-sm font-medium truncate ${warn ? 'text-amber-600' : 'text-zinc-100'}`}>{value}</span>
      ) : (
        <span className="text-sm text-red-400 italic">{missing || 'Missing'}</span>
      )}
    </div>
  )
}

export function AdminTailorsClient({ tailors: initial }: { tailors: TailorWithProfile[] }) {
  const [tailors, setTailors] = useState(initial)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'suspended'>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [detail, setDetail] = useState<TailorWithProfile | null>(null)
  const [compose, setCompose] = useState<ComposeTarget | null>(null)

  const adminPatch = async (id: string, field: string, value: unknown) => {
    const res = await fetch('/api/admin/creative', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
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
    if (detail?.id === id) setDetail(d => d ? { ...d, is_verified: verified } : d)
    toast.success(verified ? 'Creative verified!' : 'Verification removed')
  }

  const suspend = async (id: string, active: boolean) => {
    setLoading(id)
    const ok = await adminPatch(id, 'is_active', active)
    setLoading(null)
    if (!ok) return
    setTailors(t => t.map(x => x.id === id ? { ...x, is_active: active } : x))
    if (detail?.id === id) setDetail(d => d ? { ...d, is_active: active } : d)
    toast.success(active ? 'Creative reactivated' : 'Creative suspended')
  }

  const filtered = tailors.filter(t => {
    const matchesSearch = !search ||
      t.business_name.toLowerCase().includes(search.toLowerCase()) ||
      t.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.city?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === 'all' ? t.is_active :
      filter === 'verified' ? (t.is_verified && t.is_active) :
      filter === 'unverified' ? (!t.is_verified && t.is_active) :
      !t.is_active
    return matchesSearch && matchesFilter
  })

  const counts = {
    all: tailors.filter(t => t.is_active).length,
    verified: tailors.filter(t => t.is_verified && t.is_active).length,
    unverified: tailors.filter(t => !t.is_verified && t.is_active).length,
    suspended: tailors.filter(t => !t.is_active).length,
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Creatives</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{tailors.length} registered · {counts.unverified} pending review</p>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          className="w-full rounded-xl border border-white/[0.1] pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="Search by name, email, city..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['all', 'unverified', 'verified', 'suspended'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f ? 'bg-violet-700 text-white' : 'bg-white border border-white/[0.1] text-zinc-400 hover:border-violet-300'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} <span className={`${filter === f ? 'text-white/70' : 'text-zinc-600'}`}>({counts[f]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08]">
          <p className="text-zinc-600">No creatives found</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(tailor => {
          const checks = completenessChecks(tailor)
          const doneCount = checks.filter(c => c.done).length
          const pct = Math.round((doneCount / checks.length) * 100)
          const allDone = doneCount === checks.length

          return (
            <div key={tailor.id}
              className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] hover:border-white/[0.1] hover:shadow-sm transition-all cursor-pointer"
              onClick={() => setDetail(tailor)}>
              <div className="p-4 flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {tailor.profile?.avatar_url ? (
                    <img src={tailor.profile.avatar_url} alt={tailor.business_name}
                      className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-400 font-bold text-lg">
                      {tailor.business_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  {/* Completeness dot */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${allDone ? 'bg-green-500/100' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-white truncate">{tailor.business_name}</p>
                        {tailor.is_verified && <BadgeCheck size={14} className="text-violet-600 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">{tailor.profile?.full_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {tailor.is_verified
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Verified</span>
                        : <span className="text-xs bg-amber-100 text-amber-400 px-2 py-0.5 rounded-full font-medium">Pending</span>}
                      {!tailor.is_active && <span className="text-xs bg-red-100 text-red-400 px-2 py-0.5 rounded-full font-medium">Suspended</span>}
                    </div>
                  </div>

                  {/* Contact + location */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {tailor.profile?.email && (
                      <span className="flex items-center gap-1 text-xs text-zinc-600"><Mail size={10} /> {tailor.profile.email}</span>
                    )}
                    {tailor.profile?.phone && (
                      <span className="flex items-center gap-1 text-xs text-zinc-600"><Phone size={10} /> {tailor.profile.phone}</span>
                    )}
                    {tailor.city && (
                      <span className="flex items-center gap-1 text-xs text-zinc-600"><MapPin size={10} /> {tailor.city}</span>
                    )}
                  </div>

                  {/* Stats + date */}
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600">
                    <span className="flex items-center gap-0.5">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      {tailor.avg_rating?.toFixed(1) || '—'} ({tailor.total_reviews})
                    </span>
                    <span>{tailor.total_orders} orders</span>
                    <span>{formatDate(tailor.created_at)}</span>
                    <span>{tailor.portfolio_count || 0} photos</span>
                  </div>

                  {/* Completeness bar */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: allDone ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626' }} />
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${allDone ? 'text-green-400' : 'text-amber-600'}`}>
                      {doneCount}/{checks.length}
                    </span>
                    <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
                  </div>

                  {/* Missing fields inline hint */}
                  {!allDone && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {checks.filter(c => !c.done).map(c => (
                        <span key={c.key} className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                          {c.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail drawer */}
      {detail && (
        <DetailDrawer
          tailor={detail}
          onClose={() => setDetail(null)}
          onVerify={verify}
          onSuspend={suspend}
          onCompose={(t) => { setCompose(t) }}
          loading={loading}
        />
      )}

      {compose && <ComposeModal target={compose} onClose={() => setCompose(null)} />}
    </div>
  )
}
