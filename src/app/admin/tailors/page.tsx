import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { redirect } from 'next/navigation'
import { AdminTailorsClient } from './admin-tailors-client'

export const dynamic = 'force-dynamic'

export default async function AdminTailorsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/browse')

  let query = supabase.from('tailor_profiles').select('*, profile:profiles(full_name, email, phone, created_at)')
    .order('created_at', { ascending: false })
  if (filter === 'unverified') query = query.eq('is_verified', false)

  const { data: tailors } = await query

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTailorsClient tailors={tailors || []} />
    </div>
  )
}
