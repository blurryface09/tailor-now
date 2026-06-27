'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'
import { SERVICE_LABELS, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { TailorProfile, TailorService, Measurements, Profile } from '@/types'
import { MapPin, ChevronRight } from 'lucide-react'

type Step = 'service' | 'details' | 'measurements' | 'payment' | 'confirm'

function NewOrderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tailorId = searchParams.get('tailor')
  const serviceId = searchParams.get('service')
  const supabase = createClient()

  const [step, setStep] = useState<Step>('service')
  const [loading, setLoading] = useState(false)
  const [tailor, setTailor] = useState<(TailorProfile & { profile: Profile }) | null>(null)
  const [services, setServices] = useState<TailorService[]>([])
  const [measurements, setMeasurements] = useState<Measurements | null>(null)
  const [selectedService, setSelectedService] = useState<TailorService | null>(null)
  const [customPrice, setCustomPrice] = useState('')
  const [styleRefs, setStyleRefs] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '', description: '', delivery_type: 'pickup_delivery',
    pickup_address: '', delivery_address: '', deadline: '', notes: '',
  })

  useEffect(() => {
    if (!tailorId) return
    Promise.all([
      supabase.from('tailor_profiles').select('*, profile:profiles(*)').eq('id', tailorId).single(),
      supabase.from('tailor_services').select('*').eq('tailor_id', tailorId).eq('is_active', true),
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return { data: null, error: null }
        return supabase.from('measurements').select('*').eq('user_id', user.id).single()
      }),
    ]).then(([{ data: t }, { data: s }, mResult]) => {
      setTailor(t)
      setServices(s || [])
      setMeasurements((mResult as { data: Measurements | null }).data || null)
      if (serviceId) setSelectedService(s?.find(x => x.id === serviceId) || null)
    })
  }, [tailorId, serviceId])

  const handleSubmit = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please log in first'); router.push('/login'); return }

    const agreedPrice = customPrice ? parseFloat(customPrice) : selectedService?.base_price || 0
    const deposit = Math.round(agreedPrice * 0.5)

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
      agreed_price: agreedPrice || null,
      deposit_amount: agreedPrice ? deposit : null,
      balance_amount: agreedPrice ? agreedPrice - deposit : null,
      deadline: form.deadline || null,
      notes: form.notes || null,
      style_reference_urls: styleRefs,
      status: 'pending',
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    // Fire WhatsApp notification to tailor (non-blocking)
    fetch('/api/notifications/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, event: 'new_order' }),
    }).catch(() => {})

    if (agreedPrice > 0) {
      await initPaystack(order.id, deposit, user.email || '')
    } else {
      toast.success('Order placed! Tailor will send a price quote.')
      router.push(`/orders/${order.id}`)
    }
  }

  const initPaystack = async (orderId: string, amount: number, email: string) => {
    const res = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount, email, type: 'deposit' }),
    })
    const { authorization_url } = await res.json()
    if (authorization_url) window.location.href = authorization_url
  }

  const steps: Step[] = ['service', 'details', 'measurements', 'payment', 'confirm']
  const stepIndex = steps.indexOf(step)

  if (!tailorId) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="text-center py-20 text-gray-500">No tailor selected. <a href="/browse" className="text-violet-700 underline">Browse tailors</a></div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= stepIndex ? 'bg-violet-700 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < stepIndex ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-8 transition-colors ${i < stepIndex ? 'bg-violet-700' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {/* Tailor info */}
          {tailor && (
            <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold">
                {tailor.business_name?.[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{tailor.business_name}</p>
                <p className="text-xs text-gray-500">{tailor.city}, {tailor.state}</p>
              </div>
            </div>
          )}

          {/* Step: Select service */}
          {step === 'service' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">What do you need?</h2>
              <div className="space-y-3">
                {services.map(s => (
                  <button key={s.id} onClick={() => setSelectedService(s)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedService?.id === s.id ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{s.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{SERVICE_LABELS[s.service_type]} • {s.min_days}–{s.max_days} days</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-violet-700">{formatCurrency(s.base_price)}</p>
                        {s.price_negotiable && <p className="text-xs text-gray-400">Negotiable</p>}
                      </div>
                    </div>
                  </button>
                ))}
                <button onClick={() => setSelectedService(null)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${!selectedService ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="font-medium text-gray-900">Custom / Other request</p>
                  <p className="text-xs text-gray-500 mt-0.5">Describe what you need and agree on price via chat</p>
                </button>
              </div>
              <Button className="w-full mt-6" size="lg" onClick={() => setStep('details')}>
                Continue <ChevronRight size={16} />
              </Button>
            </div>
          )}

          {/* Step: Order details */}
          {step === 'details' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order details</h2>
              <div className="space-y-4">
                <Input label="Order title" placeholder="e.g. Aso-oke suit for wedding" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px]"
                    placeholder="Describe what you want in detail — fabric color, style, occasion, etc."
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery preference</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ val: 'pickup_delivery', label: '🚚 Pickup & Delivery', sub: 'We come to you' },
                      { val: 'visit_shop', label: '🏪 Visit Shop', sub: 'You go to tailor' }].map(opt => (
                      <button key={opt.val} onClick={() => setForm(f => ({ ...f, delivery_type: opt.val }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${form.delivery_type === opt.val ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.sub}</p>
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
                  bucket="order-refs"
                  folder={`refs`}
                  value={styleRefs}
                  onChange={setStyleRefs}
                  maxFiles={4}
                  label="Style reference photos (optional)"
                  hint="Upload inspiration photos — fabric patterns, style photos, magazine cuts, etc."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('service')}>Back</Button>
                <Button size="lg" className="flex-1" onClick={() => setStep('measurements')} disabled={!form.title || !form.description}>
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Measurements */}
          {step === 'measurements' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Your measurements</h2>
              <p className="text-sm text-gray-500 mb-4">These will be shared with the tailor</p>

              {measurements ? (
                <div className="grid grid-cols-2 gap-3 p-4 bg-violet-50 rounded-xl mb-4">
                  {Object.entries({
                    Chest: measurements.chest, Waist: measurements.waist, Hips: measurements.hips,
                    Inseam: measurements.inseam, Shoulder: measurements.shoulder,
                    'Sleeve length': measurements.sleeve_length, Neck: measurements.neck,
                  }).filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-sm font-medium text-gray-900">{value} inches</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                  <p className="text-sm text-amber-800">No saved measurements found.</p>
                  <a href="/profile#measurements" className="text-sm text-violet-700 font-medium underline">Add measurements to your profile →</a>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional notes for tailor</label>
                <textarea className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[80px]"
                  placeholder="Any extra notes, fabric preferences, inspirations..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('details')}>Back</Button>
                <Button size="lg" className="flex-1" onClick={() => setStep('payment')}>
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Price & payment */}
          {step === 'payment' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Price & payment</h2>

              {selectedService ? (
                <div className="p-4 bg-violet-50 rounded-xl mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{selectedService.title}</p>
                      <p className="text-xs text-gray-500">Base price</p>
                    </div>
                    <p className="text-lg font-bold text-violet-700">{formatCurrency(selectedService.base_price)}</p>
                  </div>
                  {selectedService.price_negotiable && (
                    <div className="mt-3 pt-3 border-t border-violet-200">
                      <Input label="Custom agreed price (optional)" type="number" placeholder={`Default: ₦${selectedService.base_price}`}
                        value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
                      <p className="text-xs text-gray-400 mt-1">Leave blank to use base price</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-4">
                  <Input label="Agreed price with tailor (optional)" type="number" placeholder="Leave blank to negotiate via chat"
                    value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
                  <p className="text-xs text-gray-500 mt-1">You can also send the order and agree on price via chat</p>
                </div>
              )}

              {(customPrice || selectedService?.base_price) && parseFloat(customPrice || String(selectedService?.base_price || 0)) > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm mb-4">
                  {(() => {
                    const total = parseFloat(customPrice || String(selectedService?.base_price || 0))
                    const deposit = Math.round(total * 0.5)
                    return (
                      <>
                        <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-medium">{formatCurrency(total)}</span></div>
                        <div className="flex justify-between text-violet-700"><span>50% deposit now</span><span className="font-bold">{formatCurrency(deposit)}</span></div>
                        <div className="flex justify-between text-gray-500"><span>Balance on delivery</span><span>{formatCurrency(total - deposit)}</span></div>
                      </>
                    )
                  })()}
                </div>
              )}

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
              <h2 className="text-lg font-bold text-gray-900 mb-4">Review & place order</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Service', value: selectedService?.title || 'Custom request' },
                  { label: 'Description', value: form.description },
                  { label: 'Delivery', value: form.delivery_type === 'pickup_delivery' ? 'Pickup & Delivery' : 'Visit Shop' },
                  { label: 'Deadline', value: form.deadline || 'Flexible' },
                ].map(row => (
                  <div key={row.label} className="flex gap-3 py-2 border-b border-gray-100">
                    <span className="text-gray-500 w-24 flex-shrink-0">{row.label}</span>
                    <span className="text-gray-900 font-medium">{row.value}</span>
                  </div>
                ))}
                {styleRefs.length > 0 && (
                  <div className="pt-2">
                    <p className="text-gray-500 mb-2">Style refs</p>
                    <div className="flex gap-2 flex-wrap">
                      {styleRefs.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-violet-50 border border-violet-200 rounded-xl text-sm text-violet-800">
                {customPrice || selectedService?.base_price
                  ? `Paystack will collect 50% deposit of ${formatCurrency(Math.round(parseFloat(customPrice || String(selectedService?.base_price || 0)) * 0.5))} securely.`
                  : 'Order will be sent to the tailor. Agree on price via chat before payment.'}
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
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full" /></div>}>
      <NewOrderContent />
    </Suspense>
  )
}
