'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Scissors, ShoppingBag } from 'lucide-react'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('as') === 'tailor' ? 'tailor' : 'customer'
  const supabase = createClient()

  const [role, setRole] = useState<'customer' | 'tailor'>(defaultRole as 'customer' | 'tailor')
  const [loading, setLoading] = useState(false)
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
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name.trim(), role } },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('Account created! Welcome to TailorNow.')
    router.push(role === 'tailor' ? '/onboarding/tailor' : '/browse')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex mb-6 justify-center">
            <Logo size="md" variant="full" animated />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Join thousands using TailorNow</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Role picker */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">I am joining as a...</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRole('customer')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${role === 'customer' ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <ShoppingBag className={role === 'customer' ? 'text-violet-700' : 'text-gray-400'} size={24} />
                <span className={`text-sm font-semibold ${role === 'customer' ? 'text-violet-700' : 'text-gray-600'}`}>Customer</span>
                <span className="text-xs text-gray-400">I want tailoring services</span>
              </button>
              <button type="button" onClick={() => setRole('tailor')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${role === 'tailor' ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <Scissors className={role === 'tailor' ? 'text-violet-700' : 'text-gray-400'} size={24} />
                <span className={`text-sm font-semibold ${role === 'tailor' ? 'text-violet-700' : 'text-gray-600'}`}>Tailor</span>
                <span className="text-xs text-gray-400">I want to offer services</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input label="Full name" type="text" placeholder="e.g. Adedayo Samuel" icon={<User size={16} />}
                value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
            </div>
            <div>
              <Input label="Email address" type="email" placeholder="you@example.com" icon={<Mail size={16} />}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <Input label="Password" type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number" icon={<Lock size={16} />}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
            <div>
              <Input label="Confirm password" type="password" placeholder="Repeat your password" icon={<Lock size={16} />}
                value={form.confirm_password} onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))} />
              {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full !mt-6" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            By signing up you agree to our{' '}
            <Link href="/terms" className="underline">Terms</Link> &amp; <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-400">already have an account?</span></div>
          </div>
          <Link href="/login" className="block text-center text-sm text-violet-700 font-semibold hover:underline">Sign in instead</Link>
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
