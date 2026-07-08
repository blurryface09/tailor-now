import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tailornow.shop'

function broadcastHtml(name: string, body: string): string {
  const bodyHtml = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:16px">
  <div style="background:linear-gradient(135deg,#7C3AED 0%,#6D28D9 100%);padding:24px 28px;border-radius:16px 16px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:26px;font-weight:800">✂️ TailorNow</h1>
    <p style="color:#DDD6FE;margin:6px 0 0;font-size:13px">Nigeria's Fashion Marketplace</p>
  </div>
  <div style="background:white;padding:32px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px">
    <p style="margin:0 0 16px;color:#111827;font-size:16px">Hi <strong>${name}</strong>,</p>
    <div style="color:#374151;font-size:15px;line-height:1.8">${bodyHtml}</div>
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0 16px">
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
      TailorNow — Nigeria's Fashion Marketplace &nbsp;·&nbsp;
      <a href="${SITE_URL}" style="color:#7C3AED;text-decoration:none">tailornow.shop</a>
    </p>
    <p style="margin:8px 0 0;color:#d1d5db;font-size:11px;text-align:center">
      You're receiving this because you have an account on TailorNow.
    </p>
  </div>
</div>`
}

export async function POST(req: NextRequest) {
  // Auth: must be admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json(
      { error: 'Email is not connected yet. Add RESEND_API_KEY in Vercel, then redeploy.' },
      { status: 503 }
    )
  }

  const { subject, body, audience } = await req.json() as {
    subject: string
    body: string
    audience: string
  }
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const resend = new Resend(resendKey)
  const from = process.env.RESEND_FROM_EMAIL || 'TailorNow <hello@tailornow.shop>'

  // Fetch contacts (reuse same logic as /api/admin/contacts)
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map(authUsers.map(u => [u.id, u.email ?? null]))

  let contacts: Array<{ name: string; email: string }> = []

  if (audience === 'tailors_verified') {
    const { data: verifiedTailors } = await admin.from('tailor_profiles').select('user_id').eq('is_verified', true)
    const verifiedIds = new Set((verifiedTailors ?? []).map(t => t.user_id))
    const { data: profiles } = await admin.from('profiles').select('id, full_name').eq('role', 'tailor')
    contacts = (profiles ?? [])
      .filter(p => verifiedIds.has(p.id))
      .map(p => ({ name: p.full_name ?? 'there', email: emailMap.get(p.id) ?? '' }))
      .filter(c => c.email)
  } else {
    let q = admin.from('profiles').select('id, full_name, role').neq('role', 'admin')
    if (audience === 'customers') q = q.eq('role', 'customer')
    else if (audience === 'tailors_all') q = q.eq('role', 'tailor')
    const { data: profiles } = await q
    contacts = (profiles ?? [])
      .map(p => ({ name: p.full_name ?? 'there', email: emailMap.get(p.id) ?? '' }))
      .filter(c => c.email)
  }

  if (contacts.length === 0) return NextResponse.json({ sent: 0, errors: 0 })

  // Batch send in chunks of 100 (Resend limit)
  const CHUNK = 100
  let sent = 0
  let errors = 0

  for (let i = 0; i < contacts.length; i += CHUNK) {
    const chunk = contacts.slice(i, i + CHUNK)
    const batch = chunk.map(c => ({
      from,
      to: [c.email],
      subject,
      html: broadcastHtml(c.name, body),
    }))
    const result = await resend.batch.send(batch).catch(() => null)
    if (result?.data) {
      sent += chunk.length
    } else {
      errors += chunk.length
    }
  }

  return NextResponse.json({ sent, errors })
}
