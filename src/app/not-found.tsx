import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="mb-6">
          <span className="text-3xl font-black text-violet-700">Tailor<span className="text-amber-500">NOW</span></span>
        </div>

        <div className="relative mb-6">
          <p className="text-8xl font-black text-violet-100 select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M7 29L29 7M7 7l22 22" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-xl font-black text-gray-900">Page not found</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex flex-col gap-3 mt-8">
          <Link href="/" className="py-3 bg-violet-700 text-white text-sm font-semibold rounded-xl hover:bg-violet-800 transition-colors text-center">
            Go to homepage
          </Link>
          <Link href="/browse" className="py-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors text-center">
            Browse tailors
          </Link>
        </div>
      </div>
    </div>
  )
}
