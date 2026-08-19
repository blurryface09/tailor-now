import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBatch } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tailornow.shop'

function newPostEmailHtml(name: string, businessName: string, title: string | null, image: string | null, postUrl: string): string {
  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:16px">
  <div style="background:linear-gradient(135deg,#4B3B66 0%,#241C36 100%);padding:24px 28px;border-radius:16px 16px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px;font-weight:800">✂️ New on TailorNow</h1>
  </div>
  <div style="background:white;padding:0 0 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;overflow:hidden">
    ${image ? `<img src="${image}" alt="" style="width:100%;display:block;max-height:340px;object-fit:cover" />` : ''}
    <div style="padding:24px 28px 0">
      <p style="margin:0 0 16px;color:#111827;font-size:16px">Hi <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px">
        <strong>${businessName}</strong> just posted${title ? `: <strong>${title}</strong>` : ' a new look'} on TailorNow.
      </p>
      <a href="${postUrl}" style="display:inline-block;background:#C68A52;color:white;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px">
        See the post
      </a>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0 16px">
      <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
        TailorNow — Nigeria's Fashion Marketplace &nbsp;·&nbsp;
        <a href="${SITE_URL}" style="color:#C68A52;text-decoration:none">tailornow.shop</a>
      </p>
    </div>
  </div>
</div>`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, creativeUserId, postTitle, businessName, image } = await req.json()
  if (!postId || !creativeUserId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()

  // In-app notification for followers of this specific creative
  const { data: follows } = await admin
    .from('follows')
    .select('follower_id')
    .eq('following_id', creativeUserId)

  const title = postTitle
    ? `${businessName} posted: ${postTitle}`
    : `${businessName} just posted a new look`

  if (follows && follows.length > 0) {
    const notifications = follows.map(f => ({
      user_id: f.follower_id,
      type: 'new_post',
      title,
      body: 'Tap to see their latest work',
      data: { post_id: postId, creative_user_id: creativeUserId },
    }))
    await admin.from('notifications').insert(notifications)
  }

  // Broadcast email to every customer — not just followers — so a new
  // post pulls people back to the app while the platform is still growing.
  let emailed = 0
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map(authUsers.map(u => [u.id, u.email ?? null]))
  const { data: customers } = await admin.from('profiles').select('id, full_name').eq('role', 'customer')

  if (customers && customers.length > 0) {
    const recipients = customers
      .map(c => ({ email: emailMap.get(c.id) ?? '', name: c.full_name ?? 'there' }))
      .filter(c => c.email)

    if (recipients.length > 0) {
      const postUrl = `${SITE_URL}/p/${postId}`
      const { sent } = await sendBatch(
        recipients.map(r => ({
          to: r.email,
          subject: title,
          html: newPostEmailHtml(r.name, businessName, postTitle || null, image || null, postUrl),
        }))
      )
      emailed = sent
    }
  }

  return NextResponse.json({ ok: true, notified: follows?.length ?? 0, emailed })
}
