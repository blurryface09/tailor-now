'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import nextDynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import toast from 'react-hot-toast'
import { Mail, Lock, ArrowRight } from 'lucide-react'

const ThreeBackground = nextDynamic(
  () => import('@/components/three/ThreeBackground').then(m => m.ThreeBackground),
  { ssr: false }
)

const FASHION_COLLAGE = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80',
]

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please enter your email and password'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Welcome back!')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    if (profile?.role === 'tailor') router.push('/dashboard')
    else if (profile?.role === 'admin') router.push('/admin')
    else router.push('/home')
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      <ThreeBackground variant="subtle" />
      {/* Left — form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 relative z-10">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-violet-600/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-fuchsia-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md mx-auto relative">
          <Link href="/" className="inline-flex mb-10">
            <Logo size="md" variant="full" animated />
          </Link>

          <div className="mb-8 fade-up">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-zinc-400">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 fade-up-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="email" placeholder="you@example.com" value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 text-sm transition-all duration-200 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.08]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300">Password</label>
                <Link href="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="password" placeholder="Your password" value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 text-sm transition-all duration-200 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.08]"
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.01] active:scale-[0.99] text-sm mt-2">
              {loading
                ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="relative my-7 fade-up-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.08]" /></div>
            <div className="relative flex justify-center"><span className="bg-[#09090B] px-4 text-sm text-zinc-600">or</span></div>
          </div>

          <p className="text-center text-sm text-zinc-500 fade-up-3">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">Sign up free →</Link>
          </p>
        </div>
      </div>

      {/* Right — fashion collage (lg+) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-l from-transparent via-[#09090B]/10 to-[#09090B]/60" />
        <div className="absolute inset-0 grid grid-cols-2 gap-1.5 p-1.5">
          {FASHION_COLLAGE.map((src, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ))}
        </div>
        <div className="absolute bottom-8 left-8 z-20 bg-black/70 backdrop-blur-xl border border-white/[0.1] rounded-2xl px-5 py-4 shadow-2xl">
          <p className="text-white font-bold text-lg">Your style, perfected.</p>
          <p className="text-zinc-400 text-sm mt-0.5">Nigeria&apos;s top fashion creatives</p>
          <div className="flex items-center gap-2 mt-3">
            {['✂️', '👗', '🎨', '✨'].map((e, i) => (
              <span key={i} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm border border-white/10">{e}</span>
            ))}
            <span className="text-xs text-zinc-400 ml-1">Join 10,000+ users</span>
          </div>
        </div>
      </div>
    </div>
  )
}
