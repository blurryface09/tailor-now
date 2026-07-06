'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'
import { Suspense } from 'react'

function VerifiedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasError = searchParams.get('error') === '1'
  const supabase = createClient()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (hasError) { setChecking(false); return }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setChecking(false); return }
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
        setChecking(false)
        const dest = data?.role === 'tailor' ? '/onboarding/tailor' : '/home'
        setTimeout(() => router.push(dest), 2000)
      })
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md text-center page-enter relative z-10">
        <Link href="/" className="inline-flex mb-8 justify-center">
          <Logo size="md" variant="full" animated />
        </Link>

        <div className="bg-white/[0.05] backdrop-blur-xl rounded-3xl border border-white/[0.09] p-8 shadow-2xl">
          {checking ? (
            <>
              <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 animate-spin rounded-full mx-auto mb-4" />
              <p className="text-sm text-zinc-400">Verifying your email…</p>
            </>
          ) : hasError ? (
            <>
              <div className="w-14 h-14 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle size={28} className="text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Verification failed</h1>
              <p className="text-sm text-zinc-400 mb-6">
                This link may have expired or already been used.
              </p>
              <Link href="/login"
                className="inline-block bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-violet-500/25">
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Email verified!</h1>
              <p className="text-sm text-zinc-400">
                Taking you to your account…
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifiedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      </div>
    }>
      <VerifiedContent />
    </Suspense>
  )
}
