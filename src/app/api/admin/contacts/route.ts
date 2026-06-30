import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type ContactRow = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
}

type Audience = 'all' | 'customers' | 'tailors_verified' | 'tailors_all'

export async function GET(req: NextRequest) {
  // Auth: must be admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const audience = (req.nextUrl.searchParams.get('audience') ?? 'all') as Audience

  const admin = createAdminClient()

  // Get all auth users for emails
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = new Map(authUsers.map(u => [u.id, u.email ?? null]))

  // Build profiles query
  let profileQuery = admin.from('profiles').select('id, full_name, phone, role')
  if (audience === 'customers') {
    profileQuery = profileQuery.eq('role', 'customer')
  } else if (audience === 'tailors_all') {
    profileQuery = profileQuery.eq('role', 'tailor')
  } else if (audience === 'tailors_verified') {
    // need to join through tailor_profiles
  }
  // 'all' = no filter

  if (audience !== 'tailors_verified') {
    const { data: profiles } = await profileQuery.neq('role', 'admin')
    const contacts: ContactRow[] = (profiles ?? [])
      .map(p => ({
        id: p.id,
        name: p.full_name ?? 'Unknown',
        email: emailMap.get(p.id) ?? '',
        phone: p.phone ?? null,
        role: p.role,
      }))
      .filter(c => c.email)
    return NextResponse.json({ contacts })
  }

  // Verified tailors: join tailor_profiles
  const { data: verifiedTailors } = await admin
    .from('tailor_profiles')
    .select('user_id')
    .eq('is_verified', true)
  const verifiedIds = new Set((verifiedTailors ?? []).map(t => t.user_id))

  const { data: allTailorProfiles } = await admin
    .from('profiles')
    .select('id, full_name, phone, role')
    .eq('role', 'tailor')

  const contacts: ContactRow[] = (allTailorProfiles ?? [])
    .filter(p => verifiedIds.has(p.id))
    .map(p => ({
      id: p.id,
      name: p.full_name ?? 'Unknown',
      email: emailMap.get(p.id) ?? '',
      phone: p.phone ?? null,
      role: p.role,
    }))
    .filter(c => c.email)

  return NextResponse.json({ contacts })
}
