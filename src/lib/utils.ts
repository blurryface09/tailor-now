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
  street_wear: 'Street Wear',
  custom_outfit: 'Custom Outfit',
  alterations: 'Alterations and Repairs',
  bridal: 'Bridal and Special Occasion',
  ready_to_wear: 'Ready-to-Wear Adjustments',
  fabric_sourcing: 'Fabric Sourcing and Sewing',
  uniforms: 'Uniforms and Corporate Wear',
  asoebi: 'Asoebi Group Orders',
}

export const BANK_ACCOUNT_PATTERN = /\b\d{10}\b/g

const NIGERIAN_BANKS = [
  'access', 'gtb', 'gtbank', 'zenith', 'uba', 'first bank', 'fbn', 'union bank',
  'sterling', 'stanbic', 'fcmb', 'wema', 'opay', 'kuda', 'moniepoint', 'palmpay',
  'providus', 'jaiz', 'polaris', 'keystone', 'ecobank', 'citibank',
]

// Nigerian phone: 07xxx/08xxx/09xxx (11 digits) or +234 format
const PHONE_PATTERN = /(\+?234|0)[789][01]\d{8}/g
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const EXTERNAL_URL_PATTERN = /https?:\/\/[^\s]+/gi
const WHATSAPP_PATTERN = /(wa\.me|whatsapp\.com|api\.whatsapp)/i
const SOCIAL_HANDLE_PATTERN = /@[a-zA-Z0-9_.]{3,}/g

type MessageFlag = { blocked: true; reason: string } | { blocked: false; warned: true; reason: string } | { blocked: false; warned: false }

export function classifyMessage(text: string): MessageFlag {
  PHONE_PATTERN.lastIndex = 0
  EMAIL_PATTERN.lastIndex = 0
  EXTERNAL_URL_PATTERN.lastIndex = 0
  SOCIAL_HANDLE_PATTERN.lastIndex = 0

  if (PHONE_PATTERN.test(text)) return { blocked: true, reason: 'Phone numbers cannot be shared in chat — use in-app contact sharing only.' }
  if (EMAIL_PATTERN.test(text)) return { blocked: true, reason: 'Email addresses cannot be shared here — all communication must stay in-app.' }
  if (WHATSAPP_PATTERN.test(text)) return { blocked: true, reason: 'WhatsApp links are not allowed — keep all conversations inside TailorNow.' }
  if (EXTERNAL_URL_PATTERN.test(text)) return { blocked: true, reason: 'External links are not allowed in chat.' }
  if (SOCIAL_HANDLE_PATTERN.test(text)) return { blocked: true, reason: 'Social media handles cannot be shared here.' }

  // Soft warning for bank details (allow send anyway)
  BANK_ACCOUNT_PATTERN.lastIndex = 0
  const lower = text.toLowerCase()
  const hasAccountNumber = BANK_ACCOUNT_PATTERN.test(text)
  const hasAccountPhrase = /account\s*(number|no\.?|#)/i.test(text)
  const hasBankName = NIGERIAN_BANKS.some(b => lower.includes(b))
  const hasTransferPhrase = /(send|transfer|pay)\s*(to|me|directly)/i.test(lower)
  BANK_ACCOUNT_PATTERN.lastIndex = 0
  if (hasAccountNumber || (hasAccountPhrase && hasBankName) || (hasBankName && hasTransferPhrase)) {
    return { blocked: false, warned: true, reason: 'This looks like bank account details.' }
  }

  return { blocked: false, warned: false }
}

export function containsBankDetails(text: string): boolean {
  const r = classifyMessage(text)
  return !r.blocked && 'warned' in r && r.warned
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
export const SERVICE_CHARGE_RATE = 0.03

export function calculateServiceCharge(agreedPrice: number) {
  const serviceCharge = Math.round(agreedPrice * SERVICE_CHARGE_RATE)
  return { serviceCharge, totalCharged: agreedPrice + serviceCharge }
}

export function calculateCommission(amount: number) {
  const commission = amount * COMMISSION_RATE
  return {
    gross: amount,
    commission,
    net: amount - commission,
  }
}
