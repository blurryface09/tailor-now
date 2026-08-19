import type { UserRole } from '@/types'

// 'support' can engage creatives, broadcast, moderate posts and disputes,
// and approve new creatives — but never touch payouts or account roles.
export const STAFF_ROLES: UserRole[] = ['admin', 'support']

export function isStaff(role?: string | null): boolean {
  return role === 'admin' || role === 'support'
}
