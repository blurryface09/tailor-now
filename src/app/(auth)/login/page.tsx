'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { Mail, Lock, Phone } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<'email' | 'phone'>('email')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', phone: '', otp: '' })

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Welcome back!')
    router.push('/browse')
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const phone = form.phone.startsWith('+') ? form.phone : `+234${form.phone.replace(/^0/, '')}`
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) { toast.error(error.message); setLoading(false); return }
    setOtpSent(true)
    setLoading(false)
    toast.success('OTP sent!')
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const phone = form.phone.startsWith('+') ? form.phone : `+234${form.phone.replace(/^0/, '')}`
    const { error } = await supabase.auth.verifyOtp({ phone, token: form.otp, type: 'sms' })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Welcome back!')
    router.push('/browse')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6 items-center gap-2">
            <span className="text-2xl font-black text-violet-700">Tailor<span className="text-amber-500">NOW</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            {(['email', 'phone'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'email' ? '📧 Email' : '📱 Phone OTP'}
              </button>
            ))}
          </div>

          {tab === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <Input label="Email address" type="email" placeholder="you@example.com" icon={<Mail size={16} />}
                value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
              <Input label="Password" type="password" placeholder="Your password" icon={<Lock size={16} />}
                value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required />
              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-violet-600 hover:underline">Forgot password?</Link>
              </div>
              <Button type="submit" size="lg" className="w-full" loading={loading}>Sign in</Button>
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-400">or</span></div>
          </div>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-violet-700 font-medium hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
