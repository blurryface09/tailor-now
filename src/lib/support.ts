const CREATIVE_SUPPORT_MESSAGE = [
  'Hi TailorNow support,',
  '',
  'I am a creative and I need help continuing my onboarding process.',
].join('\n')

const CREATIVE_SUPPORT_EMAIL = 'admin@folubandsamuellabs.com'

export const CREATIVE_SUPPORT_WHATSAPP_URL =
  `https://wa.me/2347075613715?text=${encodeURIComponent(CREATIVE_SUPPORT_MESSAGE)}`

export const CREATIVE_SUPPORT_EMAIL_URL =
  `mailto:${CREATIVE_SUPPORT_EMAIL}?subject=${encodeURIComponent('Creative onboarding support')}&body=${encodeURIComponent(CREATIVE_SUPPORT_MESSAGE)}`
