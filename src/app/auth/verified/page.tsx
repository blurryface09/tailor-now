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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center page-enter">
        <Link href="/" className="inline-flex mb-8 justify-center">
          <Logo size="md" variant="full" animated />
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {checking ? (
            <>
              <div className="animate-spin w-10 h-10 border-4 border-violet-700 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-gray-500">Verifying your email…</p>
            </>
          ) : hasError ? (
            <>
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle size={28} className="text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h1>
              <p className="text-sm text-gray-500 mb-6">
                This link may have expired or already been used.
              </p>
              <Link href="/login"
                className="inline-block bg-violet-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-violet-800 transition-colors">
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h1>
              <p className="text-sm text-gray-500">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" />
      </div>
    }>
      <VerifiedContent />
    </Suspense>
  )
}
