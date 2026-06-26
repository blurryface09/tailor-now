import type { Metadata } from 'next'
import { Inter, Dancing_Script } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', preload: false })
const dancing = Dancing_Script({ subsets: ['latin'], weight: ['700'], variable: '--font-script', display: 'swap', preload: false })

export const metadata: Metadata = {
  title: 'Tailor Now — Find Expert Tailors Near You',
  description: 'Book skilled tailors for custom outfits, alterations, bridal wear, uniforms and more. Fast, reliable, professional tailoring at your fingertips.',
  keywords: 'tailor, tailoring, custom outfit, alterations, fashion, Nigeria',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${dancing.variable} ${inter.className} min-h-full bg-gray-50`}>
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
