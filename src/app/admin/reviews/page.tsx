import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { redirect } from 'next/navigation'
import { AdminReviewsClient } from './admin-reviews-client'

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/browse')

  const { data: ratings } = await supabase
    .from('ratings')
    .select(`
      *,
      reviewer:profiles!ratings_reviewer_id_fkey(full_name, email),
      order:orders(title, tailor:tailor_profiles(business_name))
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <AdminReviewsClient reviews={ratings || []} />
    </div>
  )
}
