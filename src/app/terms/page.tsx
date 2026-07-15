import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'

export const metadata = { title: 'Terms of Service — TailorNow' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#140F1E]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Terms of Service</h1>
          <p className="text-zinc-500 text-sm">Last updated: June 2025 · Governing law: Federal Republic of Nigeria</p>
        </div>

        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-8 space-y-8 text-zinc-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. About TailorNow</h2>
            <p className="text-sm">TailorNow is an online marketplace that connects customers with independent fashion creatives (tailors and designers) across Nigeria. We provide the platform, payment infrastructure, and communication tools — we are not a tailoring service ourselves. All work is performed by independent creatives.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Eligibility</h2>
            <p className="text-sm">You must be at least 18 years old to use TailorNow. By creating an account, you confirm that the information you provide is accurate and that you have the legal capacity to enter into contracts under Nigerian law.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Accounts</h2>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li>You are responsible for keeping your account credentials secure.</li>
              <li>You may not share your account with others or create multiple accounts.</li>
              <li>We reserve the right to suspend or delete accounts that violate these terms.</li>
              <li>Creatives must be genuine fashion professionals. Misrepresentation leads to immediate removal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Orders and contracts</h2>
            <p className="text-sm mb-3">When a customer places an order and a creative accepts it, a binding contract forms between them — not with TailorNow. TailorNow facilitates the transaction but is not a party to the agreement between the customer and creative.</p>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li>Customers must provide accurate measurements and style references.</li>
              <li>Creatives must complete work to the agreed specification and within the agreed timeframe.</li>
              <li>Price changes after acceptance require written agreement from both parties via the app.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Payments</h2>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li>All payments are processed by Paystack and held in escrow until the customer confirms delivery.</li>
              <li>TailorNow charges a <strong>20% platform commission</strong> on every completed order. Creatives receive 80% of the agreed price.</li>
              <li>Payments are released to the creative after the customer confirms delivery, or automatically 7 days after the order is marked as delivered if no confirmation is received.</li>
              <li>Refunds are issued at TailorNow's discretion following our dispute resolution process.</li>
              <li>Attempting to conduct payments outside the platform to avoid commission is a violation of these terms and grounds for account termination.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Disputes</h2>
            <p className="text-sm mb-2">If you have a dispute with another user:</p>
            <ul className="space-y-1.5 list-disc list-inside text-sm">
              <li>First attempt to resolve it directly through in-app chat.</li>
              <li>If unresolved, raise a dispute via the order page. Our team reviews within 3 business days.</li>
              <li>TailorNow's decision on disputes is final and binding.</li>
              <li>Chargebacks initiated directly with your bank without going through our process may result in account suspension.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Prohibited conduct</h2>
            <p className="text-sm mb-2">You must not:</p>
            <ul className="space-y-1.5 list-disc list-inside text-sm">
              <li>Post false, misleading, or fraudulent content</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Use the platform for any illegal purpose</li>
              <li>Attempt to circumvent our payment system</li>
              <li>Scrape or extract data from TailorNow without permission</li>
              <li>Upload content you do not own or have rights to</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Content and intellectual property</h2>
            <p className="text-sm">Creatives retain ownership of their portfolio photos and designs. By uploading to TailorNow, you grant us a non-exclusive licence to display your content on the platform for promotional purposes. You may remove your content by deleting it from your profile.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Limitation of liability</h2>
            <p className="text-sm">TailorNow is a marketplace platform. We are not liable for the quality of work delivered by creatives, delays, damages to fabric, or any losses arising from transactions between users. Our maximum liability to you is limited to the platform commission we earned on the specific transaction in dispute.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Termination</h2>
            <p className="text-sm">We may terminate or suspend your account at any time for violations of these terms, fraudulent activity, or behaviour harmful to the platform or other users. You may delete your account at any time from your profile settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Governing law</h2>
            <p className="text-sm">These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of Nigerian courts.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Contact</h2>
            <p className="text-sm">For questions about these terms: <strong>legal@tailornow.shop</strong></p>
          </section>
        </div>

        <div className="mt-8 flex gap-4 text-sm text-zinc-500">
          <Link href="/privacy" className="hover:text-violet-400 underline">Privacy Policy</Link>
          <Link href="/" className="hover:text-violet-400 underline">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
