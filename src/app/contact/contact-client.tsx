'use client'
import { useState } from 'react'
import { Mail, MessageCircle, Send, CheckCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '2347075613715'
const CONTACT_EMAIL = 'access@fslabs.tech'

const inputClass = 'w-full rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/60 transition-all'
const labelClass = 'block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5'

export function ContactClient() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in every field.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Could not send your message. Please try again.')
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="text-green-600" size={26} />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Message sent</h1>
        <p className="text-zinc-500 text-sm">Thanks for reaching out — we usually reply within a day. For anything urgent, WhatsApp is faster.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Contact Us</h1>
      <p className="text-zinc-500 text-sm mb-10">Questions about an order, becoming a creative, or anything else — reach us however&apos;s easiest.</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl p-5 hover:border-green-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="text-green-600" size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">WhatsApp</p>
            <p className="text-xs text-zinc-500">+234 707 561 3715</p>
          </div>
        </a>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
            <Mail className="text-violet-600" size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Email</p>
            <p className="text-xs text-zinc-500">{CONTACT_EMAIL}</p>
          </div>
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-zinc-900 mb-4">Send a message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Your name</label>
            <input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="e.g. Aisha Bello" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" />
          </div>
          <div>
            <label className={labelClass}>Message</label>
            <textarea name="message" value={form.message} onChange={handleChange} rows={5} className={inputClass} placeholder="How can we help?" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold px-4 py-3 rounded-xl hover:bg-violet-500 transition-all disabled:opacity-50"
          >
            <Send size={15} />
            {loading ? 'Sending...' : 'Send message'}
          </button>
        </form>
      </div>
    </div>
  )
}
