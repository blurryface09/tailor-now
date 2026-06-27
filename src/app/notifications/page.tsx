'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { formatRelativeTime } from '@/lib/utils'
import { Bell, Package, Heart, UserPlus, MessageSquare, CheckCircle, CreditCard } from 'lucide-react'
import Link from 'next/link'
import type { Notification } from '@/types'

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  order_update: { icon: <Package size={16} />, color: 'bg-violet-100 text-violet-700' },
  payment:      { icon: <CreditCard size={16} />, color: 'bg-green-100 text-green-700' },
  post_like:    { icon: <Heart size={16} />, color: 'bg-pink-100 text-pink-700' },
  post_comment: { icon: <MessageSquare size={16} />, color: 'bg-blue-100 text-blue-700' },
  new_follower: { icon: <UserPlus size={16} />, color: 'bg-amber-100 text-amber-700' },
}

export default function NotificationsPage() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications(data || [])
    setUnreadCount((data || []).filter(n => !n.read).length)
    setLoading(false)

    // Mark all as read
    if ((data || []).some(n => !n.read)) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
    }
  }

  const getLink = (n: Notification) => {
    if (n.data?.order_id) return `/orders/${n.data.order_id}`
    if (n.data?.post_id) return `/feed`
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell size={22} className="text-violet-700" /> Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-violet-600 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-violet-300" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No notifications yet</h3>
            <p className="text-sm text-gray-500">We'll let you know when something happens</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.order_update
              const href = getLink(n)
              const itemClass = `flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                !n.read ? 'bg-violet-50 border-violet-100' : 'bg-white border-gray-100 hover:border-gray-200'
              }`
              const inner = (
                <>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    {n.body && <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-violet-600 flex-shrink-0 mt-2" />
                  )}
                </>
              )
              return href ? (
                <Link key={n.id} href={href} className={itemClass}>{inner}</Link>
              ) : (
                <div key={n.id} className={itemClass}>{inner}</div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
