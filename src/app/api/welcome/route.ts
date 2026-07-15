import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tailornow.shop'

function creativeEmailHtml(name: string) {
  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:16px">
  <div style="background:linear-gradient(135deg,#4B3B66 0%,#241C36 100%);padding:32px 28px;border-radius:16px 16px 0 0;text-align:center">
    <p style="color:#DDD6FE;margin:0 0 6px;font-size:13px;letter-spacing:1px;text-transform:uppercase">Welcome to</p>
    <h1 style="color:white;margin:0;font-size:30px;font-weight:800;letter-spacing:-0.5px">✂️ TailorNow</h1>
    <p style="color:#DDD6FE;margin:8px 0 0;font-size:14px">Nigeria's Fashion Marketplace</p>
  </div>
  <div style="background:white;padding:32px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px">
    <p style="margin:0 0 16px;color:#111827;font-size:16px">Hi <strong>${name}</strong> 👋</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7">
      You're now part of Nigeria's fastest-growing fashion marketplace. Your profile is
      <strong>under review</strong> — once our team verifies it, customers will start finding you.
    </p>
    <div style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:12px;padding:20px;margin:0 0 24px">
      <p style="margin:0 0 12px;color:#362A4C;font-size:14px;font-weight:700">What happens next</p>
      <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;Admin reviews your profile (1–2 business days)</p>
      <p style="margin:0 0 8px;color:#374151;font-size:14px">✅ &nbsp;You get a verified badge visible to customers</p>
      <p style="margin:0;color:#374151;font-size:14px">✅ &nbsp;Customers can discover, message, and book you</p>
    </div>
    <div style="text-align:center;margin:0 0 28px">
      <a href="${SITE_URL}/dashboard"
        style="display:inline-block;background:#4B3B66;color:white;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none">
        Go to Your Dashboard →
      </a>
    </div>
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px">
      In the meantime, update your profile, add portfolio photos, and set your pricing.
    </p>
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
      TailorNow — Nigeria's Fashion Marketplace &nbsp;·&nbsp;
      <a href="${SITE_URL}" style="color:#C68A52;text-decoration:none">tailornow.shop</a>
    </p>
  </div>
</div>`
}

function customerEmailHtml(name: string) {
  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:16px">
  <div style="background:linear-gradient(135deg,#4B3B66 0%,#241C36 100%);padding:32px 28px;border-radius:16px 16px 0 0;text-align:center">
    <p style="color:#DDD6FE;margin:0 0 6px;font-size:13px;letter-spacing:1px;text-transform:uppercase">Welcome to</p>
    <h1 style="color:white;margin:0;font-size:30px;font-weight:800;letter-spacing:-0.5px">✂️ TailorNow</h1>
    <p style="color:#DDD6FE;margin:8px 0 0;font-size:14px">Nigeria's Fashion Marketplace</p>
  </div>
  <div style="background:white;padding:32px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px">
    <p style="margin:0 0 16px;color:#111827;font-size:16px">Hi <strong>${name}</strong> 👋</p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7">
      Welcome to TailorNow! Discover talented fashion creatives across Nigeria —
      tailors, designers, bridal specialists, and more.
    </p>
    <div style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:12px;padding:20px;margin:0 0 24px">
      <p style="margin:0 0 12px;color:#362A4C;font-size:14px;font-weight:700">What you can do</p>
      <p style="margin:0 0 8px;color:#374151;font-size:14px">👗 &nbsp;Browse verified creatives near you</p>
      <p style="margin:0 0 8px;color:#374151;font-size:14px">💬 &nbsp;Chat directly about your ideas</p>
      <p style="margin:0 0 8px;color:#374151;font-size:14px">📐 &nbsp;Share measurements for a perfect fit</p>
      <p style="margin:0;color:#374151;font-size:14px">💳 &nbsp;Pay securely in-app — your money is protected</p>
    </div>
    <div style="text-align:center;margin:0 0 28px">
      <a href="${SITE_URL}/browse"
        style="display:inline-block;background:#4B3B66;color:white;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none">
        Browse Creatives →
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
      TailorNow — Nigeria's Fashion Marketplace &nbsp;·&nbsp;
      <a href="${SITE_URL}" style="color:#C68A52;text-decoration:none">tailornow.shop</a>
    </p>
  </div>
</div>`
}

const CREATIVE_CHAT = `Welcome to TailorNow! 🎉

Your profile has been submitted and is currently under review. Our team will verify it within 1–2 business days — once approved, you'll appear in search results and customers can book you.

If you have any questions, just reply here. We're happy to help!

– TailorNow Team ✂️`

const CUSTOMER_CHAT = `Welcome to TailorNow! 🎉

You can now browse and book talented fashion creatives across Nigeria — tailors, designers, bridal specialists, and more.

Head to the Browse page to find creatives near you. If you need help, just reply here!

– TailorNow Team ✂️`

export async function POST(req: NextRequest) {
  const { userId, role } = await req.json()
  if (!userId || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()

  const { data: { user: authUser } } = await admin.auth.admin.getUserById(userId)
  const userEmail = authUser?.email
  const userName = authUser?.user_metadata?.full_name || 'there'
  const isCreative = role === 'tailor'

  // Send welcome email — log but don't fail the request if it errors
  if (userEmail) {
    const result = await sendEmail({
      to: userEmail,
      toName: userName,
      subject: isCreative
        ? 'Welcome to TailorNow — your profile is under review 🎉'
        : 'Welcome to TailorNow — start exploring ✂️',
      html: isCreative ? creativeEmailHtml(userName) : customerEmailHtml(userName),
    })
    if (!result.ok) {
      console.error('[welcome] email failed for', userEmail, ':', result.error)
    }
  }

  // Send in-app chat welcome message from admin
  const { data: adminProfile } = await admin
    .from('profiles').select('id').eq('role', 'admin').limit(1).single()
  if (!adminProfile) return NextResponse.json({ ok: true })

  const roomData = isCreative
    ? { customer_id: adminProfile.id, tailor_id: userId }
    : { customer_id: userId, tailor_id: adminProfile.id }

  const { data: room } = await admin.from('chat_rooms')
    .upsert(
      { ...roomData, last_message: 'Welcome to TailorNow!', last_message_at: new Date().toISOString() },
      { onConflict: 'customer_id,tailor_id' }
    )
    .select('id').single()

  if (room) {
    await admin.from('chat_messages').insert({
      room_id: room.id,
      sender_id: adminProfile.id,
      content: isCreative ? CREATIVE_CHAT : CUSTOMER_CHAT,
    })
  }

  return NextResponse.json({ ok: true })
}
