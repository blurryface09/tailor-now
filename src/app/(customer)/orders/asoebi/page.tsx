'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Users, Plus, Trash2, ChevronRight, Crown, Shirt } from 'lucide-react'

interface Member {
  name: string
  phone: string
  measurements: string
}

export default function AseobiOrderPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<'details' | 'members' | 'confirm'>('details')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    event_name: '',
    tailor_id: '',
    fabric_color: '',
    style_description: '',
    deadline: '',
    price_per_member: '',
  })

  const [members, setMembers] = useState<Member[]>([
    { name: '', phone: '', measurements: '' },
    { name: '', phone: '', measurements: '' },
  ])

  const addMember = () => setMembers(m => [...m, { name: '', phone: '', measurements: '' }])
  const removeMember = (i: number) => setMembers(m => m.filter((_, idx) => idx !== i))
  const updateMember = (i: number, field: keyof Member, value: string) =>
    setMembers(m => m.map((mem, idx) => idx === i ? { ...mem, [field]: value } : mem))

  const validMembers = members.filter(m => m.name.trim())
  const totalPrice = validMembers.length * (parseFloat(form.price_per_member) || 0)

  const handleSubmit = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please log in first'); router.push('/login'); return }

    // Create a single group order representing the whole asoebi booking
    const { data: order, error } = await supabase.from('orders').insert({
      customer_id: user.id,
      tailor_id: form.tailor_id || null,
      service_type: 'asoebi',
      title: `Asoebi — ${form.event_name}`,
      description: `Group asoebi order for ${validMembers.length} members.\n\nStyle: ${form.style_description}\nFabric color: ${form.fabric_color}\n\nMembers:\n${validMembers.map((m, i) => `${i + 1}. ${m.name} (${m.phone}) — ${m.measurements}`).join('\n')}`,
      delivery_type: 'pickup_delivery',
      agreed_price: totalPrice || null,
      deposit_amount: totalPrice ? Math.round(totalPrice * 0.5) : null,
      balance_amount: totalPrice ? Math.round(totalPrice * 0.5) : null,
      deadline: form.deadline || null,
      notes: `${validMembers.length} members, ₦${form.price_per_member} per member`,
      status: 'pending',
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    toast.success(`Asoebi order placed for ${validMembers.length} members!`)
    router.push(`/orders/${order.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 page-enter">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
            👗
          </div>
          <h1 className="text-2xl font-black text-gray-900">Asoebi Group Order</h1>
          <p className="text-gray-500 mt-1">Coordinate outfits for your whole group — weddings, parties, events</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {(['details', 'members', 'confirm'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === s || (s === 'details' && step !== 'details') || (s === 'members' && step === 'confirm') ? 'bg-violet-700 text-white scale-110 shadow-sm' : 'bg-gray-200 text-gray-500'}`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`w-12 h-0.5 transition-colors ${(s === 'details' && step !== 'details') || (s === 'members' && step === 'confirm') ? 'bg-violet-700' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">

          {/* Step 1: Event details */}
          {step === 'details' && (
            <div className="space-y-4 fade-up">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={18} className="text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900">Event details</h2>
              </div>
              <Input label="Event name" placeholder="e.g. Adaeze and Emeka's wedding" value={form.event_name}
                onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))} required />
              <Input label="Fabric colour" placeholder="e.g. Royal blue Ankara, Gold George" value={form.fabric_color}
                onChange={e => setForm(f => ({ ...f, fabric_color: e.target.value }))} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Style description</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 min-h-[90px] transition-all"
                  placeholder="Describe the style — blouse and wrapper, agbada, gown, etc. Include any photos or inspo links."
                  value={form.style_description}
                  onChange={e => setForm(f => ({ ...f, style_description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Event date" type="date" value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                <Input label="Price per member (optional)" type="number" placeholder="₦0"
                  value={form.price_per_member} onChange={e => setForm(f => ({ ...f, price_per_member: e.target.value }))} />
              </div>
              <Button className="w-full mt-2" size="lg"
                disabled={!form.event_name || !form.fabric_color || !form.style_description}
                onClick={() => setStep('members')}>
                Add members <ChevronRight size={16} />
              </Button>
            </div>
          )}

          {/* Step 2: Members */}
          {step === 'members' && (
            <div className="fade-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-violet-600" />
                  <h2 className="text-lg font-bold text-gray-900">Group members</h2>
                </div>
                <span className="text-sm text-violet-600 font-semibold bg-violet-50 px-3 py-1 rounded-full">
                  {validMembers.length} added
                </span>
              </div>

              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
                {members.map((m, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 scale-in">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                        Member {i + 1}
                      </span>
                      {members.length > 2 && (
                        <button onClick={() => removeMember(i)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                        placeholder="Full name" value={m.name} onChange={e => updateMember(i, 'name', e.target.value)} />
                      <input className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                        placeholder="Phone number" value={m.phone} onChange={e => updateMember(i, 'phone', e.target.value)} />
                      <input className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                        placeholder="Measurements (e.g. 36 bust, 32 waist)" value={m.measurements} onChange={e => updateMember(i, 'measurements', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addMember}
                className="w-full py-3 border-2 border-dashed border-violet-200 text-violet-600 text-sm font-semibold rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-all flex items-center justify-center gap-2">
                <Plus size={16} /> Add another member
              </button>

              {form.price_per_member && (
                <div className="mt-4 p-4 bg-violet-50 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{validMembers.length} members × {formatCurrency(parseFloat(form.price_per_member))}</span>
                    <span className="font-bold text-violet-700">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>50% deposit now</span>
                    <span className="font-medium">{formatCurrency(Math.round(totalPrice * 0.5))}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('details')}>Back</Button>
                <Button size="lg" className="flex-1" disabled={validMembers.length < 2} onClick={() => setStep('confirm')}>
                  Review order <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="fade-up">
              <div className="flex items-center gap-2 mb-4">
                <Shirt size={18} className="text-violet-600" />
                <h2 className="text-lg font-bold text-gray-900">Review and place order</h2>
              </div>

              <div className="space-y-3 text-sm mb-5">
                {[
                  { label: 'Event', value: form.event_name },
                  { label: 'Fabric', value: form.fabric_color },
                  { label: 'Members', value: `${validMembers.length} people` },
                  { label: 'Event date', value: form.deadline || 'Flexible' },
                  { label: 'Total', value: totalPrice ? formatCurrency(totalPrice) : 'To be agreed' },
                ].map(row => (
                  <div key={row.label} className="flex gap-3 py-2 border-b border-gray-100">
                    <span className="text-gray-500 w-24 flex-shrink-0">{row.label}</span>
                    <span className="text-gray-900 font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 mb-5">
                <p className="font-semibold mb-1">How group Asoebi orders work</p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                  <li>You pay the 50% deposit to secure the tailor</li>
                  <li>Tailor contacts each member for fittings</li>
                  <li>Balance paid when all outfits are delivered</li>
                  <li>Extra 2% platform fee applies to group orders</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('members')}>Back</Button>
                <Button size="lg" className="flex-1" loading={loading} onClick={handleSubmit}>
                  Place group order
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
