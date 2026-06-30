import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  // Verify caller is admin
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
  const { error } = await admin.from('tailor_profiles').update({ [field]: value }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
