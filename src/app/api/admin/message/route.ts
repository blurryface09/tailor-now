import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { tailorUserId, content } = await req.json()
  if (!tailorUserId || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()

  // Upsert a chat room: admin is customer, creative is tailor
  const { data: room, error: roomErr } = await admin.from('chat_rooms').upsert(
    { customer_id: user.id, tailor_id: tailorUserId, last_message: content, last_message_at: new Date().toISOString() },
    { onConflict: 'customer_id,tailor_id' }
  ).select('id').single()

  if (roomErr || !room) return NextResponse.json({ error: roomErr?.message || 'Room error' }, { status: 500 })

  const { error: msgErr } = await admin.from('chat_messages').insert({
    room_id: room.id, sender_id: user.id, content: content.trim(),
  })

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
