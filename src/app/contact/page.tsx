import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { ContactClient } from './contact-client'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with TailorNow — questions about an order, becoming a creative, or anything else. Email, WhatsApp, or send us a message directly.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact TailorNow',
    description: 'Reach the TailorNow team by email, WhatsApp, or the contact form.',
    url: 'https://tailornow.shop/contact',
    images: [{ url: '/api/og?title=Contact+Us&sub=We+usually+reply+within+a+day', width: 1200, height: 630 }],
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <ContactClient />
    </div>
  )
}
