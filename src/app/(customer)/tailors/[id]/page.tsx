import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { TailorProfileClient } from './tailor-profile-client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: tailor } = await supabase
    .from('tailor_profiles')
    .select('business_name, bio, city, state, avg_rating, is_verified')
    .eq('id', id)
    .single()

  if (!tailor) return { title: 'Tailor not found' }

  const title = `${tailor.business_name} — ${tailor.city}, ${tailor.state} Tailor`
  const description = tailor.bio
    ? tailor.bio.slice(0, 155)
    : `Book ${tailor.business_name}, a ${tailor.is_verified ? 'verified ' : ''}fashion creative in ${tailor.city}, ${tailor.state}${tailor.avg_rating ? ` rated ${Number(tailor.avg_rating).toFixed(1)}/5` : ''} on TailorNow.`

  return {
    title,
    description,
    alternates: { canonical: `/tailors/${id}` },
    openGraph: {
      title,
      description,
      url: `/tailors/${id}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title,
      description,
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

  return (
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
  )
}
