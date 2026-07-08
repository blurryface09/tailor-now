import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, getResend, getFromAddress } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Config status
  const hasKey = !!process.env.RESEND_API_KEY
  const fromAddress = getFromAddress()

  if (!hasKey) {
    return NextResponse.json({
      ok: false,
      error: 'RESEND_API_KEY is not set.',
      fix: 'Go to Vercel → your project → Settings → Environment Variables → add RESEND_API_KEY with your key from resend.com/api-keys. Then redeploy.',
      config: { hasKey, fromAddress },
    }, { status: 503 })
  }

  // Send test email to the admin's own address
  const admin = createAdminClient()
  const { data: { user: authUser } } = await admin.auth.admin.getUserById(user.id)
  const adminEmail = authUser?.email
  if (!adminEmail) return NextResponse.json({ error: 'Could not read admin email' }, { status: 500 })

  const result = await sendEmail({
    to: adminEmail,
    toName: 'Admin',
    subject: '✅ TailorNow email is working',
    html: `
<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
  <div style="background:#7C3AED;padding:20px 24px;border-radius:12px 12px 0 0">
    <h1 style="color:white;margin:0;font-size:20px">✂️ TailorNow</h1>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <h2 style="margin:0 0 12px;color:#111827;font-size:18px">Email is working! ✅</h2>
    <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px">
      Your Resend integration is configured correctly. Welcome emails, admin messages, and broadcasts will all be delivered.
    </p>
    <div style="background:#f5f3ff;border-radius:8px;padding:14px;font-size:13px;color:#5B21B6">
      <strong>Sending from:</strong> ${fromAddress}<br>
      <strong>Sent to:</strong> ${adminEmail}
    </div>
  </div>
</div>`,
  })

  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      error: result.error,
      fix: result.error.includes('domain') || result.error.includes('verify')
        ? 'Your domain is not verified in Resend. Go to resend.com/domains → Add Domain → enter tailornow.shop → add the DNS records shown → wait for verification (usually under 5 minutes).'
        : 'Check your RESEND_API_KEY in Vercel environment variables.',
      config: { hasKey, fromAddress, sentTo: adminEmail },
    }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    message: `Test email sent to ${adminEmail} — check your inbox.`,
    config: { hasKey, fromAddress, sentTo: adminEmail },
  })
}
