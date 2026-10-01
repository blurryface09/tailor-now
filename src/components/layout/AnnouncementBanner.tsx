'use client'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AnnouncementColor = 'violet' | 'amber' | 'green' | 'red'

const COLOR_CLASSES: Record<AnnouncementColor, string> = {
  violet: 'bg-violet-600 text-white',
  amber: 'bg-amber-400 text-black',
  green: 'bg-green-600 text-white',
  red: 'bg-red-600 text-white',
}

const DISMISS_KEY = 'tailornow-announcement-dismissed'

export function AnnouncementBanner() {
  const [text, setText] = useState<string | null>(null)
  const [color, setColor] = useState<AnnouncementColor>('violet')
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('marketplace_settings')
      .select('value')
      .eq('key', 'config')
      .maybeSingle()
      .then(({ data }) => {
        const value = data?.value as { announcement_enabled?: boolean; announcement_text?: string; announcement_color?: AnnouncementColor } | undefined
        if (!value?.announcement_enabled || !value.announcement_text) return
        setText(value.announcement_text)
        setColor(value.announcement_color || 'violet')

        try {
          if (sessionStorage.getItem(DISMISS_KEY) === value.announcement_text) return
        } catch {
          // sessionStorage unavailable — just show it, no per-viewer memory
        }
        setDismissed(false)
      })
  }, [])

  if (!text || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, text)
    } catch {
      // best-effort only
    }
  }

  return (
    <div className={`${COLOR_CLASSES[color]} px-4 py-2.5 text-sm font-semibold text-center relative`}>
      <span className="pr-6">{text}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={15} />
      </button>
    </div>
  )
}
