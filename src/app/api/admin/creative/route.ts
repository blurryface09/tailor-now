import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, field, value } = await req.json()
    if (!id || !field) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const allowed = ['is_verified', 'is_active', 'approved', 'approval_note']
    if (!allowed.includes(field)) return NextResponse.json({ error: 'Field not allowed' }, { status: 400 })

    const admin = createAdminClient()

    // When verifying a creative, check if they earn the First Cut badge (first 50)
    if (field === 'is_verified' && value === true) {
      const { count } = await admin
        .from('tailor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_founder', true)

      const isFirstCut = (count ?? 0) < 50
      const update: Record<string, unknown> = { is_verified: true }
      if (isFirstCut) update.is_founder = true

      const { error } = await admin.from('tailor_profiles').update(update).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const { data: tailor } = await admin
        .from('tailor_profiles').select('user_id').eq('id', id).single()
      if (tailor) {
        await admin.from('notifications').insert({
          user_id: tailor.user_id,
          type: 'system',
          title: isFirstCut ? '✂️ You earned the First Cut badge!' : '✅ You\'re now a Verified Creative!',
          body: isFirstCut
            ? `You're one of the first 50 verified creatives on TailorNow. The First Cut badge is permanent and shows on your public profile for life.`
            : `Your profile has been approved. You now appear in search results and customers can discover and book you.`,
          data: {},
        })
      }

      return NextResponse.json({ ok: true, is_first_cut: isFirstCut })
    }

    const { error } = await admin.from('tailor_profiles').update({ [field]: value }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
