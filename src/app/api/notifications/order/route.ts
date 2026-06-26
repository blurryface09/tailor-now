import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const { orderId, event } = await req.json()
  if (!orderId || !event) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, customer:profiles!orders_customer_id_fkey(*), tailor_profile:tailor_profiles!orders_tailor_id_fkey(*, profile:profiles(*))')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const customer = order.customer
  const tailorProfile = order.tailor_profile
  const tailorUser = tailorProfile?.profile

  try {
    switch (event) {
      case 'new_order':
        await WhatsApp.newOrder(
          { phone: tailorUser?.phone, business_name: tailorProfile?.business_name },
          { id: order.id, title: order.title, customer_name: customer?.full_name }
        )
        break
      case 'order_accepted':
        await WhatsApp.orderAccepted(
          { phone: customer?.phone },
          { id: order.id, title: order.title, tailor_name: tailorProfile?.business_name }
        )
        break
      case 'deposit_paid':
        await WhatsApp.depositPaid(
          { phone: tailorUser?.phone },
          { id: order.id, title: order.title, deposit: order.deposit_amount || 0 }
        )
        break
      case 'status_update':
        await WhatsApp.orderStatusUpdate(
          { phone: customer?.phone },
          { id: order.id, title: order.title, status: order.status }
        )
        break
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[WhatsApp notification error]', err)
    return NextResponse.json({ ok: false })
  }
}
