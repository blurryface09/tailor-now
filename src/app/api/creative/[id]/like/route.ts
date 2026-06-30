import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: creativeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login to like creatives' }, { status: 401 })

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('creative_likes')
    .select('id')
    .eq('creative_id', creativeId)
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await admin
    .from('tailor_profiles')
    .select('profile_likes')
    .eq('id', creativeId)
    .single()

  const currentLikes = profile?.profile_likes ?? 0

  if (existing) {
    await admin.from('creative_likes').delete().eq('id', existing.id)
    const newCount = Math.max(0, currentLikes - 1)
    await admin.from('tailor_profiles').update({ profile_likes: newCount }).eq('id', creativeId)
    return NextResponse.json({ liked: false, likes: newCount })
  } else {
    await admin.from('creative_likes').insert({ creative_id: creativeId, user_id: user.id })
    const newCount = currentLikes + 1
    await admin.from('tailor_profiles').update({ profile_likes: newCount }).eq('id', creativeId)
    return NextResponse.json({ liked: true, likes: newCount })
  }
}
