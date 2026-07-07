const CREATIVE_SUPPORT_MESSAGE = [
  'Hi TailorNow support,',
  '',
  'I am a creative and I need help continuing my onboarding process.',
].join('\n')

const CREATIVE_SUPPORT_WHATSAPP = `https://wa.me/2347075613715?text=${encodeURIComponent(CREATIVE_SUPPORT_MESSAGE)}`

export const CREATIVE_SUPPORT_URL =
  process.env.NEXT_PUBLIC_CREATIVE_SUPPORT_URL ||
  CREATIVE_SUPPORT_WHATSAPP

export const CREATIVE_SUPPORT_LABEL =
  process.env.NEXT_PUBLIC_CREATIVE_SUPPORT_LABEL || 'Chat on WhatsApp'
