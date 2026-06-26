'use client'
import { useEffect } from 'react'
import { RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[TailorNow error]', error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 8v12M18 24v2" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M3 31L18 5l15 26H3z" stroke="#DC2626" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h1 className="text-xl font-black text-gray-900">Something went wrong</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            An unexpected error occurred. Your data is safe — no payments were affected.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 mt-2 font-mono">Error ID: {error.digest}</p>
          )}
          <div className="flex gap-3 mt-6">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-700 text-white text-sm font-semibold rounded-xl hover:bg-violet-800 transition-colors"
            >
              <RefreshCw size={14} /> Try again
            </button>
            <Link href="/" className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              <Home size={14} /> Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
