import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRelativeTime(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export const SERVICE_LABELS: Record<string, string> = {
  custom_outfit: 'Custom Outfit',
  alterations: 'Alterations and Repairs',
  bridal: 'Bridal and Special Occasion',
  ready_to_wear: 'Ready-to-Wear Adjustments',
  fabric_sourcing: 'Fabric Sourcing and Sewing',
  uniforms: 'Uniforms and Corporate Wear',
  asoebi: 'Asoebi Group Orders',
}

// Nigerian bank account pattern — 10 consecutive digits
// Used in chat to detect potential off-platform payment attempts
export const BANK_ACCOUNT_PATTERN = /\b\d{10}\b/g

export const NIGERIAN_BANKS = [
  'access', 'gtb', 'gtbank', 'zenith', 'uba', 'first bank', 'fbn', 'union bank',
  'sterling', 'stanbic', 'fcmb', 'wema', 'opay', 'kuda', 'moniepoint', 'palmpay',
  'providus', 'jaiz', 'polaris', 'keystone', 'ecobank', 'citibank',
]

export function containsBankDetails(text: string): boolean {
  const lower = text.toLowerCase()
  const hasAccountNumber = BANK_ACCOUNT_PATTERN.test(text)
  const hasAccountPhrase = /account\s*(number|no\.?|#)/i.test(text)
  const hasBankName = NIGERIAN_BANKS.some(b => lower.includes(b))
  const hasTransferPhrase = /(send|transfer|pay)\s*(to|me|directly)/i.test(lower)
  BANK_ACCOUNT_PATTERN.lastIndex = 0 // reset regex state
  return hasAccountNumber || (hasAccountPhrase && hasBankName) || (hasBankName && hasTransferPhrase)
}

export function generateReferralCode(name: string): string {
  const base = name.replace(/\s+/g, '').toUpperCase().slice(0, 4)
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${base}${rand}`
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  measuring: 'Taking Measurements',
  in_progress: 'In Progress',
  ready: 'Ready for Delivery',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  measuring: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  ready: 'bg-teal-100 text-teal-800',
  out_for_delivery: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  disputed: 'bg-orange-100 text-orange-800',
}

export const COMMISSION_RATE = 0.20

export function calculateCommission(amount: number) {
  const commission = amount * COMMISSION_RATE
  return {
    gross: amount,
    commission,
    net: amount - commission,
  }
}
