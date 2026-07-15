'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { FABRIC_TYPE_LABELS } from '@/types'
import type { Fabric, FabricType } from '@/types'
import { Layers, ShoppingBag, ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'

const TYPE_CHIPS: [string, string][] = [['', 'All fabrics'], ...Object.entries(FABRIC_TYPE_LABELS)]

export default function FabricsPage() {
  const supabase = createClient()
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Fabric | null>(null)

  useEffect(() => {
    supabase.from('fabrics').select('*').eq('is_available', true).order('created_at', { ascending: false })
      .then(({ data }) => { setFabrics(data || []); setLoading(false) })
  }, [])

  const displayed = fabrics
    .filter(f => !filterType || f.fabric_type === filterType)
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.colors.some(c => c.toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-amber-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
      </div>
      <Navbar />

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            <Layers size={13} /> TailorNow Sourced
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 mb-3">
            Our Fabric <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Catalogue</span>
          </h1>
          <p className="text-zinc-500 max-w-lg mx-auto text-sm leading-relaxed">
            Every fabric here is quality-checked and ready to ship. Pick one when placing your order — we source it, you just get dressed.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5 max-w-md mx-auto">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition-all"
            placeholder="Search by name or color…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Type filters */}
        <div className="flex gap-2 flex-wrap justify-center mb-8">
          {TYPE_CHIPS.map(([val, label]) => (
            <button key={val} onClick={() => setFilterType(val)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${filterType === val ? 'bg-amber-400 text-black border-amber-400' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-amber-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-zinc-100 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-zinc-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-zinc-200 rounded w-3/4" />
                  <div className="h-3 bg-zinc-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <div className="text-4xl mb-3">🧵</div>
            <p className="font-medium text-zinc-900 mb-1">No fabrics found</p>
            <p className="text-sm">Try a different filter or check back soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayed.map((fabric, idx) => (
              <button key={fabric.id} onClick={() => setSelected(selected?.id === fabric.id ? null : fabric)}
                className={`group text-left bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm ${selected?.id === fabric.id ? 'border-amber-400 shadow-lg shadow-amber-500/15 scale-[1.02]' : 'border-zinc-200 hover:border-amber-300'}`}
                style={{ animation: 'fade-up 0.4s ease both', animationDelay: `${idx * 30}ms` }}>
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden relative">
                  {fabric.image_urls[0]
                    ? <img src={fabric.image_urls[0]} alt={fabric.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"  loading="lazy"/>
                    : <div className="w-full h-full bg-zinc-50 flex items-center justify-center text-3xl">🧵</div>
                  }
                  {selected?.id === fabric.id && (
                    <div className="absolute inset-0 bg-amber-400/10 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-black font-black text-sm">✓</div>
                    </div>
                  )}
                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold bg-black/60 text-zinc-300 px-2 py-1 rounded-full backdrop-blur-sm capitalize">
                      {FABRIC_TYPE_LABELS[fabric.fabric_type] ?? fabric.fabric_type}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-bold text-zinc-900 text-sm leading-snug mb-0.5">{fabric.name}</p>
                  {fabric.colors.length > 0 && (
                    <p className="text-xs text-zinc-500 mb-1.5 truncate">{fabric.colors.join(' · ')}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400">₦{fabric.price_per_yard.toLocaleString()}/yd</span>
                    <span className="text-xs text-zinc-600">{fabric.yards_in_stock} yds</span>
                  </div>
                  {fabric.description && (
                    <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2 leading-relaxed">{fabric.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected fabric CTA */}
        {selected && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
            style={{ animation: 'fade-up 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div className="bg-zinc-950/95 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-4 shadow-2xl shadow-amber-500/10 flex items-center gap-4">
              {selected.image_urls[0] && (
                <img src={selected.image_urls[0]} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-amber-500/30"  loading="lazy"/>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{selected.name}</p>
                <p className="text-xs text-amber-400 font-semibold">₦{selected.price_per_yard.toLocaleString()}/yd</p>
              </div>
              <Link href="/browse"
                className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black font-black px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex-shrink-0">
                Order <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Bottom info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🔍', title: 'Quality checked', body: 'Every fabric is inspected before it enters the catalogue.' },
            { icon: '📦', title: 'We handle sourcing', body: 'No market runs. We buy it, you pick it at order time.' },
            { icon: '🔄', title: 'Fabric guarantee', body: 'Fades or shrinks? We replace it. No arguments.' },
          ].map(item => (
            <div key={item.title} className="p-5 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-bold text-white text-sm mb-1">{item.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
