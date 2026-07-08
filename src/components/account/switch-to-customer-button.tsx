'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ShoppingBag } from 'lucide-react'

export function SwitchToCustomerButton({ className = '' }: { className?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const switchRole = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/account/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Could not switch your account')
        return
      }
      toast.success('Switched to customer account')
      router.push('/home')
      router.refresh()
    } catch {
      toast.error('Could not switch your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={switchRole}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60 ${className}`}
    >
      <ShoppingBag size={16} />
      {loading ? 'Switching...' : 'Continue as customer'}
    </button>
  )
}
