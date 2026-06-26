'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { Mail, Lock } from 'lucide-react'

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
    // Route based on role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    if (profile?.role === 'tailor') router.push('/dashboard')
    else if (profile?.role === 'admin') router.push('/admin')
    else router.push('/home')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6 justify-center">
            <Logo size="md" variant="full" animated />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input label="Email address" type="email" placeholder="you@example.com" icon={<Mail size={16} />}
              value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
            <Input label="Password" type="password" placeholder="Your password" icon={<Lock size={16} />}
              value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required />
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-violet-600 hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" size="lg" className="w-full !mt-6" loading={loading}>Sign in</Button>
          </form>

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
