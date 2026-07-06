import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'TailorNow — Connect with Nigerian Fashion Creatives',
  description: 'Book skilled Nigerian fashion creatives for custom outfits, alterations, bridal wear, asoebi and more. Bargain prices, pay securely, track your order.',
  keywords: 'tailor, fashion, custom outfit, alterations, asoebi, Nigeria, creative',
  manifest: '/manifest.json',
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
  },
  twitter: {
    card: 'summary',
    title: 'TailorNow',
    description: 'Connect with Nigerian fashion creatives. Custom outfits, alterations, bridal wear.',
  },
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
      </head>
      <body className="min-h-full bg-[#09090B] text-white font-sans">
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
