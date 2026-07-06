'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Shield, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const makeAdmin = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('You must be logged in'); setLoading(false); return }

    // Only allow if no admins exist yet
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    if ((count || 0) > 0) {
      toast.error('An admin already exists. Contact the existing admin.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)

    if (error) { toast.error(error.message); setLoading(false); return }

    setDone(true)
    toast.success('You are now admin!')
    setTimeout(() => router.push('/admin'), 1500)
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6"><Logo size="md" variant="full" /></div>

        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8 shadow-sm">
          {done ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle size={48} className="text-green-500" />
              <h1 className="text-xl font-bold text-white">You're now an admin!</h1>
              <p className="text-sm text-zinc-500">Redirecting to admin panel…</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-violet-700" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Admin Setup</h1>
              <p className="text-sm text-zinc-500 mb-6">
                This page promotes your logged-in account to admin.
                It only works once — if an admin already exists, this page will reject the request.
              </p>
              <Button size="lg" className="w-full" loading={loading} onClick={makeAdmin}>
                <Shield size={16} /> Make Me Admin
              </Button>
              <p className="text-xs text-zinc-600 mt-4">You must be logged in to use this page.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
