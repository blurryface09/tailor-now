import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#140F1E] flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>
      <div className="text-center max-w-sm relative z-10">
        <div className="mb-6">
          <span className="text-3xl font-black text-violet-400">Tailor<span className="text-amber-400">NOW</span></span>
        </div>

        <div className="relative mb-6">
          <p className="text-8xl font-black text-white/10 select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-violet-500/20 border border-violet-500/30 rounded-3xl flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M7 29L29 7M7 7l22 22" stroke="#4B3B66" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-xl font-black text-white">Page not found</h1>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex flex-col gap-3 mt-8">
          <Link href="/" className="py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors text-center shadow-lg shadow-violet-500/25">
            Go to homepage
          </Link>
          <Link href="/browse" className="py-3 border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/20 text-sm font-semibold rounded-xl transition-colors text-center">
            Browse creatives
          </Link>
        </div>
      </div>
    </div>
  )
}
