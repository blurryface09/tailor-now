import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { BroadcastClient } from './broadcast-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Broadcast · Admin · TailorNow' }

export default async function BroadcastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/browse')

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navbar />
      <BroadcastClient />
    </div>
  )
}
