'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#140F1E] flex items-center justify-center px-4">
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6 justify-center">
            <Logo size="md" variant="full" animated />
          </Link>
        </div>

        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl shadow-sm border border-white/[0.08] p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
              <p className="text-sm text-zinc-500 mb-1">
                We sent a password reset link to
              </p>
              <p className="text-sm font-semibold text-zinc-100 mb-6">{email}</p>
              <p className="text-xs text-zinc-600 mb-6">
                Didn't receive it? Check your spam folder, or{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-violet-600 hover:underline font-medium"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/login"
                className="inline-block px-5 py-2.5 bg-violet-700 text-white text-sm font-semibold rounded-xl hover:bg-violet-800 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
                <Mail size={24} className="text-violet-700" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Forgot password?</h1>
              <p className="text-sm text-zinc-500 mb-6">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  icon={<Mail size={16} />}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" size="lg" className="w-full !mt-6" loading={loading}>
                  Send Reset Link
                </Button>
              </form>
              <p className="text-center text-sm text-zinc-500 mt-5">
                Remember your password?{' '}
                <Link href="/login" className="text-violet-400 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
