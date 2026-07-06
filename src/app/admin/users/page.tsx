import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { redirect } from 'next/navigation'
import { AdminUsersClient } from './admin-users-client'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/browse')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: orderCounts } = await supabase
    .from('orders')
    .select('customer_id')

  const countMap: Record<string, number> = {}
  for (const o of orderCounts || []) {
    countMap[o.customer_id] = (countMap[o.customer_id] || 0) + 1
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <AdminUsersClient users={users || []} orderCounts={countMap} />
    </div>
  )
}
