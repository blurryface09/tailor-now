import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isStaff } from '@/lib/roles'
import { sendBatch } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tailornow.shop'

function releaseEmailHtml(name: string, businessName: string, title: string | null, image: string | null, postUrl: string): string {
  return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:16px">
  <div style="background:linear-gradient(135deg,#4B3B66 0%,#241C36 100%);padding:24px 28px;border-radius:16px 16px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px;font-weight:800">✨ It's here!</h1>
  </div>
  <div style="background:white;padding:0 0 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;overflow:hidden">
    ${image ? `<img src="${image}" alt="" style="width:100%;display:block;max-height:340px;object-fit:cover" />` : ''}
    <div style="padding:24px 28px 0">
      <p style="margin:0 0 16px;color:#111827;font-size:16px">Hi <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px">
        The piece you joined the waitlist for${title ? `, <strong>${title}</strong>,` : ''} by <strong>${businessName}</strong> is now available to order.
      </p>
      <a href="${postUrl}" style="display:inline-block;background:#C68A52;color:white;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px">
        Order it now
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isStaff(profile?.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { postId } = await req.json()
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })

  const admin = createAdminClient()
  const { data: post } = await admin
    .from('posts')
    .select('id, title, image_urls, is_available, creative:tailor_profiles(business_name)')
    .eq('id', postId)
    .single<{ id: string; title: string | null; image_urls: string[]; is_available: boolean; creative: { business_name: string } | null }>()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.is_available) return NextResponse.json({ ok: true, alreadyReleased: true, notified: 0 })

  const { error: updateError } = await admin.from('posts').update({ is_available: true }).eq('id', postId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  const businessName = post.creative?.business_name || 'TailorNow'
  const { data: waitlist } = await admin.from('product_waitlist').select('user_id').eq('post_id', postId)

  let notified = 0
  if (waitlist && waitlist.length > 0) {
    const notifications = waitlist.map(w => ({
      user_id: w.user_id,
      type: 'product_released',
      title: post.title ? `"${post.title}" is now available` : `${businessName}'s piece is now available`,
      body: 'Tap to order it before it sells out',
      data: { post_id: postId },
    }))
    await admin.from('notifications').insert(notifications)

    const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const emailMap = new Map(authUsers.map(u => [u.id, u.email ?? null]))
    const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', waitlist.map(w => w.user_id))
    const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name ?? 'there']))

    const recipients = waitlist
      .map(w => ({ email: emailMap.get(w.user_id) ?? '', name: nameMap.get(w.user_id) ?? 'there' }))
      .filter(r => r.email)

    if (recipients.length > 0) {
      const postUrl = `${SITE_URL}/p/${postId}`
      const { sent } = await sendBatch(
        recipients.map(r => ({
          to: r.email,
          subject: post.title ? `"${post.title}" is now available` : `${businessName}'s piece is now available`,
          html: releaseEmailHtml(r.name, businessName, post.title, post.image_urls?.[0] || null, postUrl),
        }))
      )
      notified = sent
    }
  }

  return NextResponse.json({ ok: true, notified })
}
