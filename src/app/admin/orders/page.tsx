import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { redirect } from 'next/navigation'
import { AdminOrdersClient } from './admin-orders-client'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/browse')

  let query = supabase
    .from('orders')
    .select('*, customer:profiles(full_name, email), tailor:tailor_profiles(business_name, city)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (status) query = query.eq('status', status)

  const { data: orders } = await query

  return (
    <div className="min-h-screen bg-[#140F1E]">
      <Navbar />
      <AdminOrdersClient orders={orders || []} initialStatus={status || ''} />
    </div>
  )
}
