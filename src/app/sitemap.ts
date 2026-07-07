import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://tailornow.shop'

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/browse`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/feed`, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE_URL}/fabrics`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/hall-of-fame`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/login`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/signup`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const supabase = publicClient()
  if (!supabase) return staticRoutes

  const [{ data: tailors }, { data: posts }] = await Promise.all([
    supabase
      .from('tailor_profiles')
      .select('id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(2000),
    supabase
      .from('posts')
      .select('id, created_at')
      .eq('post_type', 'product')
      .order('created_at', { ascending: false })
      .limit(2000),
  ])

  const tailorRoutes: MetadataRoute.Sitemap = (tailors ?? []).map((t) => ({
    url: `${BASE_URL}/tailors/${t.id}`,
    lastModified: t.updated_at ? new Date(t.updated_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${BASE_URL}/p/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...tailorRoutes, ...postRoutes]
}
