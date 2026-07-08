import { Resend } from 'resend'

export type EmailPayload = {
  to: string
  toName?: string
  subject: string
  html: string
  replyTo?: string
}

type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || 'TailorNow <hello@tailornow.shop>'
}

export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const resend = getResend()
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY is not set — add it in Vercel environment variables.' }
  }

  const from = getFromAddress()
  const { data, error } = await resend.emails.send({
    from,
    to: [payload.to],
    subject: payload.subject,
    html: payload.html,
    ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
  })

  if (error) {
    console.error('[email] Resend error:', error)
    return { ok: false, error: friendlyError(error.message ?? String(error)) }
  }

  return { ok: true, id: (data as { id: string }).id }
}

export async function sendBatch(
  emails: Array<{ to: string; subject: string; html: string }>
): Promise<{ sent: number; errors: number }> {
  const resend = getResend()
  if (!resend) return { sent: 0, errors: emails.length }

  const from = getFromAddress()
  const CHUNK = 100
  let sent = 0
  let errors = 0

  for (let i = 0; i < emails.length; i += CHUNK) {
    const chunk = emails.slice(i, i + CHUNK)
    const { data, error } = await resend.batch.send(
      chunk.map(e => ({ from, to: [e.to], subject: e.subject, html: e.html }))
    )
    if (error || !data) {
      console.error('[email] Resend batch error:', error)
      errors += chunk.length
    } else {
      sent += chunk.length
    }
  }

  return { sent, errors }
}

function friendlyError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('domain') || m.includes('sender') || m.includes('from') || m.includes('verify')) {
    return 'Sending domain not verified in Resend. Go to resend.com/domains, add tailornow.shop, and add the DNS records shown.'
  }
  if (m.includes('api key') || m.includes('unauthorized') || m.includes('forbidden') || m.includes('invalid')) {
    return 'Resend API key is invalid. Check RESEND_API_KEY in Vercel environment variables.'
  }
  if (m.includes('rate')) {
    return 'Resend rate limit hit — try again in a moment.'
  }
  return msg
}
