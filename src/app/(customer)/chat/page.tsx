'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Send, Phone, ArrowLeft, AlertTriangle, Lock, ShieldCheck } from 'lucide-react'
import { formatRelativeTime, classifyMessage, containsBankDetails, cn } from '@/lib/utils'
import type { ChatRoom, ChatMessage, Profile } from '@/types'
import Link from 'next/link'
import toast from 'react-hot-toast'

type MessageWithSender = ChatMessage & { sender: Profile }
type RoomWithProfiles = ChatRoom & { customer: Profile; tailor: Profile }

function FraudWarning({ onDismiss, onCancel }: { onDismiss: () => void; onCancel: () => void }) {
  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-20 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm bounce-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Payment outside the app?</h3>
            <p className="text-xs text-gray-500">This looks like bank details</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Sending bank account details may lead to losing your payment protection, dispute coverage, and order guarantee. Keep all payments inside TailorNow — you are protected.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Edit message
          </button>
          <button onClick={onDismiss} className="flex-1 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
            Send anyway
          </button>
        </div>
      </div>
    </div>
  )
}

function ContactGateModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm bounce-in text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-amber-600" />
        </div>
        <h3 className="font-bold text-gray-900 mb-2">Pay deposit to unlock contact</h3>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Contact sharing unlocks after the deposit is paid on an order. This protects both you and the tailor.
        </p>
        <div className="space-y-2">
          <Link href="/orders/new" className="block w-full py-3 bg-violet-700 text-white text-sm font-bold rounded-xl hover:bg-violet-800 transition-colors">
            Place an order first
          </Link>
          <button onClick={onClose} className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function ChatContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const tailorId = searchParams.get('tailor')
  const orderId = searchParams.get('order')

  const [userId, setUserId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<RoomWithProfiles[]>([])
  const [activeRoom, setActiveRoom] = useState<RoomWithProfiles | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showFraudWarning, setShowFraudWarning] = useState(false)
  const [showContactGate, setShowContactGate] = useState(false)
  const [hasDepositOrder, setHasDepositOrder] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); loadRooms(user.id) }
    })
  }, [])

  useEffect(() => {
    if (activeRoom && userId) {
      loadMessages(activeRoom.id)
      checkDepositOrder(activeRoom)
      const channel = supabase.channel(`room-${activeRoom.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoom.id}` },
          () => loadMessages(activeRoom.id))
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [activeRoom?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkDepositOrder = async (room: RoomWithProfiles) => {
    const { data } = await supabase.from('orders')
      .select('id, deposit_paid')
      .eq('customer_id', room.customer_id)
      .eq('tailor_id', room.tailor_id)
      .eq('deposit_paid', true)
      .limit(1)
    setHasDepositOrder((data || []).length > 0)
  }

  const loadRooms = async (uid: string) => {
    const { data } = await supabase.from('chat_rooms')
      .select('*, customer:profiles!chat_rooms_customer_id_fkey(*), tailor:profiles!chat_rooms_tailor_id_fkey(*)')
      .or(`customer_id.eq.${uid},tailor_id.eq.${uid}`)
      .order('last_message_at', { ascending: false })
    setRooms(data || [])
    if (tailorId && uid && data) {
      const existing = data.find(r => r.tailor_id === tailorId)
      if (existing) { setActiveRoom(existing) } else { await createRoom(uid, tailorId) }
    }
  }

  const createRoom = async (customerId: string, tId: string) => {
    const tailorProfile = await supabase.from('tailor_profiles').select('user_id').eq('id', tId).single()
    const tailorUserId = tailorProfile.data?.user_id
    if (!tailorUserId) return
    const { data: room } = await supabase.from('chat_rooms').upsert({
      customer_id: customerId, tailor_id: tailorUserId, order_id: orderId || null,
    }, { onConflict: 'customer_id,tailor_id' }).select('*, customer:profiles!chat_rooms_customer_id_fkey(*), tailor:profiles!chat_rooms_tailor_id_fkey(*)').single()
    if (room) { setActiveRoom(room); loadRooms(customerId) }
  }

  const loadMessages = async (roomId: string) => {
    const { data } = await supabase.from('chat_messages')
      .select('*, sender:profiles(*)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    await supabase.from('chat_messages').update({ read: true }).eq('room_id', roomId).neq('sender_id', userId)
  }

  const submitMessage = async (content: string) => {
    if (!content.trim() || !activeRoom || !userId) return
    setSending(true)
    await supabase.from('chat_messages').insert({ room_id: activeRoom.id, sender_id: userId, content: content.trim() })
    await supabase.from('chat_rooms').update({ last_message: content.trim(), last_message_at: new Date().toISOString() }).eq('id', activeRoom.id)
    setText('')
    setSending(false)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    const flag = classifyMessage(text)
    if (flag.blocked) {
      toast.error(flag.reason)
      return
    }
    if (!flag.blocked && 'warned' in flag && flag.warned) {
      setPendingMessage(text)
      setShowFraudWarning(true)
      return
    }
    await submitMessage(text)
  }

  const sendContact = async () => {
    if (!hasDepositOrder) { setShowContactGate(true); return }
    if (!activeRoom || !userId) return
    const { data: profile } = await supabase.from('profiles').select('phone, full_name').eq('id', userId).single()
    const msg = `📞 Contact shared: ${profile?.full_name} — ${profile?.phone || 'Phone not set'}`
    await supabase.from('chat_messages').insert({ room_id: activeRoom.id, sender_id: userId, content: msg, message_type: 'contact' })
    await supabase.from('chat_rooms').update({ last_message: 'Contact shared', last_message_at: new Date().toISOString() }).eq('id', activeRoom.id)
    toast.success('Contact shared')
  }

  const otherPerson = activeRoom
    ? (userId === activeRoom.customer_id ? activeRoom.tailor : activeRoom.customer)
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 flex gap-4" style={{ height: 'calc(100vh - 4rem)' }}>

        {/* Room list */}
        <div className={cn('w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden', activeRoom && 'hidden md:flex')}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Messages</h2>
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
              <ShieldCheck size={11} /> Protected
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm px-4">
                No conversations yet. Browse tailors and start chatting!
              </div>
            )}
            {rooms.map(room => {
              const other = userId === room.customer_id ? room.tailor : room.customer
              return (
                <button key={room.id} onClick={() => setActiveRoom(room)}
                  className={cn('w-full text-left p-4 hover:bg-gray-50 transition-colors border-b border-gray-50', activeRoom?.id === room.id && 'bg-violet-50 border-l-2 border-l-violet-600')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {other?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{other?.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{room.last_message || 'No messages yet'}</p>
                    </div>
                    {room.last_message_at && (
                      <span className="text-xs text-gray-300 flex-shrink-0">{formatRelativeTime(room.last_message_at)}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat window */}
        <div className={cn('flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden relative', !activeRoom && 'hidden md:flex')}>
          {!activeRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 text-3xl">💬</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-400 text-sm">or <Link href="/browse" className="text-violet-600 font-medium hover:underline">browse tailors</Link> to start one</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
                <button className="md:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setActiveRoom(null)}>
                  <ArrowLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                  {otherPerson?.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{otherPerson?.full_name}</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    <p className="text-xs text-green-500 font-medium">Online</p>
                  </div>
                </div>
                <button
                  onClick={sendContact}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-full transition-all',
                    hasDepositOrder
                      ? 'text-violet-600 border-violet-200 hover:bg-violet-50'
                      : 'text-gray-400 border-gray-200 cursor-pointer hover:border-amber-300 hover:text-amber-600'
                  )}
                >
                  {hasDepositOrder ? <Phone size={12} /> : <Lock size={12} />}
                  {hasDepositOrder ? 'Share contact' : 'Contact locked'}
                </button>
              </div>

              {/* Payment protection banner */}
              <div className="bg-violet-50 border-b border-violet-100 px-4 py-2 flex items-center gap-2">
                <ShieldCheck size={13} className="text-violet-600 flex-shrink-0" />
                <p className="text-xs text-violet-700 font-medium">
                  All payments are protected. Pay through TailorNow only — never send money outside the app.
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {messages.map(msg => {
                  const isMe = msg.sender_id === userId
                  const hasBankAlert = containsBankDetails(msg.content)
                  return (
                    <div key={msg.id} className={cn('flex gap-2', isMe && 'flex-row-reverse')}>
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                          {msg.sender?.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className={cn('max-w-xs lg:max-w-md', isMe ? 'items-end flex flex-col' : '')}>
                        {hasBankAlert && (
                          <div className="flex items-center gap-1 text-xs text-red-500 mb-1 px-1">
                            <AlertTriangle size={10} /> Contains bank details
                          </div>
                        )}
                        <div className={cn(
                          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                          isMe ? 'bg-violet-700 text-white rounded-tr-sm' : 'bg-white text-gray-900 rounded-tl-sm shadow-sm border border-gray-100',
                          msg.message_type === 'contact' && 'bg-amber-50 border border-amber-200 text-amber-800 font-medium',
                          hasBankAlert && 'ring-1 ring-red-300'
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-gray-400 mt-0.5 px-1">{formatRelativeTime(msg.created_at)}</span>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2 bg-white">
                <input
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                  placeholder="Type a message..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
                <Button type="submit" size="md" disabled={!text.trim() || sending} className="btn-press">
                  <Send size={16} />
                </Button>
              </form>
            </>
          )}

          {/* Fraud warning overlay */}
          {showFraudWarning && (
            <FraudWarning
              onDismiss={async () => {
                setShowFraudWarning(false)
                await submitMessage(pendingMessage)
                setPendingMessage('')
              }}
              onCancel={() => {
                setShowFraudWarning(false)
                setText(pendingMessage)
                setPendingMessage('')
              }}
            />
          )}

          {/* Contact gate overlay */}
          {showContactGate && <ContactGateModal onClose={() => setShowContactGate(false)} />}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" /></div>}>
      <ChatContent />
    </Suspense>
  )
}
