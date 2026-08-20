import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isStaff } from '@/lib/roles'
import { sendEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tailornow.shop'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!isStaff(adminProfile?.role)) return NextResponse.json({ error: 'Not admin' }, { status: 403 })

    const body = await req.json()
    const { tailorUserId, content } = body
    if (!tailorUserId || !content?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const admin = createAdminClient()

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
        return NextResponse.json({ error: `Room: ${roomErr?.message || 'unknown'}` }, { status: 500 })
      }
      roomId = newRoom.id
    }

    const { error: msgErr } = await admin
      .from('chat_messages')
      .insert({ room_id: roomId, sender_id: user.id, content: content.trim() })

    if (msgErr) return NextResponse.json({ error: `Msg: ${msgErr.message}` }, { status: 500 })

    // Notify the creative in-app
    await admin.from('notifications').insert({
      user_id: tailorUserId,
      type: 'new_message',
      title: 'Message from TailorNow',
      body: content.trim().slice(0, 80),
      data: { room_tailor_id: tailorUserId },
    })

    // Also email it — a message sitting unread in the app doesn't help if the
    // creative isn't in the habit of checking it yet.
    const { data: tailorProfile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', tailorUserId)
      .single()

    if (tailorProfile?.email) {
      const safeName = (tailorProfile.full_name || 'there').replace(/[<>&"']/g, '')
      const safeBody = content.trim()
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')

      await sendEmail({
        to: tailorProfile.email,
        toName: safeName,
        subject: 'Message from TailorNow',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <div style="background:#4B3B66;padding:20px 24px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:20px">✂️ TailorNow</h1>
            </div>
            <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
              <p style="margin:0 0 8px;color:#6b7280;font-size:14px">Hi ${safeName},</p>
              <div style="color:#111827;font-size:15px;line-height:1.7">${safeBody}</div>
              <a href="${SITE_URL}/tailor/chat" style="display:inline-block;margin-top:20px;background:#C68A52;color:white;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:10px">
                Reply in TailorNow
              </a>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0 16px">
              <p style="margin:0;color:#9ca3af;font-size:12px">TailorNow — Nigeria's fashion marketplace</p>
            </div>
          </div>`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
