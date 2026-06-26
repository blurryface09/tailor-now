import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { BrowseClient } from './browse-client'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; city?: string; q?: string }>
}) {
  const { service, city, q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('tailor_profiles')
    .select(`*, profile:profiles(id, full_name, avatar_url, city, state)`)
    .eq('is_active', true)
    .order('avg_rating', { ascending: false })

  if (service) query = query.contains('specialties', [service])
  if (city) query = query.ilike('city', `%${city}%`)

  const { data: tailors } = await query.limit(30)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <BrowseClient tailors={tailors || []} initialService={service} initialCity={city} />
    </div>
  )
}
