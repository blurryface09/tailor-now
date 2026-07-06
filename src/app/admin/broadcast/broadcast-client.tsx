'use client'
import { useState, useEffect, useCallback } from 'react'
import { Mail, Phone, Download, Copy, Send, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ContactRow } from '@/app/api/admin/contacts/route'

type Audience = 'all' | 'customers' | 'tailors_verified' | 'tailors_all'

const TABS: { key: Audience; label: string; desc: string }[] = [
  { key: 'all',             label: 'All Users',        desc: 'Every customer and creative' },
  { key: 'customers',       label: 'Customers',        desc: 'People who signed up to order' },
  { key: 'tailors_verified', label: 'Verified Creatives', desc: 'Admin-approved creatives only' },
  { key: 'tailors_all',     label: 'All Creatives',   desc: 'Verified + unverified creatives' },
]

export function BroadcastClient() {
  const [audience, setAudience] = useState<Audience>('all')
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; errors: number } | null>(null)

  const fetchContacts = useCallback(async (aud: Audience) => {
    setLoadingContacts(true)
    setResult(null)
    try {
      const res = await fetch(`/api/admin/contacts?audience=${aud}`)
      const data = await res.json()
      setContacts(data.contacts ?? [])
    } catch {
      toast.error('Failed to load contacts')
    } finally {
      setLoadingContacts(false)
    }
  }, [])

  useEffect(() => { fetchContacts(audience) }, [audience, fetchContacts])

  async function handleSend() {
    if (!subject.trim()) { toast.error('Subject is required'); return }
    if (!body.trim()) { toast.error('Message body is required'); return }
    if (contacts.length === 0) { toast.error('No recipients in this audience'); return }
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, audience }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setResult(data)
      toast.success(`Sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}!`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  function copyPhones() {
    const phones = contacts.filter(c => c.phone).map(c => c.phone).join('\n')
    if (!phones) { toast.error('No phone numbers in this audience'); return }
    navigator.clipboard.writeText(phones)
    toast.success(`Copied ${contacts.filter(c => c.phone).length} phone numbers`)
  }

  function downloadCSV() {
    const rows = [
      ['Name', 'Email', 'Phone', 'Role'],
      ...contacts.map(c => [c.name, c.email, c.phone ?? '', c.role]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tailornow-contacts-${audience}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${contacts.length} contacts`)
  }

  const phoneCount = contacts.filter(c => c.phone).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Broadcast</h1>
        <p className="text-zinc-500 mt-0.5">Send emails and export contacts for WhatsApp</p>
      </div>

      {/* Audience tabs */}
      <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-1 flex gap-1 mb-6 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setAudience(tab.key)}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              audience === tab.key
                ? 'bg-violet-700 text-white shadow-sm'
                : 'text-zinc-400 hover:bg-white/[0.06]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audience summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          {loadingContacts ? (
            <Loader2 size={15} className="animate-spin text-violet-600" />
          ) : (
            <Users size={15} className="text-violet-600" />
          )}
          <span>
            {loadingContacts
              ? 'Loading…'
              : <><strong className="text-white">{contacts.length}</strong> email recipients · <strong className="text-white">{phoneCount}</strong> with phone numbers</>
            }
          </span>
        </div>
        <p className="text-xs text-zinc-600">{TABS.find(t => t.key === audience)?.desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Email compose ── */}
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.08]">
            <Mail size={16} className="text-violet-600" />
            <h2 className="font-semibold text-white">Broadcast Email</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                Subject
              </label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. New feature on TailorNow 🎉"
                className="w-full border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                Message
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
                placeholder={`Write your message here...\n\nEach recipient will be greeted by name automatically.\nLinks and line breaks are supported.`}
                className="w-full border border-white/[0.1] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-zinc-600 mt-1">
                Recipients are greeted "Hi [Name]," automatically.
              </p>
            </div>

            {result && (
              <div className={`flex items-center gap-2.5 rounded-xl p-3 text-sm ${result.errors === 0 ? 'bg-green-500/10 text-green-800' : 'bg-amber-500/10 text-amber-300'}`}>
                {result.errors === 0
                  ? <CheckCircle size={15} />
                  : <AlertCircle size={15} />
                }
                <span>
                  Sent to <strong>{result.sent}</strong> recipients
                  {result.errors > 0 && ` · ${result.errors} failed`}
                </span>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || loadingContacts || contacts.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-violet-700 text-white font-semibold py-3 rounded-xl hover:bg-violet-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Sending…' : `Send to ${contacts.length} recipient${contacts.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

        {/* ── WhatsApp contacts ── */}
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.08]">
            <Phone size={16} className="text-green-400" />
            <h2 className="font-semibold text-white">WhatsApp Contacts</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-zinc-500 mb-4">
              Export phone numbers to create a WhatsApp broadcast list.
            </p>

            <div className="flex gap-2 mb-5">
              <button
                onClick={copyPhones}
                disabled={loadingContacts || phoneCount === 0}
                className="flex-1 flex items-center justify-center gap-2 border border-white/[0.1] text-zinc-300 text-sm font-medium py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Copy size={14} />
                Copy {phoneCount > 0 ? `${phoneCount} numbers` : 'numbers'}
              </button>
              <button
                onClick={downloadCSV}
                disabled={loadingContacts || contacts.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={14} />
                Download CSV
              </button>
            </div>

            {/* Contact list preview */}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {loadingContacts ? (
                <div className="text-center py-8 text-zinc-600">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                  <p className="text-sm">Loading contacts…</p>
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8 text-zinc-600">
                  <p className="text-sm">No contacts in this audience</p>
                </div>
              ) : (
                contacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.06] text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{c.name}</p>
                      <p className="text-xs text-zinc-600 truncate">{c.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {c.phone ? (
                        <span className="text-xs text-zinc-400 font-mono">{c.phone}</span>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.role === 'tailor' ? 'bg-violet-500/10 text-violet-300' : 'bg-blue-50 text-blue-600'}`}>
                        {c.role === 'tailor' ? 'creative' : c.role}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
