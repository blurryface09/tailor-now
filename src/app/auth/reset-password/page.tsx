'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import { CheckCircle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { toast.error(error.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-fuchsia-600/8 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md page-enter relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6 justify-center">
            <Logo size="md" variant="full" animated />
          </Link>
        </div>

        <div className="bg-white/[0.05] backdrop-blur-xl rounded-3xl border border-white/[0.09] p-8 shadow-2xl">
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Password updated!</h1>
              <p className="text-sm text-zinc-400">Redirecting you to sign in…</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-4">
              <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin mx-auto mb-4" />
              <p className="text-sm text-zinc-400">Verifying your reset link…</p>
              <p className="text-xs text-zinc-600 mt-2">
                If nothing happens,{' '}
                <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300 underline">request a new link</Link>.
              </p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-violet-500/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mb-4">
                <Lock size={24} className="text-violet-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Set new password</h1>
              <p className="text-sm text-zinc-400 mb-6">Choose a strong password you haven&apos;t used before.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 block mb-1.5">New password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 text-sm transition-all focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.08]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 block mb-1.5">Confirm new password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 text-sm transition-all focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.08]"
                    />
                  </div>
                </div>
                {password && confirm && password !== confirm && (
                  <p className="text-xs text-red-400">Passwords don&apos;t match</p>
                )}
                <button
                  type="submit"
                  disabled={loading || !password || !confirm || password !== confirm}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-500/30 text-sm mt-2"
                >
                  {loading
                    ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
