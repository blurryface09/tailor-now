import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { TailorProfileClient } from './tailor-profile-client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: tailor }, { data: portfolio }] = await Promise.all([
    supabase.from('tailor_profiles')
      .select('business_name, bio, city, state, avg_rating, is_verified')
      .eq('id', id)
      .single(),
    supabase.from('portfolio_items')
      .select('image_url')
      .eq('tailor_id', id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  if (!tailor) return { title: 'Tailor not found' }

  const title = `${tailor.business_name} — ${tailor.city}, ${tailor.state} Fashion Creative`
  const description = tailor.bio
    ? tailor.bio.slice(0, 155)
    : `Book ${tailor.business_name}, a ${tailor.is_verified ? 'verified ' : ''}fashion creative in ${tailor.city}, ${tailor.state}${tailor.avg_rating ? ` rated ${Number(tailor.avg_rating).toFixed(1)}/5` : ''} on TailorNow.`

  const ogFallback = `https://tailornow.shop/api/og?type=tailor&title=${encodeURIComponent(tailor.business_name)}&sub=${encodeURIComponent(`${tailor.city}, ${tailor.state} · Fashion Creative`)}`
  const ogImage = portfolio?.[0]?.image_url
    ? [{ url: portfolio[0].image_url, width: 1200, height: 630, alt: tailor.business_name }]
    : [{ url: ogFallback, width: 1200, height: 630, alt: tailor.business_name }]

  return {
    title,
    description,
    alternates: { canonical: `/tailors/${id}` },
    openGraph: {
      title,
      description,
      url: `/tailors/${id}`,
      type: 'profile',
      images: ogImage,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage[0].url],
    },
  }
}

export default async function TailorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: orderIds } = await supabase.from('orders').select('id').eq('tailor_id', id)
  const ids = (orderIds || []).map(o => o.id)

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: tailor }, { data: services }, { data: portfolio }, { data: ratings }, { data: likeRow }] = await Promise.all([
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
    user
      ? supabase.from('creative_likes').select('id').eq('creative_id', id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (!tailor) notFound()

  const isOwner = user?.id === tailor.user_id

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: tailor.business_name,
    description: tailor.bio ?? undefined,
    url: `https://tailornow.shop/tailors/${id}`,
    image: portfolio?.[0]?.image_url ?? undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: tailor.profile?.city ?? tailor.city,
      addressRegion: tailor.profile?.state ?? tailor.state,
      addressCountry: 'NG',
    },
    aggregateRating: tailor.avg_rating && tailor.total_reviews
      ? {
          '@type': 'AggregateRating',
          ratingValue: Number(tailor.avg_rating).toFixed(1),
          reviewCount: tailor.total_reviews,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    hasOfferCatalog: services && services.length > 0
      ? {
          '@type': 'OfferCatalog',
          name: `${tailor.business_name} Services`,
          itemListElement: services.map((s) => ({
            '@type': 'Offer',
            name: s.name,
            description: s.description ?? undefined,
            price: s.base_price,
            priceCurrency: 'NGN',
          })),
        }
      : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="min-h-screen">
      <Navbar />
      <TailorProfileClient
        tailor={tailor}
        services={services || []}
        portfolio={portfolio || []}
        ratings={ratings || []}
        isOwner={isOwner}
        currentUserId={user?.id ?? null}
        initialLiked={!!likeRow}
      />
    </div>
    </>
  )
}
