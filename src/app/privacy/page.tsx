import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — TailorNow' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#140F1E]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Privacy Policy</h1>
          <p className="text-zinc-500 text-sm">Last updated: June 2025</p>
        </div>

        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8 space-y-8 text-zinc-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Who we are</h2>
            <p>TailorNow is a Nigerian fashion marketplace that connects customers with skilled fashion creatives for custom outfits, alterations, bridal wear, and more. Our platform operates at <strong>tailornow.shop</strong>. When you use TailorNow, you trust us with your personal information — we take that seriously.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Information we collect</h2>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li><strong>Account data:</strong> Name, email address, phone number, and role (customer or creative) when you register.</li>
              <li><strong>Profile data:</strong> Business name, city, state, bio, profile photo, and portfolio images for creatives.</li>
              <li><strong>Order data:</strong> Service requests, measurements, style references, prices, delivery addresses, and order status.</li>
              <li><strong>Payment data:</strong> We do not store card details. Payments are processed securely by Paystack. We store transaction references and amounts only.</li>
              <li><strong>Location data:</strong> If you choose to use location features, we may collect your approximate city and state to help match you with nearby creatives. We never track your location continuously.</li>
              <li><strong>Communications:</strong> Messages sent through our in-app chat between customers and creatives.</li>
              <li><strong>Usage data:</strong> Pages visited, features used, and device type, to improve the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. How we use your information</h2>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li>To create and manage your account</li>
              <li>To facilitate orders between customers and creatives</li>
              <li>To process payments via Paystack</li>
              <li>To send order updates and notifications (WhatsApp and in-app)</li>
              <li>To display your public profile to potential customers (for creatives)</li>
              <li>To resolve disputes and maintain platform safety</li>
              <li>To improve our services and fix bugs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. How we share your information</h2>
            <p className="text-sm mb-3">We do <strong>not</strong> sell your personal data. We share information only as necessary:</p>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li><strong>Between users:</strong> When you place an order, your name and contact details are shared with the creative you booked, and vice versa.</li>
              <li><strong>Paystack:</strong> Your payment is processed by Paystack. Their privacy policy applies to payment processing.</li>
              <li><strong>Supabase:</strong> Our database and authentication provider. Data is stored securely in their infrastructure.</li>
              <li><strong>Legal requirements:</strong> We may disclose information if required by Nigerian law or to protect user safety.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Data retention</h2>
            <p className="text-sm">We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where required by law (e.g., transaction records for tax purposes, which we keep for 7 years).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Your rights</h2>
            <p className="text-sm mb-3">Under Nigerian data protection laws (NDPR), you have the right to:</p>
            <ul className="space-y-1.5 list-disc list-inside text-sm">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Object to how we use your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-sm mt-3">To exercise these rights, email us at <strong>privacy@tailornow.shop</strong></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Cookies</h2>
            <p className="text-sm">We use essential cookies only — for authentication sessions and security. We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Security</h2>
            <p className="text-sm">Your data is stored encrypted in Supabase. All connections use HTTPS. Payments are handled by Paystack's PCI-compliant infrastructure. We never store raw card numbers or CVV codes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Changes to this policy</h2>
            <p className="text-sm">We may update this policy. When we do, we will notify you via the app and update the date above. Continued use of TailorNow after changes means you accept the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Contact us</h2>
            <p className="text-sm">Questions about this policy? Reach us at <strong>privacy@tailornow.shop</strong> or through our in-app support.</p>
          </section>
        </div>

        <div className="mt-8 flex gap-4 text-sm text-zinc-500">
          <Link href="/terms" className="hover:text-violet-400 underline">Terms of Service</Link>
          <Link href="/" className="hover:text-violet-400 underline">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
