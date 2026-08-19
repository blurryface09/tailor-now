import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

const CONTACT_INBOX = 'access@fslabs.tech'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json() as { name?: string; email?: string; message?: string }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 })
  }

  const result = await sendEmail({
    to: CONTACT_INBOX,
    replyTo: email,
    subject: `[Contact] ${name}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:16px">
        <div style="background:linear-gradient(135deg,#4B3B66 0%,#241C36 100%);padding:24px 28px;border-radius:16px 16px 0 0">
          <p style="color:#DDD6FE;margin:0 0 4px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase">TailorNow · Contact</p>
          <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800">New message from ${escapeHtml(name)}</h1>
        </div>
        <div style="background:white;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px">From: <strong style="color:#111827">${escapeHtml(name)}</strong></p>
          <p style="margin:0 0 20px;color:#6b7280;font-size:13px">Email: <a href="mailto:${escapeHtml(email)}" style="color:#C68A52">${escapeHtml(email)}</a></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px" />
          <p style="white-space:pre-wrap;color:#111827;font-size:14.5px;line-height:1.7;margin:0">${escapeHtml(message)}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
          <p style="color:#9ca3af;font-size:12px;margin:0">Reply to this email to respond to ${escapeHtml(name)} directly.</p>
        </div>
      </div>
    `,
  })

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
  return NextResponse.json({ ok: true })
}
