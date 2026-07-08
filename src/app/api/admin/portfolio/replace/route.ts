import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { portfolioItemId, imageUrl } = await req.json()
  if (!portfolioItemId || !imageUrl) {
    return NextResponse.json({ error: 'Missing portfolioItemId or imageUrl' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('portfolio_items')
    .update({ image_url: imageUrl })
    .eq('id', portfolioItemId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
