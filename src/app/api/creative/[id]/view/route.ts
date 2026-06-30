import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: creativeId } = await params
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ ok: true })

  const admin = createAdminClient()
  const { data } = await admin
    .from('tailor_profiles')
    .select('profile_views')
    .eq('id', creativeId)
    .single()

  await admin
    .from('tailor_profiles')
    .update({ profile_views: (data?.profile_views ?? 0) + 1 })
    .eq('id', creativeId)

  return NextResponse.json({ ok: true })
}
