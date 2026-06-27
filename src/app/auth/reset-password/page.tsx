'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
    // Supabase fires an auth state change when the reset link is clicked
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6 justify-center">
            <Logo size="md" variant="full" animated />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h1>
              <p className="text-sm text-gray-500">Redirecting you to sign in…</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-gray-500">Verifying your reset link…</p>
              <p className="text-xs text-gray-400 mt-2">
                If nothing happens,{' '}
                <Link href="/forgot-password" className="text-violet-600 hover:underline">request a new link</Link>.
              </p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
                <Lock size={24} className="text-violet-700" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Set new password</h1>
              <p className="text-sm text-gray-500 mb-6">Choose a strong password you haven't used before.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="New password"
                  type="password"
                  placeholder="At least 8 characters"
                  icon={<Lock size={16} />}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  placeholder="Repeat your password"
                  icon={<Lock size={16} />}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
                {password && confirm && password !== confirm && (
                  <p className="text-xs text-red-500">Passwords don't match</p>
                )}
                <Button type="submit" size="lg" className="w-full !mt-6" loading={loading}
                  disabled={!password || !confirm || password !== confirm}>
                  Update Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
