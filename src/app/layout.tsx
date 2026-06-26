import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Tailor Now — Find Expert Tailors Near You',
  description: 'Book skilled tailors for custom outfits, alterations, bridal wear, uniforms and more. Fast, reliable, professional tailoring at your fingertips.',
  keywords: 'tailor, tailoring, custom outfit, alterations, fashion, Nigeria',
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
