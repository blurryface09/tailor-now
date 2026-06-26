'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Phone, Scissors, ShoppingBag } from 'lucide-react'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('as') === 'tailor' ? 'tailor' : 'customer'
  const supabase = createClient()

  const [role, setRole] = useState<'customer' | 'tailor'>(defaultRole as 'customer' | 'tailor')
  const [tab, setTab] = useState<'email' | 'phone'>('email')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', otp: '' })

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, role } },
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Account created! Check your email.')
    router.push(role === 'tailor' ? '/onboarding/tailor' : '/browse')
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('Please enter your full name'); return }
    setLoading(true)
    const phone = form.phone.startsWith('+') ? form.phone : `+234${form.phone.replace(/^0/, '')}`
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { data: { full_name: form.full_name, role } },
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    setOtpSent(true)
    setLoading(false)
    toast.success('OTP sent to your phone!')
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const phone = form.phone.startsWith('+') ? form.phone : `+234${form.phone.replace(/^0/, '')}`
    const { error } = await supabase.auth.verifyOtp({ phone, token: form.otp, type: 'sms' })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Account created!')
    router.push(role === 'tailor' ? '/onboarding/tailor' : '/browse')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6 items-center gap-2">
            <span className="text-2xl font-black text-violet-700">Tailor<span className="text-amber-500">NOW</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Join thousands using TailorNow</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Role picker */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">I am joining as a...</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRole('customer')}
                className={`btn-press flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${role === 'customer' ? 'border-violet-600 bg-violet-50 scale-[1.02] shadow-sm shadow-violet-100' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <ShoppingBag className={role === 'customer' ? 'text-violet-700' : 'text-gray-400'} size={24} />
                <span className={`text-sm font-medium ${role === 'customer' ? 'text-violet-700' : 'text-gray-600'}`}>Customer</span>
                <span className="text-xs text-gray-400">I want tailoring services</span>
              </button>
              <button
                onClick={() => setRole('tailor')}
                className={`btn-press flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${role === 'tailor' ? 'border-violet-600 bg-violet-50 scale-[1.02] shadow-sm shadow-violet-100' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Scissors className={role === 'tailor' ? 'text-violet-700' : 'text-gray-400'} size={24} />
                <span className={`text-sm font-medium ${role === 'tailor' ? 'text-violet-700' : 'text-gray-600'}`}>Tailor</span>
                <span className="text-xs text-gray-400">I want to offer services</span>
              </button>
            </div>
          </div>

          {/* Auth tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
            {(['email', 'phone'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'email' ? '📧 Email' : '📱 Phone OTP'}
              </button>
            ))}
          </div>

          <Input label="Full name" type="text" placeholder="Your full name" icon={<User size={16} />}
            value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} required className="mb-4" />

          {tab === 'email' ? (
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <Input label="Email address" type="email" placeholder="you@example.com" icon={<Mail size={16} />}
                value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
              <Input label="Password" type="password" placeholder="Min. 8 characters" icon={<Lock size={16} />}
                value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} minLength={8} required />
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Create account
              </Button>
            </form>
          ) : (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              <Input label="Phone number" type="tel" placeholder="08012345678" icon={<Phone size={16} />}
                value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                disabled={otpSent} required />
              {otpSent && (
                <Input label="Enter OTP" type="text" placeholder="6-digit code" maxLength={6}
                  value={form.otp} onChange={(e) => setForm(f => ({ ...f, otp: e.target.value }))} required />
              )}
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {otpSent ? 'Verify OTP' : 'Send OTP'}
              </Button>
              {otpSent && (
                <button type="button" onClick={() => setOtpSent(false)} className="text-sm text-gray-500 hover:text-violet-600 w-full text-center">
                  ← Change number
                </button>
              )}
            </form>
          )}

          <p className="text-center text-xs text-gray-400 mt-4">
            By signing up you agree to our{' '}
            <Link href="/terms" className="underline">Terms</Link> &amp; <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-400">already have an account?</span></div>
          </div>
          <Link href="/login" className="block text-center text-sm text-violet-700 font-medium hover:underline">Sign in instead</Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" /></div>}>
      <SignupContent />
    </Suspense>
  )
}
