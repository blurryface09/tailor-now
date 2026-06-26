import Link from 'next/link'
import { SERVICE_LABELS } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import { TailoringBg } from '@/components/ui/tailoring-bg'

const features = [
  { icon: '✂️', title: 'Expert Tailors', desc: 'Verified professionals with proven portfolios and real customer reviews.' },
  { icon: '📏', title: 'Save Your Measurements', desc: 'Store your measurements once. Use them for every order — no re-measuring ever again.' },
  { icon: '🚚', title: 'Pickup and Delivery', desc: 'We collect your fabric and deliver your finished outfit to your door.' },
  { icon: '💬', title: 'Direct Chat', desc: 'Message your tailor directly. Share style references, discuss details, agree on price.' },
  { icon: '📍', title: 'Live Order Tracking', desc: 'Track every stage from cutting to delivery in real time.' },
  { icon: '⭐', title: 'Mutual Ratings', desc: 'Customers rate tailors. Tailors rate customers. Trust on both sides.' },
]

const stats = [
  { value: '2,400+', label: 'Verified Tailors' },
  { value: '18,000+', label: 'Orders Completed' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '24hrs', label: 'Avg Response Time' },
]

const SERVICE_ICONS: Record<string, string> = {
  custom_outfit: '👗', alterations: '✂️', bridal: '💍',
  ready_to_wear: '👕', fabric_sourcing: '🧵', uniforms: '👔',
}

