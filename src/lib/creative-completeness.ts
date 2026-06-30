export interface CreativeCompletenessInput {
  avatar_url?: string | null
  phone?: string | null
  address?: string | null
  face_photo_url?: string | null
  portfolio_count?: number | null
  min_price?: number | null
  max_price?: number | null
}

export interface CompletenessCheck {
  key: 'photo' | 'phone' | 'address' | 'face' | 'portfolio' | 'price'
  label: string
  done: boolean
}

/** The 6 fields required before a creative can be admin-verified and shown to customers. */
export function creativeCompletenessChecks(t: CreativeCompletenessInput): CompletenessCheck[] {
  return [
    { key: 'photo', label: 'Profile photo', done: !!t.avatar_url },
    { key: 'phone', label: 'Phone number', done: !!t.phone },
    { key: 'address', label: 'Shop address', done: !!t.address },
    { key: 'face', label: 'Face / ID photo', done: !!t.face_photo_url },
    { key: 'portfolio', label: '2+ portfolio pics', done: (t.portfolio_count ?? 0) >= 2 },
    { key: 'price', label: 'Price range', done: !!(t.min_price && t.max_price) },
  ]
}

export function isCreativeProfileComplete(t: CreativeCompletenessInput): boolean {
  return creativeCompletenessChecks(t).every(c => c.done)
}
