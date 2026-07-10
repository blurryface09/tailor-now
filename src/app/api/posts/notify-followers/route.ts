import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, creativeUserId, postTitle, businessName } = await req.json()
  if (!postId || !creativeUserId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()

  // Get all followers of this creative
  const { data: follows } = await admin
    .from('follows')
    .select('follower_id')
    .eq('following_id', creativeUserId)

  if (!follows || follows.length === 0) return NextResponse.json({ ok: true, notified: 0 })

  const title = postTitle
    ? `${businessName} posted: ${postTitle}`
    : `${businessName} just posted a new look`

  const notifications = follows.map(f => ({
    user_id: f.follower_id,
    type: 'new_post',
    title,
    body: 'Tap to see their latest work',
    data: { post_id: postId, creative_user_id: creativeUserId },
  }))

  await admin.from('notifications').insert(notifications)

  return NextResponse.json({ ok: true, notified: follows.length })
}
