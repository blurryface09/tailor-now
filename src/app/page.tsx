import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

const stats = [
  { value: '2,400+', label: 'Verified Creatives' },
  { value: '18,000+', label: 'Orders Completed' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '24hrs', label: 'Avg Response' },
]

const steps = [
  { n: '01', icon: '🔍', title: 'Browse Creatives', desc: 'Filter by city, service, rating. View portfolios and real customer reviews.' },
  { n: '02', icon: '💬', title: 'Book & Chat', desc: 'Send your order with measurements and style references. Agree on pricing.' },
  { n: '03', icon: '📦', title: 'Track Your Order', desc: 'Live updates at every stage — cutting, sewing, ready, out for delivery.' },
  { n: '04', icon: '⭐', title: 'Rate & Review', desc: 'Confirm delivery, leave a review. Build trust for the whole community.' },
]

const features = [
  { icon: '📏', title: 'Saved Measurements', desc: 'Store once, use every order. No more measuring tape awkwardness.' },
  { icon: '🚚', title: 'Pickup & Delivery', desc: 'We collect your fabric and deliver the finished outfit to your door.' },
  { icon: '💬', title: 'Direct Chat', desc: 'Message your creative directly with style refs and discuss pricing.' },
  { icon: '📍', title: 'Live Tracking', desc: 'Track every stage from cutting to delivery in real time.' },
  { icon: '⭐', title: 'Mutual Ratings', desc: 'Customers rate creatives. Creatives rate customers. Trust built both ways.' },
  { icon: '🏆', title: 'Hall of Fame', desc: 'Top-rated creatives get featured. Quality is recognised and rewarded.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full bg-black/60 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/"><Logo size="sm" variant="full" dark /></Link>
          <div className="hidden md:flex items-center gap-7 text-sm text-zinc-600">
            <Link href="/browse" className="hover:text-white transition-colors">Find Creatives</Link>
            <Link href="/signup?as=tailor" className="hover:text-white transition-colors">Join as Creative</Link>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <Link href="/hall-of-fame" className="hover:text-amber-400 transition-colors">🏆 Hall of Fame</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5">
              Log in
            </Link>
            <Link href="/signup" className="bg-amber-400 hover:bg-amber-500 text-black text-sm font-black px-5 py-2.5 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-amber-500/25">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex items-center pt-16 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/12 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-amber-500/6 rounded-full blur-[120px] pointer-events-none" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative w-full max-w-7xl mx-auto px-5 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-20 lg:py-12 min-h-[calc(100svh-4rem)]">

          {/* Text side */}
          <div className="order-2 lg:order-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full px-4 py-2 text-sm mb-8 w-fit backdrop-blur-sm text-zinc-600">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
              1,200+ creatives online right now
            </div>

            <h1 className="text-5xl lg:text-[72px] font-black leading-[1.02] mb-6 tracking-tight">
              Nigeria&apos;s<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">Fashion</span><br />
              Marketplace
            </h1>

            <p className="text-lg text-zinc-600 max-w-lg mb-10 leading-relaxed">
              Book verified tailors and designers for custom outfits, bridal wear, alterations and more. Fast, reliable, delivered to your door.
            </p>

            <div className="flex flex-wrap gap-4 mb-14">
              <Link href="/browse"
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-black text-base px-8 py-4 rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.97] shadow-2xl shadow-amber-500/25">
                Find a Creative →
              </Link>
              <Link href="/signup?as=tailor"
                className="flex items-center gap-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all backdrop-blur-sm">
                Join as Creative
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-4 border-t border-white/10 pt-8">
              {stats.map(s => (
                <div key={s.label}>
                  <div className="text-xl font-black text-amber-400">{s.value}</div>
                  <div className="text-xs text-zinc-400 mt-0.5 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo collage side */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-72 h-[430px] lg:w-[360px] lg:h-[520px]">
              {/* Back image — rotated left */}
              <div className="absolute bottom-0 left-0 w-[200px] h-[280px] lg:w-[240px] lg:h-[340px] rounded-3xl overflow-hidden shadow-2xl shadow-black/70 -rotate-6 border border-white/10">
                <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=480&h=680&fit=crop&q=80" alt="" className="w-full h-full object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              {/* Front image — rotated right, overlaps */}
              <div className="absolute top-0 right-0 w-[215px] h-[310px] lg:w-[260px] lg:h-[380px] rounded-3xl overflow-hidden shadow-2xl shadow-violet-900/50 rotate-3 border border-white/10 z-10">
                <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=520&h=760&fit=crop&q=80" alt="" className="w-full h-full object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              {/* Floating verified card */}
              <div className="absolute bottom-12 right-0 lg:-right-5 bg-white/[0.05] backdrop-blur-xl rounded-2xl px-4 py-3 shadow-2xl z-20 border border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-black text-sm flex-shrink-0">A</div>
                  <div>
                    <p className="text-xs font-bold text-white whitespace-nowrap">Adaeze Couture</p>
                    <p className="text-xs text-zinc-500">⭐ 4.9 · 312 orders</p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center ml-1 flex-shrink-0">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </div>
                </div>
              </div>
              {/* Floating order notification */}
              <div className="absolute top-8 -left-2 lg:-left-5 bg-white/10 backdrop-blur-xl rounded-2xl px-3.5 py-2.5 shadow-xl z-20 border border-white/20">
                <p className="text-xs text-zinc-600 font-medium">📦 Order update</p>
                <p className="text-xs text-white font-bold mt-0.5">Your outfit is ready! 🎉</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services band ──────────────────────────── */}
      <section className="py-20 border-y border-white/[0.06] bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-5">
          <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-10 text-center">What you can order</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '👗', name: 'Custom Outfits', desc: 'Ankara, Aso-Oke, contemporary', img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&h=300&fit=crop&q=75' },
              { icon: '💍', name: 'Bridal Couture', desc: 'Gowns, asoebi, coordination', img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop&q=75' },
              { icon: '✂️', name: 'Alterations', desc: 'Quick fixes, sizing, hemming', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=300&fit=crop&q=75' },
              { icon: '🧵', name: 'Fabric & More', desc: 'Sourcing, uniforms, ready-to-wear', img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=300&fit=crop&q=75' },
            ].map(s => (
              <Link key={s.name} href="/browse"
                className="group relative overflow-hidden rounded-3xl aspect-[4/3] cursor-pointer block">
                <img src={s.img} alt={s.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className="font-bold text-white text-sm">{s.name}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────── */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest text-violet-400 uppercase mb-4">Simple process</p>
            <h2 className="text-4xl lg:text-5xl font-black">From browse to fitted<br className="hidden md:block" /> in 4 steps</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {steps.map((step) => (
              <div key={step.n}
                className="relative bg-white/[0.04] border border-white/10 rounded-3xl p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 group hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.07] border border-white/10 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <div className="absolute top-5 right-5 text-4xl font-black text-white/[0.04] select-none">{step.n}</div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section className="py-20 bg-white/[0.015] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-violet-400 uppercase mb-4">Platform features</p>
            <h2 className="text-4xl font-black">Built for Nigerian fashion</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title}
                className="bg-white/[0.04] border border-white/10 rounded-3xl p-7 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 group hover:-translate-y-1">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dual CTA ───────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-5">
          {/* Customers */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 to-violet-950 p-10 border border-violet-700/30">
            <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 w-40 h-40 bg-violet-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <p className="text-violet-300 text-xs font-bold uppercase tracking-widest mb-5">For customers</p>
              <h3 className="text-3xl font-black text-white mb-3 leading-tight">Find your perfect<br />creative today</h3>
              <p className="text-violet-200/70 text-sm mb-8 leading-relaxed">Browse hundreds of verified creatives across Lagos, Abuja, Port Harcourt and all of Nigeria.</p>
              <Link href="/browse"
                className="inline-flex items-center gap-2 bg-white text-violet-900 font-black px-6 py-3.5 rounded-2xl hover:bg-violet-50 transition-all hover:scale-[1.03] shadow-xl shadow-violet-900/50">
                Browse Creatives →
              </Link>
            </div>
          </div>
          {/* Creatives */}
          <div className="relative overflow-hidden rounded-3xl p-10 border border-amber-500/20" style={{ background: 'linear-gradient(135deg, #130b00 0%, #211200 100%)' }}>
            <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 w-40 h-40 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-5">For creatives</p>
              <h3 className="text-3xl font-black text-white mb-3 leading-tight">Turn your skill<br />into income</h3>
              <p className="text-amber-100/50 text-sm mb-8 leading-relaxed">Get verified, build your portfolio, and reach thousands of customers ready to book today.</p>
              <Link href="/signup?as=tailor"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-black px-6 py-3.5 rounded-2xl transition-all hover:scale-[1.03] shadow-xl shadow-amber-500/20">
                Start Taking Orders →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-14">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="mb-4"><Logo size="md" variant="full" dark /></div>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
                Nigeria&apos;s premier fashion marketplace. Connecting skilled creatives with customers who deserve a perfect fit.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-5">Platform</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><Link href="/browse" className="hover:text-white transition-colors">Find Creatives</Link></li>
                <li><Link href="/orders/asoebi" className="hover:text-white transition-colors">Asoebi Group Orders</Link></li>
                <li><Link href="/signup?as=tailor" className="hover:text-white transition-colors">Join as Creative</Link></li>
                <li><Link href="/hall-of-fame" className="hover:text-amber-400 transition-colors">Hall of Fame</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-5">Legal</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-300">© 2026 TailorNow. All rights reserved.</p>
            <p className="text-xs text-zinc-300">Built by <span className="text-violet-400 font-semibold">Folub and Samuel Labs</span></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
