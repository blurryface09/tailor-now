'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SERVICE_LABELS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, Store, Megaphone, Star, Tag, Eye, EyeOff } from 'lucide-react'

const SERVICE_ICONS: Record<string, string> = {
  custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

interface MarketplaceSettings {
  announcement_enabled: boolean
  announcement_text: string
  announcement_color: 'violet' | 'amber' | 'green' | 'red'
  featured_services: string[]
  hero_tagline: string
  promo_badge: string
}

const DEFAULT: MarketplaceSettings = {
  announcement_enabled: false,
  announcement_text: '',
  announcement_color: 'violet',
  featured_services: [],
  hero_tagline: 'Your perfect fit, delivered to you.',
  promo_badge: '1,200+ tailors online right now',
}

const COLORS = [
  { val: 'violet', label: 'Violet', bg: 'bg-violet-100 text-violet-300 border-violet-300' },
  { val: 'amber',  label: 'Amber',  bg: 'bg-amber-100 text-amber-300 border-amber-300' },
  { val: 'green',  label: 'Green',  bg: 'bg-green-100 text-green-800 border-green-300' },
  { val: 'red',    label: 'Red',    bg: 'bg-red-100 text-red-300 border-red-300' },
]

const toggle = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

export default function MarketplacePage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<MarketplaceSettings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('marketplace_settings')
      .select('value')
      .eq('key', 'config')
      .single()
      .then(({ data }) => {
        if (data?.value) setSettings({ ...DEFAULT, ...(data.value as Partial<MarketplaceSettings>) })
        setLoading(false)
      })
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('marketplace_settings')
      .upsert({ key: 'config', value: settings, updated_at: new Date().toISOString() })
    if (error) toast.error(error.message)
    else toast.success('Marketplace settings saved!')
    setSaving(false)
  }

  const colorCfg = COLORS.find(c => c.val === settings.announcement_color) || COLORS[0]

  if (loading) return (
    <div className="min-h-screen bg-[#140F1E]">
      <Navbar />
      <div className="flex justify-center py-24"><div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" /></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#140F1E]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors text-zinc-500">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Marketplace Settings</h1>
            <p className="text-sm text-zinc-500">Control what customers see on the platform</p>
          </div>
        </div>

        {/* Announcement banner */}
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2"><Megaphone size={18} className="text-violet-600" /> Site Announcement</h2>
            <button
              onClick={() => setSettings(s => ({ ...s, announcement_enabled: !s.announcement_enabled }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                settings.announcement_enabled ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white/[0.06] text-zinc-500 border-white/[0.1]'
              }`}>
              {settings.announcement_enabled ? <><Eye size={12} /> Visible</> : <><EyeOff size={12} /> Hidden</>}
            </button>
          </div>
          <p className="text-xs text-zinc-500">When enabled, a banner shows at the top of all pages for logged-in users.</p>

          <Input
            label="Announcement text"
            placeholder="e.g. 🎉 Ramadan special — 20% off all bridal orders this week!"
            value={settings.announcement_text}
            onChange={e => setSettings(s => ({ ...s, announcement_text: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Banner colour</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c.val} type="button"
                  onClick={() => setSettings(s => ({ ...s, announcement_color: c.val as MarketplaceSettings['announcement_color'] }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${c.bg} ${settings.announcement_color === c.val ? 'ring-2 ring-offset-1 ring-violet-500' : ''}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {settings.announcement_enabled && settings.announcement_text && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${colorCfg.bg}`}>
              Preview: {settings.announcement_text}
            </div>
          )}
        </div>

        {/* Featured services */}
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 space-y-4">
          <h2 className="font-bold text-white flex items-center gap-2"><Star size={18} className="text-amber-500" /> Featured Services</h2>
          <p className="text-xs text-zinc-500">Highlight up to 3 services on the browse page and homepage. Leave empty to show all equally.</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SERVICE_LABELS).map(([k, v]) => (
              <button key={k} type="button"
                onClick={() => {
                  const next = toggle(settings.featured_services, k)
                  if (next.length > 3) { toast.error('Max 3 featured services'); return }
                  setSettings(s => ({ ...s, featured_services: next }))
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                  settings.featured_services.includes(k)
                    ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-semibold'
                    : 'border-white/[0.1] text-zinc-400 hover:border-amber-300'
                }`}>
                {SERVICE_ICONS[k]} {v}
                {settings.featured_services.includes(k) && <Star size={11} className="fill-amber-400 text-amber-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Hero copy */}
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 space-y-4">
          <h2 className="font-bold text-white flex items-center gap-2"><Tag size={18} className="text-violet-600" /> Hero Section Copy</h2>
          <p className="text-xs text-zinc-500">Text shown in the landing page hero section.</p>
          <Input
            label="Hero tagline"
            placeholder="Your perfect fit, delivered to you."
            value={settings.hero_tagline}
            onChange={e => setSettings(s => ({ ...s, hero_tagline: e.target.value }))}
          />
          <Input
            label="Promo badge (small pill above headline)"
            placeholder="1,200+ tailors online right now"
            value={settings.promo_badge}
            onChange={e => setSettings(s => ({ ...s, promo_badge: e.target.value }))}
          />
        </div>

        {/* Stats quick view */}
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6">
          <h2 className="font-bold text-white flex items-center gap-2 mb-4"><Store size={18} className="text-violet-600" /> Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/admin/tailors?filter=unverified', label: 'Pending Verifications', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              { href: '/admin/disputes',                  label: 'Open Disputes',          color: 'bg-red-500/10 text-red-400 border-red-200' },
              { href: '/admin/payouts',                   label: 'Pending Payouts',        color: 'bg-green-500/10 text-green-700 border-green-200' },
              { href: '/admin/reviews',                   label: 'Review Moderation',      color: 'bg-violet-50 text-violet-400 border-violet-200' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:opacity-80 ${l.color}`}>
                {l.label} <ArrowLeft size={14} className="rotate-180" />
              </Link>
            ))}
          </div>
        </div>

        <Button size="lg" className="w-full" loading={saving} onClick={save}>
          Save Marketplace Settings
        </Button>
      </div>
    </div>
  )
}
