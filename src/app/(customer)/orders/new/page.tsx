'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'
import { SERVICE_LABELS, formatCurrency } from '@/lib/utils'
import { FABRIC_TYPE_LABELS } from '@/types'
import toast from 'react-hot-toast'
import type { TailorProfile, TailorService, Measurements, Profile, Fabric, Post } from '@/types'
import { MapPin, ChevronRight, CheckCircle2 } from 'lucide-react'

type Step = 'service' | 'details' | 'fabric' | 'measurements' | 'payment' | 'confirm'

function NewOrderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tailorId = searchParams.get('tailor')
  const serviceId = searchParams.get('service')
  const postId = searchParams.get('post')
  const isCustomOrder = searchParams.get('custom') === 'true'
  const supabase = createClient()

  const [step, setStep] = useState<Step>('service')
  const [loading, setLoading] = useState(false)
  const [tailor, setTailor] = useState<(TailorProfile & { profile: Profile }) | null>(null)
  const [services, setServices] = useState<TailorService[]>([])
  const [measurements, setMeasurements] = useState<Measurements | null>(null)
  const [selectedService, setSelectedService] = useState<TailorService | null>(null)
  const [fitPost, setFitPost] = useState<Post | null>(null)
  const [directOrderError, setDirectOrderError] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [styleRefs, setStyleRefs] = useState<string[]>([])

  // fabric step
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [fabricsLoading, setFabricsLoading] = useState(false)
  const [fabricSource, setFabricSource] = useState<'tailornow' | 'customer_own'>('customer_own')
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null)
  const [fabricYards, setFabricYards] = useState('')
  const [fabricFilter, setFabricFilter] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', delivery_type: 'pickup_delivery',
    pickup_address: '', delivery_address: '', deadline: '', notes: '',
  })
  const directOrderStarted = useRef(false)

  useEffect(() => {
    if (!tailorId) return
    Promise.all([
      supabase.from('tailor_profiles').select('*, profile:profiles(*)').eq('id', tailorId).single(),
      supabase.from('tailor_services').select('*').eq('tailor_id', tailorId).eq('is_active', true),
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return { data: null }
        return supabase.from('measurements').select('*').eq('user_id', user.id).single()
      }),
      postId ? supabase.from('posts').select('*').eq('id', postId).single() : Promise.resolve({ data: null }),
    ]).then(([{ data: t }, { data: s }, mResult, postResult]) => {
      setTailor(t)
      setServices(s || [])
      setMeasurements((mResult as { data: Measurements | null }).data || null)
      if (serviceId) setSelectedService(s?.find(x => x.id === serviceId) || null)
      const productPost = (postResult as { data: Post | null }).data || null
      if (productPost) {
        setFitPost(productPost)
        setStyleRefs(productPost.image_urls || [])
        setForm(f => ({
          ...f,
          title: productPost.title ? `Order: ${productPost.title}` : 'Order this fit',
          description: [
            productPost.title ? `I want this exact fit: ${productPost.title}.` : 'I want this exact fit from the uploaded photo.',
            productPost.caption ? `Notes from creative: ${productPost.caption}` : '',
          ].filter(Boolean).join('\n\n'),
        }))
      }
    })
  }, [tailorId, serviceId, postId])

  const loadFabrics = async () => {
    setFabricsLoading(true)
    const { data } = await supabase.from('fabrics').select('*').eq('is_available', true).order('fabric_type')
    setFabrics(data || [])
    setFabricsLoading(false)
  }

  const goToFabric = () => {
    setStep('fabric')
    if (fabrics.length === 0) loadFabrics()
  }

  const fabricCost = selectedFabric && fabricYards
    ? selectedFabric.price_per_yard * parseFloat(fabricYards || '0')
    : 0

  const displayedFabrics = fabricFilter
    ? fabrics.filter(f => f.fabric_type === fabricFilter)
    : fabrics

  const handleSubmit = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please log in first'); router.push('/login'); return }

    const offerPrice = customPrice ? parseFloat(customPrice) : selectedService?.base_price || null

    const { data: order, error } = await supabase.from('orders').insert({
      customer_id: user.id,
      tailor_id: tailorId,
      service_id: selectedService?.id || null,
      service_type: selectedService?.service_type || 'custom_outfit',
      title: form.title,
      description: form.description,
      delivery_type: form.delivery_type,
      pickup_address: form.pickup_address || null,
      delivery_address: form.delivery_address || null,
      customer_offer: offerPrice || null,
      agreed_price: null,
      deadline: form.deadline || null,
      notes: form.notes || null,
      style_reference_urls: styleRefs,
      fabric_source: fabricSource,
      fabric_id: fabricSource === 'tailornow' && selectedFabric ? selectedFabric.id : null,
      fabric_yards: fabricSource === 'tailornow' && fabricYards ? parseFloat(fabricYards) : null,
      status: 'pending',
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    fetch('/api/notifications/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, event: 'new_order' }),
    }).catch(() => {})

    toast.success('Order sent! Creative will review and respond with a price.')
    router.push(`/orders/${order.id}`)
    setLoading(false)
  }

  const createDirectFitOrder = useCallback(async (productPost: Post) => {
    setLoading(true)
    setDirectOrderError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please log in first')
      router.push(`/login?next=${encodeURIComponent(`/orders/new?tailor=${tailorId}&post=${productPost.id}`)}`)
      return
    }

    const price = Number(productPost.price)
    if (!price || price <= 0) {
      setStep('details')
      setLoading(false)
      return
    }

    const title = productPost.title ? `Order: ${productPost.title}` : 'Order this fit'
    const description = [
      productPost.title ? `Customer ordered this exact uploaded fit: ${productPost.title}.` : 'Customer ordered this exact uploaded fit.',
      productPost.caption ? `Creative caption: ${productPost.caption}` : '',
      `Product link: /p/${productPost.id}`,
    ].filter(Boolean).join('\n\n')

    const { data: order, error } = await supabase.from('orders').insert({
      customer_id: user.id,
      tailor_id: tailorId,
      service_id: null,
      service_type: productPost.service_type || 'custom_outfit',
      title,
      description,
      delivery_type: 'pickup_delivery',
      customer_offer: price,
      agreed_price: price,
      style_reference_urls: productPost.image_urls || [],
      fabric_source: 'customer_own',
      status: 'accepted',
    }).select().single()

    if (error) {
      setDirectOrderError(error.message)
      toast.error(error.message)
      setLoading(false)
      return
    }

    fetch('/api/notifications/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, event: 'new_order' }),
    }).catch(() => {})

    toast.success('Fit selected. Complete payment to place the order.')
    router.push(`/orders/${order.id}#payment`)
  }, [router, supabase, tailorId])

  useEffect(() => {
    if (!fitPost || !tailorId || isCustomOrder || directOrderStarted.current || !fitPost.price) return
    directOrderStarted.current = true
    createDirectFitOrder(fitPost)
  }, [fitPost, tailorId, isCustomOrder, createDirectFitOrder])

  const steps: Step[] = ['service', 'details', 'fabric', 'measurements', 'payment', 'confirm']
  const stepIndex = steps.indexOf(step)
  const stepLabels: Record<Step, string> = {
    service: 'Service', details: 'Details', fabric: 'Fabric',
    measurements: 'Fit', payment: 'Offer', confirm: 'Confirm',
  }

  if (!tailorId) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="text-center py-20 text-zinc-500">
        No creative selected. <a href="/browse" className="text-violet-400 underline">Browse creatives</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
      </div>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {fitPost?.price && !isCustomOrder && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
            <div className="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
            <h1 className="text-lg font-black text-zinc-900">Preparing this fit for checkout</h1>
            <p className="mt-1 text-sm text-zinc-600">We are creating the order from this exact upload and taking you straight to payment.</p>
            {directOrderError && <p className="mt-3 text-sm font-semibold text-red-600">{directOrderError}</p>}
          </div>
        )}

        {fitPost?.price && !isCustomOrder ? null : (
        <>
        {/* Progress */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < stepIndex ? 'bg-violet-700 text-white' : i === stepIndex ? 'bg-violet-600 text-white ring-2 ring-violet-400/40' : 'bg-white/[0.08] text-zinc-500'}`}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] font-semibold transition-colors ${i === stepIndex ? 'text-violet-400' : 'text-zinc-600'}`}>{stepLabels[s]}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-6 mb-4 transition-colors flex-shrink-0 ${i < stepIndex ? 'bg-violet-700' : 'bg-white/[0.08]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          {/* Creative info */}
          {tailor && (
            <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-lg">
                {tailor.business_name?.[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{tailor.business_name}</p>
                <p className="text-xs text-zinc-500">{tailor.city}, {tailor.state}</p>
              </div>
            </div>
          )}

          {/* Step: Select service */}
          {step === 'service' && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-4">{fitPost ? 'Confirm this fit request' : 'What do you need?'}</h2>
              {fitPost && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-zinc-900">This request is about the uploaded fit only.</p>
                  <p className="mt-1 text-xs text-zinc-600">No extra custom questions here. The creative will respond with price if none was set.</p>
                </div>
              )}
              {fitPost ? (
                <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-4">
                  <div className="flex gap-3">
                    {fitPost.image_urls?.[0] && (
                      <img src={fitPost.image_urls[0]} alt="" className="h-20 w-16 rounded-xl object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900">{fitPost.title || 'Uploaded fit'}</p>
                      {fitPost.caption && <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-zinc-600">{fitPost.caption}</p>}
                      <p className="mt-2 text-xs font-semibold text-violet-700">You are ordering only this fit.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map(s => (
                    <button key={s.id} onClick={() => setSelectedService(s)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedService?.id === s.id ? 'border-violet-600 bg-violet-500/10' : 'border-white/[0.1] hover:border-violet-500/30'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">{s.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{SERVICE_LABELS[s.service_type]} · {s.min_days}–{s.max_days} days</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-violet-400">{formatCurrency(s.base_price)}</p>
                          {s.price_negotiable && <p className="text-xs text-zinc-600">Negotiable</p>}
                        </div>
                      </div>
                    </button>
                  ))}
                  <button onClick={() => setSelectedService(null)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${!selectedService ? 'border-violet-600 bg-violet-500/10' : 'border-white/[0.1] hover:border-violet-500/30'}`}>
                    <p className="font-medium text-white">Custom / Other request</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Describe what you need and agree on price via chat</p>
                  </button>
                </div>
              )}
              <Button className="w-full mt-6" size="lg" onClick={() => fitPost ? setStep('payment') : setStep('details')}>
                Continue <ChevronRight size={16} />
              </Button>
            </div>
          )}

          {/* Step: Order details */}
          {step === 'details' && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-4">Order details</h2>
              <div className="space-y-4">
                <Input label="Order title" placeholder="e.g. Aso-oke suit for wedding" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
                  <textarea className="w-full rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/60 min-h-[100px] transition-all"
                    placeholder="Describe what you want in detail — style, occasion, colours, etc."
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Delivery preference</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ val: 'pickup_delivery', label: '🚚 Pickup & Delivery', sub: 'We come to you' },
                      { val: 'visit_shop', label: '🏪 Visit Shop', sub: 'You go to them' }].map(opt => (
                      <button key={opt.val} onClick={() => setForm(f => ({ ...f, delivery_type: opt.val }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${form.delivery_type === opt.val ? 'border-violet-600 bg-violet-500/10' : 'border-white/[0.1] hover:border-violet-500/30'}`}>
                        <p className="text-sm font-medium text-white">{opt.label}</p>
                        <p className="text-xs text-zinc-600">{opt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
                {form.delivery_type === 'pickup_delivery' && (
                  <Input label="Pickup address" placeholder="Address to collect fabric from" icon={<MapPin size={16} />}
                    value={form.pickup_address} onChange={e => setForm(f => ({ ...f, pickup_address: e.target.value }))} />
                )}
                <Input label="Delivery address" placeholder="Address to deliver finished item" icon={<MapPin size={16} />}
                  value={form.delivery_address} onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))} />
                <Input label="Deadline (optional)" type="date" value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                <ImageUpload
                  bucket="order-refs" folder="refs" value={styleRefs} onChange={setStyleRefs}
                  maxFiles={4} label="Style reference photos (optional)"
                  hint="Upload inspiration photos — fabric patterns, style photos, magazine cuts…"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('service')}>Back</Button>
                <Button size="lg" className="flex-1" onClick={goToFabric} disabled={!form.title || !form.description}>
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Fabric */}
          {step === 'fabric' && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-1">Fabric sourcing</h2>
              <p className="text-sm text-zinc-500 mb-5">TailorNow can source your fabric — or you can provide your own.</p>

              {/* Source choice */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => setFabricSource('tailornow')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${fabricSource === 'tailornow' ? 'border-amber-500 bg-amber-500/10' : 'border-white/[0.1] hover:border-amber-500/30'}`}>
                  <div className="text-2xl mb-2">🧵</div>
                  <p className="font-bold text-white text-sm">TailorNow sources it</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Pick from our quality-checked catalogue. We handle the rest.</p>
                  {fabricSource === 'tailornow' && <div className="mt-2"><CheckCircle2 size={16} className="text-amber-400" /></div>}
                </button>
                <button onClick={() => { setFabricSource('customer_own'); setSelectedFabric(null); setFabricYards('') }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${fabricSource === 'customer_own' ? 'border-violet-500 bg-violet-500/10' : 'border-white/[0.1] hover:border-violet-500/30'}`}>
                  <div className="text-2xl mb-2">🛍️</div>
                  <p className="font-bold text-white text-sm">I have my own fabric</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">You provide the fabric — the creative just handles production.</p>
                  {fabricSource === 'customer_own' && <div className="mt-2"><CheckCircle2 size={16} className="text-violet-400" /></div>}
                </button>
              </div>

              {/* Catalogue picker */}
              {fabricSource === 'tailornow' && (
                <div style={{ animation: 'fade-up 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
                  {/* Type filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
                    {[['', 'All'], ...Object.entries(FABRIC_TYPE_LABELS)].map(([val, label]) => (
                      <button key={val} onClick={() => setFabricFilter(val)}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${fabricFilter === val ? 'bg-amber-400 text-black border-amber-400' : 'bg-white/[0.04] border-zinc-100 text-zinc-400'}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {fabricsLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => <div key={i} className="bg-white/[0.04] rounded-xl aspect-[4/3] animate-pulse" />)}
                    </div>
                  ) : displayedFabrics.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">No fabrics available yet — check back soon</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 scrollbar-none">
                      {displayedFabrics.map(fabric => (
                        <button key={fabric.id} onClick={() => setSelectedFabric(selectedFabric?.id === fabric.id ? null : fabric)}
                          className={`text-left rounded-xl overflow-hidden border-2 transition-all ${selectedFabric?.id === fabric.id ? 'border-amber-500 shadow-lg shadow-amber-500/10' : 'border-white/[0.07] hover:border-amber-500/30'}`}>
                          <div className="aspect-[4/3] overflow-hidden relative">
                            {fabric.image_urls[0]
                              ? <img src={fabric.image_urls[0]} alt={fabric.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full bg-white/[0.05] flex items-center justify-center">🧵</div>
                            }
                            {selectedFabric?.id === fabric.id && (
                              <div className="absolute inset-0 bg-amber-400/15 flex items-center justify-center">
                                <CheckCircle2 size={24} className="text-amber-400 drop-shadow" />
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="font-semibold text-white text-xs truncate">{fabric.name}</p>
                            <p className="text-amber-400 text-xs font-bold">₦{fabric.price_per_yard.toLocaleString()}/yd</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Yards input */}
                  {selectedFabric && (
                    <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                      style={{ animation: 'fade-up 0.25s ease both' }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-zinc-900">{selectedFabric.name}</p>
                        <p className="text-xs text-zinc-500">min {selectedFabric.min_yards} yds</p>
                      </div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">How many yards do you need?</label>
                      <div className="flex items-center gap-3">
                        <input type="number" min={selectedFabric.min_yards} step="0.5"
                          className="w-28 rounded-xl bg-white border border-amber-300 px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-amber-500/60 transition-all"
                          placeholder={String(selectedFabric.min_yards)}
                          value={fabricYards} onChange={e => setFabricYards(e.target.value)} />
                        <div className="flex-1">
                          {fabricYards && parseFloat(fabricYards) >= selectedFabric.min_yards ? (
                            <div>
                              <p className="text-xs text-zinc-500">Fabric cost</p>
                              <p className="font-black text-amber-400 text-lg">₦{(selectedFabric.price_per_yard * parseFloat(fabricYards)).toLocaleString()}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-600">Common: 3–4 yds for a dress, 5–6 yds for a suit</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {fabricSource === 'customer_own' && (
                <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm text-violet-300"
                  style={{ animation: 'fade-up 0.25s ease both' }}>
                  <p className="font-semibold text-white mb-1">You&apos;re providing your own fabric</p>
                  <p className="text-zinc-400 text-xs leading-relaxed">The creative will contact you to arrange fabric handover. You can add details in the notes during the next steps.</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('details')}>Back</Button>
                <Button size="lg" className="flex-1"
                  disabled={fabricSource === 'tailornow' && (!selectedFabric || !fabricYards || parseFloat(fabricYards) < (selectedFabric?.min_yards || 0))}
                  onClick={() => setStep('measurements')}>
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Measurements */}
          {step === 'measurements' && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-1">Your measurements</h2>
              <p className="text-sm text-zinc-500 mb-4">These will be shared with the creative</p>
              {measurements ? (
                <div className="grid grid-cols-2 gap-3 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl mb-4">
                  {Object.entries({
                    Chest: measurements.chest, Waist: measurements.waist, Hips: measurements.hips,
                    Inseam: measurements.inseam, Shoulder: measurements.shoulder,
                    'Sleeve length': measurements.sleeve_length, Neck: measurements.neck,
                  }).filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-zinc-500">{label}</p>
                      <p className="text-sm font-medium text-white">{value} inches</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                  <p className="text-sm text-amber-300">No saved measurements found.</p>
                  <a href="/profile#measurements" className="text-sm text-violet-400 font-medium underline">Add measurements to your profile →</a>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Additional notes for your creative</label>
                <textarea className="w-full rounded-xl bg-white border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/60 min-h-[80px] transition-all"
                  placeholder="Any extra notes, fit preferences, special instructions…"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('fabric')}>Back</Button>
                <Button size="lg" className="flex-1" onClick={() => setStep('payment')}>
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Your offer */}
          {step === 'payment' && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-1">Make your offer</h2>
              <p className="text-sm text-zinc-500 mb-5">Propose a tailoring price — the creative will accept or counter.</p>

              {selectedService && (
                <div className="flex justify-between items-center p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl mb-4 text-sm">
                  <span className="text-zinc-400">Creative&apos;s listed price</span>
                  <span className="font-bold text-violet-400">{formatCurrency(selectedService.base_price)}</span>
                </div>
              )}

              {fabricSource === 'tailornow' && selectedFabric && fabricCost > 0 && (
                <div className="flex justify-between items-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 text-sm">
                  <span className="text-zinc-400">Fabric cost ({fabricYards} yds of {selectedFabric.name})</span>
                  <span className="font-bold text-amber-400">+{formatCurrency(fabricCost)}</span>
                </div>
              )}

              <div className="relative mb-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-medium text-sm">₦</span>
                <input type="number" min="0"
                  placeholder={selectedService ? String(selectedService.base_price) : 'e.g. 35000'}
                  className="w-full pl-8 pr-4 py-3.5 rounded-xl bg-white/[0.06] border-2 border-white/[0.1] focus:border-violet-500 focus:outline-none text-lg font-semibold text-white transition-all"
                  value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
              </div>
              <p className="text-xs text-zinc-600 mb-4">This is your tailoring offer only — fabric cost is added separately.</p>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
                <strong>How it works:</strong> Your offer is sent to the creative. They&apos;ll accept, counter, or decline. Once you both agree — you pay securely via Paystack.
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('measurements')}>Back</Button>
                <Button size="lg" className="flex-1" onClick={() => setStep('confirm')}>
                  Review Order <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-4">Review & place order</h2>
              <div className="space-y-0">
                {[
                  { label: 'Service', value: selectedService?.title || 'Custom request' },
                  { label: 'Description', value: form.description },
                  { label: 'Delivery', value: form.delivery_type === 'pickup_delivery' ? 'Pickup & Delivery' : 'Visit Shop' },
                  { label: 'Deadline', value: form.deadline || 'Flexible' },
                ].map(row => (
                  <div key={row.label} className="flex gap-3 py-2.5 border-b border-zinc-100">
                    <span className="text-zinc-500 w-24 flex-shrink-0 text-sm">{row.label}</span>
                    <span className="text-white font-medium text-sm">{row.value}</span>
                  </div>
                ))}

                {/* Fabric summary */}
                <div className="flex gap-3 py-2.5 border-b border-zinc-100">
                  <span className="text-zinc-500 w-24 flex-shrink-0 text-sm">Fabric</span>
                  <div>
                    {fabricSource === 'tailornow' && selectedFabric ? (
                      <div className="flex items-center gap-2">
                        {selectedFabric.image_urls[0] && (
                          <img src={selectedFabric.image_urls[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="text-white font-medium text-sm">{selectedFabric.name}</p>
                          <p className="text-xs text-amber-400">{fabricYards} yds · ₦{fabricCost.toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-white font-medium text-sm">Customer provides fabric</span>
                    )}
                  </div>
                </div>
              </div>

              {styleRefs.length > 0 && (
                <div className="pt-3 pb-2">
                  <p className="text-zinc-500 text-sm mb-2">Style refs</p>
                  <div className="flex gap-2 flex-wrap">
                    {styleRefs.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-zinc-100" />
                    ))}
                  </div>
                </div>
              )}

              {/* Price summary */}
              <div className="mt-4 space-y-2">
                {fabricSource === 'tailornow' && selectedFabric && fabricCost > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm">
                    <span className="text-zinc-400">Fabric ({selectedFabric.name})</span>
                    <span className="font-bold text-amber-400">₦{fabricCost.toLocaleString()}</span>
                  </div>
                )}
                {(customPrice || selectedService?.base_price) && (
                  <div className="flex items-center justify-between px-4 py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm">
                    <span className="text-zinc-400">Tailoring offer</span>
                    <span className="font-bold text-violet-400">{formatCurrency(parseFloat(customPrice || String(selectedService?.base_price || 0)))}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
                No payment yet — you&apos;ll pay after the creative accepts your offer.
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('payment')}>Back</Button>
                <Button size="lg" className="flex-1" loading={loading} onClick={handleSubmit}>
                  Place Order 🎉
                </Button>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" /></div>}>
      <NewOrderContent />
    </Suspense>
  )
}
