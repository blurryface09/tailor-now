import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { BrowseClient } from './browse-client'
import { SERVICE_LABELS } from '@/lib/utils'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Browse Fashion Creatives in Nigeria',
  description: 'Find verified tailors, designers, bridal specialists and fashion creatives across Lagos, Abuja, Port Harcourt and all of Nigeria. Custom outfits, alterations, asoebi and more.',
  alternates: { canonical: '/browse' },
  openGraph: {
    title: 'Browse Nigerian Fashion Creatives — TailorNow',
    description: 'Verified tailors and designers across Nigeria. Custom fits, bridal, asoebi, alterations.',
    url: 'https://tailornow.shop/browse',
    images: [{ url: '/api/og?title=Browse+Fashion+Creatives&sub=Verified+tailors+%26+designers+across+Nigeria', width: 1200, height: 630 }],
  },
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; city?: string; state?: string; q?: string }>
}) {
  const { service, city, state, q } = await searchParams
  const supabase = await createClient()

  // Public page — no auth required so Google can crawl creatives

  let query = supabase
    .from('tailor_profiles')
    .select(`*, profile:profiles(id, full_name, avatar_url, city, state)`)
    .eq('is_active', true)
    .eq('is_verified', true)
    .order('avg_rating', { ascending: false })

  if (service) query = query.contains('specialties', [service])
  if (state) query = query.eq('state', state)
  if (city) query = query.ilike('city', `%${city}%`)

  if (q) {
    // General search: business name, bio, specialty labels (styles), and portfolio item titles/descriptions
    const matchingServiceKeys = Object.entries(SERVICE_LABELS)
      .filter(([, label]) => label.toLowerCase().includes(q.toLowerCase()))
      .map(([key]) => key)

    const { data: portfolioMatches } = await supabase
      .from('portfolio_items')
      .select('tailor_id')
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    const portfolioTailorIds = Array.from(new Set((portfolioMatches || []).map(p => p.tailor_id)))

    const orParts = [`business_name.ilike.%${q}%`, `bio.ilike.%${q}%`]
    if (matchingServiceKeys.length) orParts.push(`specialties.ov.{${matchingServiceKeys.join(',')}}`)
    if (portfolioTailorIds.length) orParts.push(`id.in.(${portfolioTailorIds.join(',')})`)
    query = query.or(orParts.join(','))
  }

  const { data: tailors } = await query.limit(30)

  return (
    <div className="min-h-screen">
      <Navbar />
      <BrowseClient
        tailors={tailors || []}
        initialService={service}
        initialCity={city}
        initialState={state}
        initialQuery={q}
        isFiltered={!!(service || city || state || q)}
      />
    </div>
  )
}
