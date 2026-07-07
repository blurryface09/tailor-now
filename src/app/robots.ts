import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/dashboard',
          '/dashboard/',
          '/tailor/',
          '/api/',
          '/auth/',
          '/orders/',
          '/chat',
          '/notifications',
        ],
      },
    ],
    sitemap: 'https://tailornow.shop/sitemap.xml',
  }
}
