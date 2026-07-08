import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ProductClient } from './product-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('title, caption, image_urls, creative:tailor_profiles(business_name)')
    .eq('id', id)
    .single<{ title: string | null; caption: string | null; image_urls: string[]; creative: { business_name: string } | null }>()

  if (!post) return { title: 'Post not found' }

  const authorName = post.creative?.business_name || 'TailorNow'
  const title = post.title || `${authorName} on TailorNow`
  const description = post.caption?.slice(0, 155) || `Check out ${authorName}'s work on TailorNow.`
  const image = post.image_urls?.[0]

  return {
    title,
    description,
    alternates: { canonical: `/p/${id}` },
    openGraph: {
      title,
      description,
      url: `/p/${id}`,
      type: 'article',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('id, title, caption, image_urls, price_from, creative:tailor_profiles(id, business_name, city, state)')
    .eq('id', id)
    .single<{
      id: string
      title: string | null
      caption: string | null
      image_urls: string[]
      price_from: number | null
      creative: { id: string; business_name: string; city: string; state: string } | null
    }>()

  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: post.title || `${post.creative?.business_name ?? 'TailorNow'} Fashion Piece`,
    description: post.caption ?? undefined,
    image: post.image_urls ?? [],
    url: `https://tailornow.shop/p/${id}`,
    brand: post.creative
      ? { '@type': 'Brand', name: post.creative.business_name }
      : undefined,
    offers: post.price_from
      ? {
          '@type': 'Offer',
          price: post.price_from,
          priceCurrency: 'NGN',
          availability: 'https://schema.org/InStock',
          seller: post.creative
            ? {
                '@type': 'LocalBusiness',
                name: post.creative.business_name,
                url: `https://tailornow.shop/tailors/${post.creative.id}`,
              }
            : undefined,
        }
      : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient />
    </>
  )
}
