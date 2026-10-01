'use client'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { isIndependenceDay } from '@/lib/utils'

const DISMISS_KEY = 'tailornow-independence-banner-dismissed'

// Shows automatically on Oct 1 (Nigeria's own calendar date) and reverts
// the next day — nothing to toggle, no admin step, so it can never be
// stuck half-configured the way a database-driven setting can.
export function IndependenceDayBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isIndependenceDay()) return
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return
    } catch {
      // sessionStorage unavailable — just show it, no per-viewer memory
    }
    setVisible(true)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // best-effort only
    }
  }

  return (
    <div className="relative bg-gradient-to-r from-green-700 via-white to-green-700 px-4 py-3 text-center">
      <span className="text-sm sm:text-base font-bold text-green-900">
        🇳🇬 Happy Independence Day! Book your outfit today — Better Fashion, Better Nigeria.
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-green-900/70 hover:text-green-900 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
