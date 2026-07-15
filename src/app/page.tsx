'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { ArrowRight, Star, CheckCircle, Zap, Users, Package, MapPin } from 'lucide-react'

const ThreeBackground = dynamic(
  () => import('@/components/three/ThreeBackground').then(m => m.ThreeBackground),
  { ssr: false }
)

// ── TiltCard — 3D perspective tilt on mouse move ──────────────────────────────
function TiltCard({
  children, strength = 12, className = '', style, onClick,
}: {
  children: React.ReactNode
  strength?: number
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width - 0.5) * strength
    const y = ((e.clientY - r.top) / r.height - 0.5) * strength
    el.style.transition = 'transform 0.06s linear'
    el.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(14px)`
  }
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    el.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1)'
    el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0px)'
  }
  return (
    <div className={className} style={style} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}>
      {children}
    </div>
  )
}

// ── Reveal — scroll-triggered fade+slide-up ───────────────────────────────────
function Reveal({
  children, delay = 0, y = 36, className = '',
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'none' : `translateY(${y}px)`,
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// ── CountUp — animated number ticker ─────────────────────────────────────────
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return
      obs.disconnect()
      const t0 = performance.now()
      const run = (t: number) => {
        const p = Math.min((t - t0) / 1800, 1)
        setV(Math.floor((1 - (1 - p) ** 3) * to))
        if (p < 1) requestAnimationFrame(run)
        else setV(to)
      }
      requestAnimationFrame(run)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref}>{v.toLocaleString()}{suffix}</span>
}

// ── Static data ───────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  'Custom Outfits', 'Bridal Couture', 'Ankara Styles', 'Alterations',
  'Asoebi Groups', 'Uniforms', 'Fabric Sourcing', 'Ready-to-Wear',
  'Agbada', 'Traditional Wear', 'Contemporary Fashion', 'School Wear',
]

const SERVICES = [
  { icon: '👗', name: 'Custom Outfits', desc: 'Ankara, Aso-Oke, contemporary', img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=800&fit=crop&q=80' },
  { icon: '💍', name: 'Bridal Couture', desc: 'Gowns, asoebi, coordination', img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&fit=crop&q=80' },
  { icon: '✂️', name: 'Alterations', desc: 'Quick fixes, sizing, hemming', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop&q=80' },
  { icon: '🧵', name: 'Fabric & More', desc: 'Sourcing, uniforms, ready-to-wear', img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop&q=80' },
]

const STEPS = [
  { n: '01', icon: '🔍', title: 'Browse Creatives', desc: 'Filter by city, service, and rating. View real portfolios and customer reviews.' },
  { n: '02', icon: '💬', title: 'Book & Chat', desc: 'Send your order with measurements and style refs. Agree on pricing directly.' },
  { n: '03', icon: '📦', title: 'Track Your Order', desc: 'Live updates at every stage — cutting, sewing, ready, out for delivery.' },
  { n: '04', icon: '⭐', title: 'Rate & Review', desc: 'Confirm delivery, leave a review. Build trust for the whole community.' },
]

const FEATURES = [
  { icon: '📏', title: 'Saved Measurements', desc: 'Store once, use every order. No more measuring tape awkwardness.' },
  { icon: '🚚', title: 'Pickup & Delivery', desc: 'We collect your fabric and deliver the finished outfit to your door.' },
  { icon: '💬', title: 'Direct Chat', desc: 'Message your creative directly with style refs and discuss pricing.' },
  { icon: '📍', title: 'Live Tracking', desc: 'Track every stage from cutting to delivery in real time.' },
  { icon: '⭐', title: 'Mutual Ratings', desc: 'Customers rate creatives. Creatives rate customers. Trust built both ways.' },
  { icon: '🏆', title: 'Hall of Fame', desc: 'Top-rated creatives get featured. Quality is recognised and rewarded.' },
]

const CREATIVES = [
  { name: 'Adaeze Couture', city: 'Lagos', specialty: 'Bridal & Custom', rating: 4.9, orders: 312, init: 'A', grad: 'from-violet-500 to-purple-700', glow: 'shadow-violet-500/30' },
  { name: 'Kemi Stitch & Style', city: 'Abuja', specialty: 'Office & Casual', rating: 4.7, orders: 201, init: 'K', grad: 'from-fuchsia-500 to-pink-600', glow: 'shadow-pink-500/30' },
  { name: 'House of Emeka', city: 'Enugu', specialty: 'Agbada & Suits', rating: 4.5, orders: 120, init: 'E', grad: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/30' },
]

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLElement>(null)

  const onHeroMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const r = heroRef.current?.getBoundingClientRect()
    if (!r) return
    setMouse({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 })
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden selection:bg-violet-200/60"
      style={{ background: 'linear-gradient(135deg, #f3eeff 0%, #ffffff 45%, #fffbf0 100%)', color: '#18181b' }}>
      <ThreeBackground variant="light" />

      {/* ── Floating Navbar ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full px-4 pt-3">
        <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-2xl border border-zinc-200/70 rounded-2xl px-5 h-14 flex items-center justify-between shadow-lg shadow-zinc-200/60">
          <Link href="/"><Logo size="sm" variant="full" /></Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/browse" className="hover:text-zinc-900 transition-colors duration-200">Find Creatives</Link>
            <Link href="/signup?as=tailor" className="hover:text-zinc-900 transition-colors duration-200">Join as Creative</Link>
            <a href="#how-it-works" className="hover:text-zinc-900 transition-colors duration-200">How it works</a>
            <Link href="/hall-of-fame" className="hover:text-amber-600 transition-colors duration-200 font-medium">🏆 Hall of Fame</Link>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden md:block text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-2 rounded-xl hover:bg-zinc-100">
              Log in
            </Link>
            <Link href="/signup" className="gold-shimmer text-black text-sm font-black px-5 py-2.5 rounded-xl hover:scale-[1.04] active:scale-[0.97] transition-transform shadow-lg shadow-amber-500/30">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] flex items-center pt-20 overflow-hidden cursor-default"
        onMouseMove={onHeroMove}
      >
        {/* Animated ambient orbs */}
        <div className="absolute top-0 left-0 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)', transform: `translate(${mouse.x * -30}px, ${mouse.y * -30}px)`, transition: 'transform 0.9s ease-out' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.14) 0%, transparent 65%)', transform: `translate(${mouse.x * 25}px, ${mouse.y * 25}px)`, transition: 'transform 0.9s ease-out' }} />
        <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 65%)', transform: `translate(${mouse.x * -18}px, ${mouse.y * -18}px)`, transition: 'transform 0.7s ease-out' }} />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139,92,246,0.12) 1px, transparent 0)', backgroundSize: '30px 30px' }} />

        <div className="relative w-full max-w-7xl mx-auto px-5 grid lg:grid-cols-2 gap-16 items-center py-24 lg:py-0 min-h-[calc(100svh-5rem)]">

          {/* Text side */}
          <div className="order-2 lg:order-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2.5 bg-violet-50 border border-violet-200 rounded-full px-4 py-2 text-xs w-fit mb-8 fade-up">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-violet-700 font-medium">Nigeria&apos;s #1 fashion marketplace</span>
              <span className="text-amber-600 font-bold">✦ New</span>
            </div>

            <h1 className="text-5xl lg:text-[78px] font-black leading-[0.92] mb-6 tracking-tight fade-up-1">
              <span className="block text-zinc-900">Nigeria&apos;s</span>
              <span
                className="block text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #C68A52, #DEB995, #C68A52, #885F40)', backgroundSize: '200% 100%', animation: 'gold-shimmer 3s ease infinite' }}
              >
                Fashion
              </span>
              <span className="block text-zinc-900">Platform</span>
            </h1>

            <p className="text-base lg:text-lg text-zinc-500 max-w-[440px] mb-10 leading-relaxed fade-up-2">
              Book verified tailors and designers for custom outfits, bridal wear, alterations and more — delivered anywhere in Nigeria.
            </p>

            <div className="flex flex-wrap gap-3.5 mb-12 fade-up-3">
              <Link href="/browse"
                className="group flex items-center gap-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-base px-8 py-4 rounded-2xl transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] shadow-xl shadow-amber-400/35">
                Find a Creative
                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-200" />
              </Link>
              <Link href="/signup?as=tailor"
                className="flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-700 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] shadow-lg shadow-zinc-900/20">
                Join as Creative
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 border-t border-zinc-200 pt-8 fade-up-4">
              {[
                { to: 2400, suffix: '+', label: 'Creatives' },
                { to: 18000, suffix: '+', label: 'Orders' },
                { to: 98, suffix: '%', label: 'Happy clients' },
                { to: 24, suffix: 'h', label: 'Avg reply' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-xl lg:text-2xl font-black text-amber-500 tabular-nums">
                    <CountUp to={s.to} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3D image stack — parallax layers at different depths */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-80 h-[480px] lg:w-[420px] lg:h-[560px]">

              {/* Layer 3 — deepest */}
              <div className="absolute bottom-0 left-0 w-[210px] h-[300px] lg:w-[255px] lg:h-[365px] rounded-3xl overflow-hidden border border-zinc-200 shadow-2xl shadow-zinc-300/50"
                style={{ transform: `rotate(-8deg) translate(${mouse.x * 35}px, ${mouse.y * 22}px)`, transition: 'transform 0.9s ease-out' }}>
                <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=510&h=730&fit=crop&q=85" alt="" className="w-full h-full object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Layer 2 — mid depth */}
              <div className="absolute top-8 left-14 w-[185px] h-[265px] lg:w-[220px] lg:h-[320px] rounded-3xl overflow-hidden border border-violet-200 shadow-2xl shadow-violet-300/40 z-[1]"
                style={{ transform: `rotate(5deg) translate(${mouse.x * 20}px, ${mouse.y * 13}px)`, transition: 'transform 0.75s ease-out' }}>
                <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=440&h=640&fit=crop&q=85" alt="" className="w-full h-full object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              {/* Layer 1 — front */}
              <div className="absolute top-0 right-0 w-[225px] h-[315px] lg:w-[265px] lg:h-[385px] rounded-3xl overflow-hidden border border-zinc-200 shadow-2xl shadow-zinc-300/50 z-[2]"
                style={{ transform: `rotate(3deg) translate(${mouse.x * 8}px, ${mouse.y * 5}px)`, transition: 'transform 0.6s ease-out' }}>
                <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=530&h=770&fit=crop&q=85" alt="" className="w-full h-full object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Floating UI: creative card */}
              <div className="absolute bottom-10 -left-4 lg:-left-10 z-[10] float-y">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-3 border border-zinc-200/80 shadow-2xl shadow-zinc-300/50"
                  style={{ transform: `translate(${mouse.x * -45}px, ${mouse.y * -32}px)`, transition: 'transform 1s ease-out' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">A</div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 whitespace-nowrap">Adaeze Couture</p>
                      <p className="text-[10px] text-zinc-400">⭐ 4.9 · Lagos · Verified</p>
                    </div>
                    <CheckCircle size={14} className="text-violet-500 ml-1 flex-shrink-0" />
                  </div>
                </div>
              </div>

              {/* Floating UI: order notification */}
              <div className="absolute top-6 -left-2 lg:-left-8 z-[10] float-y" style={{ animationDelay: '1.4s' }}>
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl px-3.5 py-2.5 border border-zinc-200/80 shadow-xl shadow-zinc-300/40"
                  style={{ transform: `translate(${mouse.x * -55}px, ${mouse.y * -22}px)`, transition: 'transform 1s ease-out' }}>
                  <p className="text-[10px] text-zinc-400 font-medium">📦 Order update</p>
                  <p className="text-xs text-zinc-900 font-bold mt-0.5">Your outfit is ready! 🎉</p>
                </div>
              </div>

              {/* Floating UI: review */}
              <div className="absolute top-1/2 -translate-y-1/2 -right-2 lg:-right-8 z-[10]">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl px-3.5 py-3 border border-amber-200 shadow-xl shadow-amber-200/50"
                  style={{ transform: `translate(${mouse.x * 50}px, ${mouse.y * 18}px)`, transition: 'transform 1s ease-out' }}>
                  <div className="flex gap-0.5 mb-1.5">
                    {[1,2,3,4,5].map(i => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-[10px] font-bold text-zinc-900">Perfect fit! ✨</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">by Chisom A.</p>
                </div>
              </div>

              {/* Ambient glow */}
              <div className="absolute inset-12 rounded-full bg-violet-300/20 blur-3xl pointer-events-none z-[-1]" />
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 pointer-events-none">
          <div className="w-5 h-8 rounded-full border border-zinc-400 flex items-start justify-center pt-1.5">
            <div className="w-1 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
          </div>
          <span className="text-[10px] text-zinc-400 tracking-widest uppercase">Scroll</span>
        </div>
      </section>

      {/* ── Marquee band ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-y border-violet-100 py-4 bg-violet-50/60">
        <div className="flex marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="flex-shrink-0 flex items-center gap-5 px-7 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <span className="text-violet-400">✦</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Services ─────────────────────────────────────────────────────────── */}
      <section className="py-28 max-w-7xl mx-auto px-5">
        <Reveal className="text-center mb-16">
          <p className="text-xs font-bold tracking-widest text-violet-600 uppercase mb-4">What you can order</p>
          <h2 className="text-4xl lg:text-5xl font-black text-zinc-900">Fashion, made for you</h2>
          <p className="text-zinc-500 mt-4 max-w-md mx-auto text-sm">From Ankara to bridal couture — every style, every occasion, every city in Nigeria.</p>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((s, i) => (
            <Reveal key={s.name} delay={i * 80} y={50}>
              <TiltCard strength={10} className="group block cursor-pointer">
                <Link href="/browse">
                  <div className="relative overflow-hidden rounded-3xl" style={{ aspectRatio: '3/4' }}>
                    <img src={s.img} alt={s.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-12" />
                    </div>
                    <div className="absolute bottom-0 left-0 p-5 z-10">
                      <div className="text-3xl mb-2">{s.icon}</div>
                      <p className="font-bold text-white text-sm leading-tight">{s.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">{s.desc}</p>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <span className="bg-amber-400 text-black text-xs font-black px-3 py-1.5 rounded-full shadow-lg">Book →</span>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-violet-50/50 border-y border-violet-100">
        <div className="max-w-7xl mx-auto px-5">
          <Reveal className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest text-violet-600 uppercase mb-4">Simple process</p>
            <h2 className="text-4xl lg:text-5xl font-black text-zinc-900">From browse to fitted<br className="hidden md:block" /> in 4 steps</h2>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-4 relative">
            <div className="absolute top-[3.2rem] left-[12%] right-[12%] h-px border-t-2 border-dashed border-violet-200 hidden md:block pointer-events-none" />
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 100}>
                <TiltCard strength={8} className="relative bg-white border border-zinc-200 rounded-3xl p-7 group hover:shadow-lg hover:border-violet-200 transition-all duration-300 cursor-default h-full shadow-sm">
                  <div className="absolute top-5 right-5 text-5xl font-black text-violet-100 select-none leading-none">{step.n}</div>
                  <div className="w-14 h-14 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 group-hover:bg-violet-200 transition-all duration-300">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-zinc-900 mb-2 text-base">{step.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Creatives ────────────────────────────────────────────────── */}
      <section className="py-28 max-w-7xl mx-auto px-5">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-xs font-bold tracking-widest text-violet-600 uppercase mb-4">Featured creatives</p>
            <h2 className="text-4xl font-black text-zinc-900">Meet Nigeria&apos;s<br />finest tailors</h2>
          </div>
          <Link href="/browse" className="group flex items-center gap-2 text-violet-600 hover:text-violet-700 font-bold text-sm transition-colors whitespace-nowrap">
            View all creatives <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          {CREATIVES.map((c, i) => (
            <Reveal key={c.name} delay={i * 100}>
              <TiltCard strength={8} className="group relative bg-white border border-zinc-200 rounded-3xl overflow-hidden cursor-default hover:shadow-lg hover:border-violet-200 transition-all duration-300 h-full shadow-sm">
                {/* Pattern header */}
                <div className={`h-28 bg-gradient-to-br ${c.grad} relative overflow-hidden`}>
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px', opacity: 0.25 }} />
                </div>
                <div className="px-6 pb-6">
                  <div className="-mt-8 mb-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-white text-2xl font-black shadow-xl ${c.glow} border-4 border-white`}>
                      {c.init}
                    </div>
                  </div>
                  <h3 className="font-bold text-zinc-900 text-lg">{c.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                    <span className="flex items-center gap-1"><MapPin size={11} />{c.city}</span>
                    <span>· {c.specialty}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-5 pt-4 border-t border-zinc-100">
                    <div>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm"><Star size={12} className="fill-amber-500" />{c.rating}</div>
                      <div className="text-[10px] text-zinc-400">rating</div>
                    </div>
                    <div>
                      <div className="text-zinc-900 font-bold text-sm">{c.orders}</div>
                      <div className="text-[10px] text-zinc-400">orders</div>
                    </div>
                    <Link href="/browse" className="ml-auto flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full transition-colors">
                      View <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Features bento ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-violet-50/50 border-y border-violet-100">
        <div className="max-w-7xl mx-auto px-5">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-violet-600 uppercase mb-4">Platform features</p>
            <h2 className="text-4xl font-black text-zinc-900">Built for Nigerian fashion</h2>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 70} className={i === 0 || i === 5 ? 'col-span-2 md:col-span-1' : ''}>
                <TiltCard strength={6} className="bg-white border border-zinc-200 rounded-3xl p-7 group hover:shadow-lg hover:border-violet-200 transition-all duration-300 h-full cursor-default shadow-sm">
                  <div className="text-4xl mb-5 transition-transform duration-300 group-hover:scale-110 origin-left">{f.icon}</div>
                  <h3 className="font-bold text-zinc-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats band ───────────────────────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-5">
        <TiltCard strength={4} className="relative rounded-3xl overflow-hidden p-12 lg:p-16 cursor-default"
          style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 40%, #7c3aed 70%, #5b21b6 100%)' }}>
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/[0.07] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl lg:text-5xl font-black text-white">Growing every day</h2>
            <p className="text-violet-200/70 mt-3 text-sm">Real numbers. Real fashion. Real Nigeria.</p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative">
            {[
              { to: 2400, suffix: '+', label: 'Verified Creatives', Icon: Users },
              { to: 18000, suffix: '+', label: 'Orders Completed', Icon: Package },
              { to: 4800, suffix: '', label: 'Happy Reviews', Icon: Star },
              { to: 36, suffix: '+', label: 'States Covered', Icon: MapPin },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 120}>
                <div className="text-4xl lg:text-5xl font-black text-amber-300 mb-2 tabular-nums">
                  <CountUp to={s.to} suffix={s.suffix} />
                </div>
                <div className="text-sm text-violet-200/70">{s.label}</div>
              </Reveal>
            ))}
          </div>
        </TiltCard>
      </section>

      {/* ── Dual CTA ─────────────────────────────────────────────────────────── */}
      <section className="pb-28 max-w-7xl mx-auto px-5">
        <div className="grid md:grid-cols-2 gap-5">

          <Reveal>
            <TiltCard strength={6} className="relative overflow-hidden rounded-3xl p-10 border border-violet-200 h-full cursor-default"
              style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)' }}>
              <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-violet-400/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #7c3aed 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-violet-100 border border-violet-300 rounded-full px-3.5 py-1.5 text-xs font-bold text-violet-800 mb-6">
                  <Users size={12} /> For customers
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-violet-950 mb-3 leading-tight">Find your perfect<br />creative today</h3>
                <p className="text-violet-700/60 text-sm mb-8 leading-relaxed">Browse hundreds of verified creatives across Lagos, Abuja, Port Harcourt and all of Nigeria.</p>
                <Link href="/browse"
                  className="group inline-flex items-center gap-2.5 bg-violet-700 hover:bg-violet-600 text-white font-black px-7 py-3.5 rounded-2xl transition-all hover:scale-[1.04] shadow-xl shadow-violet-700/30">
                  Browse Creatives <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </TiltCard>
          </Reveal>

          <Reveal delay={80}>
            <TiltCard strength={6} className="relative overflow-hidden rounded-3xl p-10 border border-amber-200 h-full cursor-default"
              style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)' }}>
              <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(217,119,6,0.8) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 rounded-full px-3.5 py-1.5 text-xs font-bold text-amber-800 mb-6">
                  <Zap size={12} /> For creatives
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-amber-950 mb-3 leading-tight">Turn your skill<br />into income</h3>
                <p className="text-amber-800/50 text-sm mb-8 leading-relaxed">Get verified, build your portfolio, and reach thousands of customers ready to book today.</p>
                <Link href="/signup?as=tailor"
                  className="group inline-flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black px-7 py-3.5 rounded-2xl transition-all hover:scale-[1.04] shadow-xl shadow-amber-500/30">
                  Start Taking Orders <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200 py-14 bg-white/60">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="mb-4"><Logo size="md" variant="full" /></div>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                Nigeria&apos;s premier fashion marketplace. Connecting skilled creatives with customers who deserve a perfect fit.
              </p>
            </div>
            <div>
              <h4 className="text-zinc-900 font-bold text-sm mb-5">Platform</h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li><Link href="/browse" className="hover:text-zinc-900 transition-colors">Find Creatives</Link></li>
                <li><Link href="/orders/asoebi" className="hover:text-zinc-900 transition-colors">Asoebi Group Orders</Link></li>
                <li><Link href="/signup?as=tailor" className="hover:text-zinc-900 transition-colors">Join as Creative</Link></li>
                <li><Link href="/hall-of-fame" className="hover:text-amber-600 transition-colors">Hall of Fame</Link></li>
                <li><a href="#how-it-works" className="hover:text-zinc-900 transition-colors">How it works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-900 font-bold text-sm mb-5">Legal</h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li><Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-400">© 2026 TailorNow. All rights reserved.</p>
            <p className="text-xs text-zinc-400">Built by <span className="text-violet-600 font-semibold">Folub and Samuel Labs</span></p>
          </div>
        </div>
      </footer>

    </div>
  )
}
