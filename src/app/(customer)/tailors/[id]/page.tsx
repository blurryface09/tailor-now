import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { TailorProfileClient } from './tailor-profile-client'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TailorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: orderIds } = await supabase.from('orders').select('id').eq('tailor_id', id)
  const ids = (orderIds || []).map(o => o.id)

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: tailor }, { data: services }, { data: portfolio }, { data: ratings }] = await Promise.all([
    supabase.from('tailor_profiles').select('*, profile:profiles(*)').eq('id', id).single(),
    supabase.from('tailor_services').select('*').eq('tailor_id', id).eq('is_active', true),
    supabase.from('portfolio_items').select('*').eq('tailor_id', id).order('created_at', { ascending: false }),
    ids.length > 0
      ? supabase.from('ratings').select('*, reviewer:profiles(full_name, avatar_url)')
          .eq('reviewer_role', 'customer')
          .in('order_id', ids)
          .order('created_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ])

  if (!tailor) notFound()

  const isOwner = user?.id === tailor.user_id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <TailorProfileClient
        tailor={tailor}
        services={services || []}
        portfolio={portfolio || []}
        ratings={ratings || []}
        isOwner={isOwner}
      />
    </div>
  )
}
