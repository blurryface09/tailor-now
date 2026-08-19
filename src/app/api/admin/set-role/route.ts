import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isStaff } from '@/lib/roles'

const STAFF_ONLY_ROLES = new Set(['admin', 'support'])
const ASSIGNABLE_ROLES = new Set(['customer', 'tailor', 'admin', 'support'])

// Changing a user's role is service-role only — `profiles` has no RLS
// policy letting one account update another's row, and role is exactly
// the field that must never be editable by the target user themselves.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isStaff(caller?.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, role } = await req.json() as { userId?: string; role?: string }
  if (!userId || !role || !ASSIGNABLE_ROLES.has(role)) {
    return NextResponse.json({ error: 'Invalid userId or role' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: target } = await admin.from('profiles').select('role').eq('id', userId).single()
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Granting or revoking staff access (admin/support) — and touching an
  // existing staff member's row at all — is restricted to full admins.
  const touchesStaff = STAFF_ONLY_ROLES.has(role) || STAFF_ONLY_ROLES.has(target.role)
  if (touchesStaff && caller?.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can grant or change staff roles' }, { status: 403 })
  }

  const { error } = await admin.from('profiles').update({ role }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, role })
}
