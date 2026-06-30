import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CREATIVE_WELCOME = `Welcome to TailorNow! 🎉

We're excited to have you as part of our creative community. Here's how to get your profile ready so customers can start finding you:

✅ Add your profile photo
✅ Upload a face verification photo (selfie holding today's date)
✅ Add your phone number for customer contact
✅ Enter your full shop address
✅ Set your price range (₦ min – max)
✅ Upload at least 2 portfolio photos of your work

Once all 6 are done, our team will review and verify your profile — verified creatives show a badge that builds customer trust and gets more orders.

Head to your profile settings to complete these now.

Welcome aboard 🧵
– TailorNow Team`

const CUSTOMER_WELCOME = `Welcome to TailorNow! 🎉

You can now discover and book talented fashion creatives across Nigeria — tailors, designers, alterations specialists, and more.

Here's what you can do:
👗 Browse verified creatives near you
💬 Chat directly with creatives about your ideas
📐 Share your measurements for a perfect fit
💳 Pay securely in-app — your money is protected

If you ever need help, just reply to this message.

Happy styling!
– TailorNow Team`

export async function POST(req: NextRequest) {
  const { userId, role } = await req.json()
  if (!userId || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!adminKey) return NextResponse.json({ ok: true }) // silently skip if not configured

  const admin = createAdminClient()

  // Get admin user ID (sekosamuel@gmail.com)
  const { data: adminProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  if (!adminProfile) return NextResponse.json({ ok: true })

  const content = role === 'tailor' ? CREATIVE_WELCOME : CUSTOMER_WELCOME

  // Create/find chat room between admin and new user
  const isCreative = role === 'tailor'
  const roomData = isCreative
    ? { customer_id: adminProfile.id, tailor_id: userId }
    : { customer_id: userId, tailor_id: adminProfile.id }

  const { data: room } = await admin
    .from('chat_rooms')
    .upsert({ ...roomData, last_message: 'Welcome to TailorNow!', last_message_at: new Date().toISOString() }, { onConflict: 'customer_id,tailor_id' })
    .select('id')
    .single()

  if (!room) return NextResponse.json({ ok: true })

  await admin.from('chat_messages').insert({
    room_id: room.id,
    sender_id: adminProfile.id,
    content,
  })

  return NextResponse.json({ ok: true })
}
