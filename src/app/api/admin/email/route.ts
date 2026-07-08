import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@folubandsamuellabs.com'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function makeMailtoUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams({
    subject,
    body: `${body}\n\n--\nTailorNow Support\n${ADMIN_EMAIL}`,
  })

  return `mailto:${encodeURIComponent(to)}?${params.toString()}`
}

function providerErrorMessage(message: string) {
  const lower = message.toLowerCase()

  if (lower.includes('domain') || lower.includes('sender') || lower.includes('from')) {
    return 'Email provider rejected the sender address. Verify RESEND_FROM_EMAIL/domain in Resend, then redeploy.'
  }

  if (lower.includes('api key') || lower.includes('unauthorized') || lower.includes('forbidden')) {
    return 'Email provider rejected the API key. Check RESEND_API_KEY in Vercel, then redeploy.'
  }

  return message || 'Email provider could not send this message.'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { to, toName, subject, body } = await req.json()
    if (!to || !subject || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Email is not connected yet. Add RESEND_API_KEY in Vercel, then redeploy.',
          mailtoUrl: makeMailtoUrl(to, subject, body),
        },
        { status: 503 }
      )
    }

    const safeName = escapeHtml(toName || 'there')
    const safeBody = escapeHtml(body).replace(/\n/g, '<br>')
    const resend = new Resend(apiKey)
    const from = process.env.RESEND_FROM_EMAIL || 'TailorNow <hello@tailornow.shop>'
    const sendResult = await Promise.race([
      resend.emails.send({
        from,
        to: [to],
        replyTo: ADMIN_EMAIL,
        subject,
        html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="background:#7C3AED;padding:20px 24px;border-radius:12px 12px 0 0">
            <h1 style="color:white;margin:0;font-size:20px">TailorNow</h1>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px">Hi ${safeName},</p>
            <div style="color:#111827;font-size:15px;line-height:1.7;white-space:pre-wrap">${safeBody}</div>
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
            <p style="margin:0;color:#9ca3af;font-size:12px">TailorNow — Nigeria's fashion marketplace</p>
          </div>
        </div>
      `,
      }),
      new Promise<{ error: { message: string } }>((resolve) => {
        setTimeout(() => resolve({ error: { message: 'Email provider timed out. Please try again.' } }), 20000)
      }),
    ])

    if (sendResult.error) {
      return NextResponse.json(
        {
          error: providerErrorMessage(sendResult.error.message),
          mailtoUrl: makeMailtoUrl(to, subject, body),
        },
        { status: 502 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}
