// WhatsApp notifications via Twilio — order alerts only.
// All conversations and payments happen inside TailorNow.

const TWILIO_SID  = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || 'https://tailornow.ng'

function nigerianToE164(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('234')) return `+${clean}`
  if (clean.startsWith('0'))   return `+234${clean.slice(1)}`
  return `+234${clean}`
}

async function send(to: string, body: string): Promise<void> {
  if (!TWILIO_SID || !TWILIO_AUTH || TWILIO_SID === 'your_twilio_sid') {
    console.log('[WhatsApp mock]', to, body)
    return
  }
  const phone = nigerianToE164(to)
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: TWILIO_FROM, To: `whatsapp:${phone}`, Body: body }),
  })
}

export const WhatsApp = {

  async newOrder(tailor: { phone: string | null; business_name: string }, order: { id: string; title: string; customer_name: string }) {
    if (!tailor.phone) return
    await send(tailor.phone,
      `✂️ *New order on TailorNow!*\n\n` +
      `Customer: ${order.customer_name}\n` +
      `Order: ${order.title}\n\n` +
      `View and respond in the app:\n${APP_URL}/tailor/orders\n\n` +
      `_All payments and chat happen inside TailorNow._`
    )
  },

  async orderAccepted(customer: { phone: string | null }, order: { id: string; title: string; tailor_name: string }) {
    if (!customer.phone) return
    await send(customer.phone,
      `🎉 *Your order was accepted!*\n\n` +
      `Tailor: ${order.tailor_name}\n` +
      `Order: ${order.title}\n\n` +
      `Track your order:\n${APP_URL}/orders/${order.id}\n\n` +
      `_Chat with your tailor inside TailorNow._`
    )
  },

  async orderStatusUpdate(customer: { phone: string | null }, order: { id: string; title: string; status: string }) {
    if (!customer.phone) return
    const statusMessages: Record<string, string> = {
      measuring:        '📏 Your tailor is taking measurements.',
      in_progress:      '🪡 Your outfit is being made!',
      ready:            '✅ Your outfit is ready!',
      out_for_delivery: '🚚 Your outfit is on the way!',
      delivered:        '📦 Your outfit has been delivered. Please confirm receipt in the app.',
    }
    const msg = statusMessages[order.status]
    if (!msg) return
    await send(customer.phone,
      `✂️ *Order update — TailorNow*\n\n` +
      `${msg}\n\nOrder: ${order.title}\n\n` +
      `View details:\n${APP_URL}/orders/${order.id}`
    )
  },

  async depositPaid(tailor: { phone: string | null }, order: { id: string; title: string; deposit: number }) {
    if (!tailor.phone) return
    await send(tailor.phone,
      `💰 *Deposit received on TailorNow!*\n\n` +
      `Order: ${order.title}\n` +
      `Deposit: ₦${order.deposit.toLocaleString()}\n\n` +
      `Start working when ready:\n${APP_URL}/tailor/orders\n\n` +
      `_Your earnings are secured in the app._`
    )
  },

  async referralBonus(tailor: { phone: string | null; name: string }) {
    if (!tailor.phone) return
    await send(tailor.phone,
      `🎁 *You earned a referral bonus on TailorNow!*\n\n` +
      `A tailor you referred just completed their first 3 orders.\n` +
      `₦2,000 credit has been added to your account.\n\n` +
      `Check your dashboard:\n${APP_URL}/dashboard`
    )
  },
}
