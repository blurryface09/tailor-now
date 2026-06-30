import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Not admin' }, { status: 403 })

  const { tailorUserId, content } = await req.json()
  if (!tailorUserId || !content?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()

  // Find existing room between admin and this user
  const { data: existing } = await admin
    .from('chat_rooms')
    .select('id')
    .eq('customer_id', user.id)
    .eq('tailor_id', tailorUserId)
    .maybeSingle()

  let roomId: string

  if (existing) {
    roomId = existing.id
    await admin.from('chat_rooms')
      .update({ last_message: content.trim(), last_message_at: new Date().toISOString() })
      .eq('id', roomId)
  } else {
    const { data: newRoom, error: roomErr } = await admin
      .from('chat_rooms')
      .insert({ customer_id: user.id, tailor_id: tailorUserId, last_message: content.trim(), last_message_at: new Date().toISOString() })
      .select('id')
      .single()
    if (roomErr || !newRoom) {
      return NextResponse.json({ error: roomErr?.message || 'Could not create conversation' }, { status: 500 })
    }
    roomId = newRoom.id
  }

  const { error: msgErr } = await admin
    .from('chat_messages')
    .insert({ room_id: roomId, sender_id: user.id, content: content.trim() })

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
