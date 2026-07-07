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
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    const metadataRole = data.user.user_metadata?.role === 'tailor' ? 'tailor' : null
    const role = profile?.role === 'admin' ? 'admin' : metadataRole || profile?.role || 'customer'
    if (!profile || (metadataRole === 'tailor' && profile.role !== 'tailor')) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || '',
        role,
      }, { onConflict: 'id' })
    }
    if (role === 'tailor') router.push('/dashboard')
    else if (role === 'admin') router.push('/admin')
    else router.push('/home')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f3eeff 0%, #ffffff 50%, #fffbf0 100%)' }}>
      <ThreeBackground variant="light" />

      {/* Left — form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 relative z-10">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-violet-300/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-300/12 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md mx-auto relative">
          <Link href="/" className="inline-flex mb-10">
            <Logo size="md" variant="full" />
          </Link>

          <div className="mb-8 fade-up">
            <h1 className="text-3xl font-black text-zinc-900 mb-2">Welcome back</h1>
            <p className="text-zinc-500">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 fade-up-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input type="email" placeholder="you@example.com" value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-zinc-900 placeholder:text-zinc-400 text-sm transition-all duration-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-violet-600 hover:text-violet-700 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input type="password" placeholder="Your password" value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-zinc-900 placeholder:text-zinc-400 text-sm transition-all duration-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 shadow-sm"
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99] text-sm mt-2">
              {loading
                ? <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="relative my-7 fade-up-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-4 text-sm text-zinc-400">or</span></div>
          </div>

          <p className="text-center text-sm text-zinc-500 fade-up-3">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-violet-600 font-semibold hover:text-violet-700 transition-colors">Sign up free →</Link>
          </p>
        </div>
      </div>

      {/* Right — fashion collage (lg+) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-l from-transparent via-white/5 to-white/40" />
        <div className="absolute inset-0 grid grid-cols-2 gap-1.5 p-1.5">
          {FASHION_COLLAGE.map((src, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          ))}
        </div>
        <div className="absolute bottom-8 left-8 z-20 bg-white/90 backdrop-blur-xl border border-zinc-200 rounded-2xl px-5 py-4 shadow-2xl shadow-zinc-200/60">
          <p className="text-zinc-900 font-bold text-lg">Your style, perfected.</p>
          <p className="text-zinc-500 text-sm mt-0.5">Nigeria&apos;s top fashion creatives</p>
          <div className="flex items-center gap-2 mt-3">
            {['✂️', '👗', '🎨', '✨'].map((e, i) => (
              <span key={i} className="w-8 h-8 bg-violet-50 rounded-full flex items-center justify-center text-sm border border-violet-100">{e}</span>
            ))}
            <span className="text-xs text-zinc-400 ml-1">Join 10,000+ users</span>
          </div>
        </div>
      </div>
    </div>
  )
}
