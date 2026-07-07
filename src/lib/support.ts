const CREATIVE_SUPPORT_MESSAGE = [
  'Hi TailorNow support,',
  '',
  'I am a creative and I need help continuing my onboarding process.',
].join('\n')

export const CREATIVE_SUPPORT_URL =
  process.env.NEXT_PUBLIC_CREATIVE_SUPPORT_URL ||
  `mailto:hello@tailornow.shop?subject=${encodeURIComponent('Creative onboarding support')}&body=${encodeURIComponent(CREATIVE_SUPPORT_MESSAGE)}`

export const CREATIVE_SUPPORT_LABEL =
  process.env.NEXT_PUBLIC_CREATIVE_SUPPORT_LABEL || 'Contact support'

