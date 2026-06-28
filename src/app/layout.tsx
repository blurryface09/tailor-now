import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'TailorNow — Connect with Nigerian Fashion Creatives',
  description: 'Book skilled Nigerian fashion creatives for custom outfits, alterations, bridal wear, asoebi and more. Bargain prices, pay securely, track your order.',
  keywords: 'tailor, fashion, custom outfit, alterations, asoebi, Nigeria, creative',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
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
      <body className="min-h-full bg-gray-50 font-sans">
        {children}
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
