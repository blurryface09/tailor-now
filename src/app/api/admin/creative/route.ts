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

    // When verifying a creative, send them a notification
    if (field === 'is_verified' && value === true) {
      const { error } = await admin.from('tailor_profiles').update({ is_verified: true }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const { data: tailor } = await admin
        .from('tailor_profiles').select('user_id').eq('id', id).single()
      if (tailor) {
        await admin.from('notifications').insert({
          user_id: tailor.user_id,
          type: 'system',
          title: '✅ You\'re now a Verified Creative!',
          body: `Your profile has been approved. You now appear in search results and customers can discover and book you.`,
          data: {},
        })
      }

      return NextResponse.json({ ok: true })
    }

    const { error } = await admin.from('tailor_profiles').update({ [field]: value }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
