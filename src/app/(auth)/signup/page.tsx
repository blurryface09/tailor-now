'use client'
export const dynamic = 'force-dynamic'
import { useState, Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Scissors, ShoppingBag, CheckCircle, ArrowRight } from 'lucide-react'

const ThreeBackground = nextDynamic(
  () => import('@/components/three/ThreeBackground').then(m => m.ThreeBackground),
  { ssr: false }
)

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('as') === 'tailor' ? 'tailor' : 'customer'
  const supabase = createClient()

  const [role, setRole] = useState<'customer' | 'tailor'>(defaultRole as 'customer' | 'tailor')
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)
  const [signedUpEmail, setSignedUpEmail] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.full_name.trim() || form.full_name.trim().length < 2) e.full_name = 'Enter your full name'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email address'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(form.password)) e.password = 'Password must contain at least one uppercase letter'
    if (!/[0-9]/.test(form.password)) e.password = 'Password must contain at least one number'
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tailornow.shop'
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name.trim(), role },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    if (!data.session) {
      setSignedUpEmail(form.email)
      setCheckEmail(true)
      setLoading(false)
      if (data.user?.id) {
        fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id, role }),
        }).catch(() => {})
      }
      return
    }
    if (role === 'customer' && data.user?.id) {
      fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, role: 'customer' }),
      }).catch(() => {})
    }
    toast.success('Account created! Welcome to TailorNow.')
    router.push(role === 'tailor' ? '/onboarding/tailor' : '/home')
  }

  if (checkEmail) return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #f3eeff 0%, #ffffff 50%, #fffbf0 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md text-center page-enter relative z-10">
        <Link href="/" className="inline-flex mb-8 justify-center">
          <Logo size="md" variant="full" animated />
        </Link>
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-xl shadow-zinc-200/60">
          <div className="w-14 h-14 bg-violet-100 border border-violet-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-violet-600" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Check your email</h1>
          <p className="text-sm text-zinc-500 mb-1">We sent a verification link to</p>
          <p className="font-semibold text-zinc-900 mb-4">{signedUpEmail}</p>
          <p className="text-sm text-zinc-400 mb-6">
            Click the link in the email to verify your account and continue.
            The link expires in 24 hours.
          </p>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left mb-4">
            <CheckCircle size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">Don&apos;t forget to check your spam/junk folder if you don&apos;t see it.</p>
          </div>
          <Link href="/login" className="text-sm text-violet-600 font-semibold hover:text-violet-700 transition-colors">
            Back to sign in →
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative" style={{ background: 'linear-gradient(135deg, #f3eeff 0%, #ffffff 50%, #fffbf0 100%)' }}>
      <ThreeBackground variant="light" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-200/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 page-enter">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6 justify-center">
            <Logo size="md" variant="full" animated />
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Create your account</h1>
          <p className="text-zinc-500 mt-1">Join thousands using TailorNow</p>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-xl shadow-zinc-200/60">
          {/* Role picker */}
          <div className="mb-6">
            <p className="text-sm font-medium text-zinc-600 mb-3">I am joining as a...</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRole('customer')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${role === 'customer' ? 'border-violet-400 bg-violet-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}>
                <ShoppingBag className={role === 'customer' ? 'text-violet-600' : 'text-zinc-400'} size={24} />
                <span className={`text-sm font-semibold ${role === 'customer' ? 'text-violet-700' : 'text-zinc-500'}`}>Customer</span>
                <span className="text-xs text-zinc-400">I want tailoring services</span>
              </button>
              <button type="button" onClick={() => setRole('tailor')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${role === 'tailor' ? 'border-violet-400 bg-violet-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}>
                <Scissors className={role === 'tailor' ? 'text-violet-600' : 'text-zinc-400'} size={24} />
                <span className={`text-sm font-semibold ${role === 'tailor' ? 'text-violet-700' : 'text-zinc-500'}`}>Creative</span>
                <span className="text-xs text-zinc-400">I want to offer services</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: 'full_name', label: 'Full name', type: 'text', placeholder: 'e.g. Adedayo Samuel', icon: <User size={16} /> },
              { field: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com', icon: <Mail size={16} /> },
              { field: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 chars, 1 uppercase, 1 number', icon: <Lock size={16} /> },
              { field: 'confirm_password', label: 'Confirm password', type: 'password', placeholder: 'Repeat your password', icon: <Lock size={16} /> },
            ].map(({ field, label, type, placeholder, icon }) => (
              <div key={field}>
                <label className="text-sm font-medium text-zinc-700 block mb-1.5">{label}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</span>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-3 text-zinc-900 placeholder:text-zinc-400 text-sm transition-all duration-200 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 shadow-sm"
                  />
                </div>
                {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99] text-sm mt-2">
              {loading
                ? <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400 mt-4">
            By signing up you agree to our{' '}
            <Link href="/terms" className="underline text-zinc-500 hover:text-zinc-700">Terms</Link> &amp; <Link href="/privacy" className="underline text-zinc-500 hover:text-zinc-700">Privacy Policy</Link>
          </p>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-zinc-400">already have an account?</span></div>
          </div>
          <Link href="/login" className="block text-center text-sm text-violet-600 font-semibold hover:text-violet-700 transition-colors">Sign in instead →</Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f3eeff 0%, #ffffff 50%, #fffbf0 100%)' }}><div className="w-8 h-8 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" /></div>}>
      <SignupContent />
    </Suspense>
  )
}
