import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { redirect } from 'next/navigation'
import { AdminTailorsClient } from './admin-tailors-client'

export const dynamic = 'force-dynamic'

export default async function AdminTailorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/browse')

  const { data: tailors } = await supabase
    .from('tailor_profiles')
    .select('*, profile:profiles(full_name, email, phone, avatar_url, created_at)')
    .order('created_at', { ascending: false })

  // Fetch portfolio item counts per tailor
  const ids = (tailors || []).map(t => t.id)
  const { data: portfolioRows } = ids.length
    ? await supabase.from('portfolio_items').select('tailor_id').in('tailor_id', ids)
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const row of (portfolioRows || [])) {
    countMap[row.tailor_id] = (countMap[row.tailor_id] || 0) + 1
  }

  const enriched = (tailors || []).map(t => ({ ...t, portfolio_count: countMap[t.id] || 0 }))

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <AdminTailorsClient tailors={enriched} />
    </div>
  )
}
