'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { generateReferralCode } from '@/lib/utils'
import { Copy, Check, Gift, Users, TrendingUp, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'

type ReferralStats = { referred: number; active: number; earned: number }

export default function ReferralPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<{ full_name: string; referral_code: string | null; role: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<ReferralStats>({ referred: 0, active: 0, earned: 0 })
  const isTailor = profile?.role === 'tailor'

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('full_name, referral_code, role').eq('id', user.id).single()
      if (data && !data.referral_code) {
        // Generate and save referral code on first visit
        const code = generateReferralCode(data.full_name || 'USER')
        await supabase.from('profiles').update({ referral_code: code }).eq('id', user.id)
        setProfile({ ...data, referral_code: code })
      } else {
        setProfile(data)
      }

      const { data: referrals } = await supabase
        .from('referrals')
        .select('status, reward_amount')
        .eq('referrer_id', user.id)

      if (referrals) {
        setStats({
          referred: referrals.length,
          active: referrals.filter(r => r.status === 'qualified' || r.status === 'rewarded').length,
          earned: referrals.reduce((sum, r) => sum + (r.reward_amount || 0), 0),
        })
      }
    })
  }, [])

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${profile?.referral_code}`

  const copy = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Join TailorNow', text: 'Find amazing tailors for your outfits', url: referralLink })
    } else {
      copy()
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 page-enter">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500/100 to-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200 text-4xl">
            🎁
          </div>
          <h1 className="text-2xl font-black text-zinc-900">Refer and Earn</h1>
          <p className="text-zinc-500 mt-2 max-w-sm mx-auto">
            {isTailor
              ? 'Invite your own clients or other creatives — both pay off.'
              : 'Invite creatives to TailorNow. Earn ₦2,000 credit when they complete their first 3 orders.'}
          </p>
        </div>

        {isTailor && (
          <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl shadow-sm p-6 mb-6 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-200 mb-2">For your own clients</p>
            <h2 className="text-lg font-black mb-1.5">Keep 100% on their first order</h2>
            <p className="text-sm text-violet-100 leading-relaxed">
              Send this same link to a client you already work with. When they sign up through it and place
              their first order with <strong>you</strong>, TailorNow waives its commission on that order —
              you keep the full amount. After that, the normal rate applies. Every order after also builds
              your public rating, which is what brings you customers you didn&apos;t already have.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: <Users size={18} />, label: 'Referred', value: stats.referred, color: 'text-violet-600 bg-violet-50' },
            { icon: <TrendingUp size={18} />, label: 'Active', value: stats.active, color: 'text-green-700 bg-green-100' },
            { icon: <Gift size={18} />, label: 'Earned (₦)', value: Math.round(stats.earned).toLocaleString(), color: 'text-amber-600 bg-amber-100' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 text-center card-lift">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>{s.icon}</div>
              <div className="text-xl font-black text-zinc-900">{s.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Referral link */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-zinc-900 mb-4">Your referral link</h2>
          <div className="flex gap-2">
            <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-600 truncate font-mono">
              {profile?.referral_code ? referralLink : 'Loading...'}
            </div>
            <button onClick={copy}
              className="flex items-center gap-2 px-4 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-all active:scale-95">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex gap-3 mt-3">
            <button onClick={share}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-zinc-200 text-zinc-600 text-sm font-semibold rounded-xl hover:bg-zinc-50 transition-colors">
              <Share2 size={15} /> Share via WhatsApp or socials
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-zinc-900 mb-1">
            {isTailor ? 'Referring other creatives' : 'How it works'}
          </h2>
          {isTailor && (
            <p className="text-xs text-zinc-500 mb-4">A separate bonus from the client-invite offer above.</p>
          )}
          <div className="space-y-4">
            {[
              { step: '1', title: 'Share your link', desc: 'Send your referral link to creatives you know via WhatsApp, Instagram, or anywhere.' },
              { step: '2', title: 'They sign up', desc: 'When a creative creates their account using your link, they are linked to you.' },
              { step: '3', title: 'They complete 3 orders', desc: 'Once your referred creative completes their first 3 orders on TailorNow, you qualify for the bonus.' },
              { step: '4', title: 'You earn ₦2,000', desc: 'Credit is added to your TailorNow wallet automatically. No limit on how many you refer.' },
            ].map(item => (
              <div key={item.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 font-black text-sm flex items-center justify-center flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">{item.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
