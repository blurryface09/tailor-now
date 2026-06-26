import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, formatCurrency, formatDate } from '@/lib/utils'
import { Scissors } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CustomerOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase.from('orders')
    .select('*, tailor:tailor_profiles(business_name, city)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <Link href="/browse" className="bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-violet-800 transition-colors">
            + New Order
          </Link>
        </div>

        {(!orders || orders.length === 0) ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">✂️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Browse tailors and place your first order</p>
            <Link href="/browse" className="bg-violet-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-800 transition-colors">
              Find a Tailor
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-sm p-5 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-700">
                      <Scissors size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{order.title}</p>
                      <p className="text-sm text-gray-500">{order.tailor?.business_name} • {formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    {order.agreed_price && (
                      <p className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(order.agreed_price)}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
