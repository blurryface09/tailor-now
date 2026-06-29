'use client'
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-3xl">✂️</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">You're offline</h1>
      <p className="text-gray-500 text-sm max-w-xs">
        Check your internet connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold"
      >
        Try again
      </button>
    </div>
  )
}
