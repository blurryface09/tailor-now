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
      <body className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-red-500/20 border border-red-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 8v12M18 24v2" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M3 31L18 5l15 26H3z" stroke="#F87171" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h1 className="text-xl font-black text-white">Something went wrong</h1>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
            An unexpected error occurred. Your data is safe — no payments were affected.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-600 mt-2 font-mono">Error ID: {error.digest}</p>
          )}
          <div className="flex gap-3 mt-6">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/25"
            >
              <RefreshCw size={14} /> Try again
            </button>
            <Link href="/" className="flex-1 flex items-center justify-center gap-2 py-3 border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/20 text-sm font-semibold rounded-xl transition-colors">
              <Home size={14} /> Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
