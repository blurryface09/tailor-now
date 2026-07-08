import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { role } = await req.json().catch(() => ({ role: null }))
  if (role !== 'customer') {
    return NextResponse.json({ error: 'Only switching to customer is supported here.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, role: 'customer' })
}
