import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'

export const metadata: Metadata = {
  metadataBase: new URL('https://tailornow.shop'),
  title: {
    default: 'TailorNow — Connect with Nigerian Fashion Creatives',
    template: '%s | TailorNow',
  },
  description: 'Book skilled Nigerian fashion creatives for custom outfits, alterations, bridal wear, asoebi and more. Bargain prices, pay securely, track your order.',
  keywords: 'tailor, fashion, custom outfit, alterations, asoebi, Nigeria, creative, bridal wear, Lagos tailor',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  icons: {
    icon: '/icon-192.png',
    shortcut: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'TailorNow — Connect with Nigerian Fashion Creatives',
    description: 'Book skilled Nigerian fashion creatives for custom outfits, alterations, bridal wear and asoebi. Bargain prices, pay securely.',
    url: 'https://tailornow.shop',
    siteName: 'TailorNow',
    locale: 'en_NG',
    type: 'website',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'TailorNow — Nigeria\'s Fashion Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TailorNow',
    description: 'Connect with Nigerian fashion creatives. Custom outfits, alterations, bridal wear.',
    images: ['/api/og'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TailorNow',
  url: 'https://tailornow.shop',
  logo: 'https://tailornow.shop/icon-512.png',
  description: 'Marketplace connecting customers with skilled Nigerian fashion creatives for custom outfits, alterations, bridal wear and asoebi.',
  areaServed: 'NG',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="application-name" content="TailorNow" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TailorNow" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#7C3AED" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full bg-zinc-50 text-zinc-900 font-sans">
        {children}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' },
            success: { iconTheme: { primary: '#7C3AED', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