const steps = [
  { step: '01', icon: '🔍', title: 'Browse Tailors', desc: 'Filter by service, location, rating, and price range. View portfolios and reviews.' },
  { step: '02', icon: '💬', title: 'Book and Chat', desc: 'Send an order request with your measurements and style references. Chat to agree on price.' },
  { step: '03', icon: '📦', title: 'Track Your Order', desc: 'Get real-time updates at every stage — cutting, sewing, ready, out for delivery.' },
  { step: '04', icon: '⭐', title: 'Rate and Review', desc: 'Receive your outfit. Confirm delivery, pay balance, and leave a review. Tailor rates you too.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm shadow-violet-100/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/"><Logo size="sm" variant="full" /></Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link href="/browse" className="hover:text-violet-700 transition-colors font-medium">Find Tailors</Link>
            <Link href="/login?as=tailor" className="hover:text-violet-700 transition-colors font-medium">Join as Tailor</Link>
            <Link href="#how-it-works" className="hover:text-violet-700 transition-colors font-medium">How it works</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-violet-700 transition-colors px-3 py-2 rounded-xl hover:bg-violet-50">
              Log in
            </Link>
            <Link href="/signup" className="bg-violet-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-violet-800 transition-all duration-200 shadow-sm shadow-violet-300 hover:shadow-violet-400 hover:scale-[1.03] active:scale-[0.97]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-violet-900 to-violet-800 text-white min-h-[92vh] flex items-center">
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <TailoringBg dark />
        {/* Thread wave bottom */}
        <svg className="absolute bottom-0 left-0 w-full h-24 opacity-10" viewBox="0 0 1440 96" preserveAspectRatio="none" fill="none">
          <path d="M0,48 Q180,0 360,48 Q540,96 720,48 Q900,0 1080,48 Q1260,96 1440,48" stroke="white" strokeWidth="2" fill="none" strokeDasharray="8 4" />
        </svg>

        <div className="relative w-full max-w-6xl mx-auto px-4 py-24 md:py-36 text-center">
          {/* Big logo in hero */}
          <div className="fade-up flex justify-center mb-8">
            <Logo size="xl" variant="full" animated dark />
          </div>

          <div className="fade-up-1 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 text-sm mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full pulse-dot" />
            <span>1,200+ tailors online right now</span>
          </div>

          <h1 className="fade-up-2 text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
            Your perfect fit,<br />
            <span className="text-amber-400">delivered to you.</span>
          </h1>

          <p className="fade-up-3 text-xl text-violet-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Book verified tailors for custom outfits, alterations, bridal wear, uniforms and more.
            Fast. Reliable. Professional.
          </p>

          <div className="fade-up-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/browse"
              className="gold-shimmer btn-press text-amber-950 font-black text-lg px-10 py-4 rounded-2xl shadow-xl shadow-amber-500/30 transition-transform hover:scale-105"
            >
              Find a Tailor Now →
            </Link>
            <Link
              href="/signup?as=tailor"
              className="btn-press bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all backdrop-blur-sm"
            >
              Join as a Tailor
            </Link>
          </div>

          {/* Stats */}
          <div className="fade-up-5 mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto border-t border-white/10 pt-12">
            {stats.map((s) => (
              <div key={s.label} className="group">
                <div className="text-3xl font-black text-amber-400 group-hover:scale-110 transition-transform duration-200">{s.value}</div>
                <div className="text-sm text-violet-300 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ────────────────────────────────── */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <TailoringBg />
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14 page-enter">
            <span className="text-xs font-bold tracking-widest text-violet-500 uppercase mb-3 block">Services</span>
            <h2 className="text-4xl font-black text-gray-900">What can we make for you?</h2>
            <p className="text-gray-500 mt-3 text-lg">From everyday wear to once-in-a-lifetime pieces</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Asoebi — featured card */}
            <Link href="/orders/asoebi"
              className="group col-span-2 md:col-span-1 bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl p-6 border border-violet-500 card-lift transition-all fade-up relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-all duration-300">👗</div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white text-base">Asoebi Group Orders</h3>
                  <span className="text-xs bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full">New</span>
                </div>
                <p className="text-xs text-violet-200 mt-1">Coordinate outfits for weddings, parties and events →</p>
              </div>
            </Link>

            {Object.entries(SERVICE_LABELS).filter(([k]) => k !== 'asoebi').map(([key, label], i) => (
              <Link
                key={key}
                href={`/browse?service=${key}`}
                className={`group bg-white rounded-2xl p-6 border border-gray-100 hover:border-violet-300 card-lift transition-all ${['fade-up-1', 'fade-up-2', 'fade-up-3', 'fade-up-4', 'fade-up-5', 'fade-up'][i]}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:bg-violet-100 transition-all duration-300">
                  {SERVICE_ICONS[key]}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-violet-700 transition-colors text-base">{label}</h3>
                <p className="text-xs text-gray-400 mt-1 group-hover:text-violet-400 transition-colors">Explore tailors →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
        <TailoringBg />
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-violet-500 uppercase mb-3 block">Process</span>
            <h2 className="text-4xl font-black text-gray-900">How TailorNow works</h2>
            <p className="text-gray-500 mt-3 text-lg">From browse to fitted in 4 simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-violet-200 via-violet-400 to-violet-200" />
            {steps.map((item, i) => (
              <div key={item.step} className={`relative text-center ${['fade-up', 'fade-up-1', 'fade-up-2', 'fade-up-3'][i]}`}>
                <div className="relative inline-flex">
                  <div className="w-20 h-20 rounded-2xl bg-violet-50 border-2 border-violet-100 flex items-center justify-center text-3xl mb-5 mx-auto hover:scale-110 transition-transform duration-300 hover:bg-violet-100 hover:border-violet-300 cursor-default relative z-10">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-violet-700 text-white text-[10px] font-black flex items-center justify-center z-20">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section className="py-24 bg-violet-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <TailoringBg dark />
        {/* Decorative thread */}
        <svg className="absolute top-0 left-0 w-full h-12 opacity-10" viewBox="0 0 1440 48" preserveAspectRatio="none" fill="none">
          <path d="M0,24 Q180,0 360,24 Q540,48 720,24 Q900,0 1080,24 Q1260,48 1440,24" stroke="white" strokeWidth="2" fill="none" />
        </svg>
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-violet-300 uppercase mb-3 block">Features</span>
            <h2 className="text-4xl font-black">Everything you need for perfect tailoring</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={f.title}
                className={`group bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/10 hover:border-white/20 transition-all duration-300 card-lift ${['fade-up', 'fade-up-1', 'fade-up-2', 'fade-up-3', 'fade-up-4', 'fade-up-5'][i]}`}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-violet-300 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tailor CTA ──────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gold-shimmer opacity-90" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #92400E 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <TailoringBg />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs font-bold tracking-widest text-amber-900/70 uppercase mb-4 block">For Tailors</span>
          <h2 className="text-4xl font-black text-amber-950 mb-4">Are you a tailor?</h2>
          <p className="text-amber-900 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of tailors already earning on TailorNow. Get verified, build your portfolio, and reach customers who are ready to order today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?as=tailor" className="btn-press bg-violet-700 hover:bg-violet-800 text-white font-black text-lg px-10 py-4 rounded-2xl transition-all shadow-lg shadow-violet-900/30 hover:scale-105">
              Start Taking Orders →
            </Link>
            <Link href="#how-it-works" className="btn-press bg-amber-950/10 hover:bg-amber-950/20 text-amber-950 font-bold text-lg px-10 py-4 rounded-2xl transition-all">
              Learn how it works
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="mb-4"><Logo size="md" variant="full" dark /></div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Nigeria&apos;s premier tailoring marketplace. Connecting skilled tailors with customers who deserve a perfect fit.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/browse" className="hover:text-violet-400 transition-colors">Find Tailors</Link></li>
                <li><Link href="/orders/asoebi" className="hover:text-violet-400 transition-colors">Asoebi Group Orders</Link></li>
                <li><Link href="/signup?as=tailor" className="hover:text-violet-400 transition-colors">Join as Tailor</Link></li>
                <li><Link href="/referral" className="hover:text-amber-400 transition-colors">Refer and Earn</Link></li>
                <li><Link href="#how-it-works" className="hover:text-violet-400 transition-colors">How it works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy" className="hover:text-violet-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-violet-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">© 2026 TailorNow. All rights reserved.</p>
            <p className="text-xs text-gray-600">
              Built by{' '}
              <span className="text-violet-400 font-semibold">Folub and Samuel Labs</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
