import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, getResend, getFromAddress } from '@/lib/email'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sekosamuel@gmail.com'

function makeMailtoUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams({ subject, body: `${body}\n\n--\nTailorNow Support\n${ADMIN_EMAIL}` })
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { to, toName, subject, body } = await req.json()
  if (!to || !subject || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  if (!getResend()) {
    return NextResponse.json(
      { error: 'Email is not connected. Add RESEND_API_KEY in Vercel → Redeploy.', mailtoUrl: makeMailtoUrl(to, subject, body) },
      { status: 503 }
    )
  }

  const safeName = (toName || 'there').replace(/[<>&"']/g, '')
  const safeBody = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')

  const result = await sendEmail({
    to,
    toName: safeName,
    subject,
    replyTo: ADMIN_EMAIL,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#4B3B66;padding:20px 24px;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">TailorNow</h1>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 8px;color:#6b7280;font-size:14px">Hi ${safeName},</p>
          <div style="color:#111827;font-size:15px;line-height:1.7">${safeBody}</div>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
          <p style="margin:0;color:#9ca3af;font-size:12px">TailorNow — Nigeria's fashion marketplace</p>
        </div>
      </div>`,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, mailtoUrl: makeMailtoUrl(to, subject, body) },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true })
}
