import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isStaff } from '@/lib/roles'

type OnboardBody = {
  userId: string
  business_name: string
  bio: string
  city: string
  state: string
  address: string
  specialties: string[]
  delivery_types: string[]
  response_time_hours: number
}

// Creating a tailor_profiles row (and flipping role -> 'tailor') for
// someone else is service-role only — the RLS policies on both tables
// only permit a user to insert/update their own row.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isStaff(caller?.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as OnboardBody
  if (!body.userId || !body.business_name?.trim() || !body.city?.trim() || !body.state?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: existing } = await admin.from('tailor_profiles').select('id').eq('user_id', body.userId).maybeSingle()
  if (existing) return NextResponse.json({ error: 'This user already has a tailor profile' }, { status: 409 })

  const { error: insertError } = await admin.from('tailor_profiles').insert({
    user_id: body.userId,
    business_name: body.business_name.trim(),
    bio: body.bio?.trim() || null,
    city: body.city.trim(),
    state: body.state.trim(),
    address: body.address?.trim() || null,
    specialties: body.specialties ?? [],
    delivery_types: body.delivery_types ?? [],
    response_time_hours: body.response_time_hours || 2,
    is_verified: true,
  })
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const { error: roleError } = await admin.from('profiles').update({ role: 'tailor' }).eq('id', body.userId)
  if (roleError) return NextResponse.json({ error: roleError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
