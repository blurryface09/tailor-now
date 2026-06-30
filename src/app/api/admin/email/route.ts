import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { to, toName, subject, body } = await req.json()
  if (!to || !subject || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'TailorNow <hello@tailornow.shop>',
    to: [to],
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#7C3AED;padding:20px 24px;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">TailorNow</h1>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px">Hi ${toName || 'there'},</p>
          <div style="color:#111827;font-size:15px;line-height:1.7;white-space:pre-wrap">${body.replace(/\n/g, '<br>')}</div>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
          <p style="margin:0;color:#9ca3af;font-size:12px">TailorNow — Nigeria's fashion marketplace</p>
        </div>
      </div>
    `,
  })

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
