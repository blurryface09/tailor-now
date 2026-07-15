import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon'
  className?: string
  animated?: boolean
  dark?: boolean
}

// Brand gradient: warm tan → mauve → deep purple (from brand guide SVG #3008)
const BRAND_GRAD_ID = 'tn-brand-grad'

function BrandIcon({ width, dark, animated }: { width: number; dark?: boolean; animated?: boolean }) {
  const h = Math.round(width * (120 / 140))
  const top    = dark ? '#DEB995' : '#C68A52'   // warm tan
  const bottom = dark ? '#D9A6C2' : '#8C5A78'   // mauve
  const pivot  = dark ? '#9A8FA4' : '#4B3B66'   // brand purple

  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 140 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${BRAND_GRAD_ID}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={top} />
          <stop offset="100%" stopColor={pivot} />
        </linearGradient>
        <linearGradient id={`${BRAND_GRAD_ID}-bot`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bottom} />
          <stop offset="100%" stopColor={pivot} />
        </linearGradient>
      </defs>
      <style>{`
        @keyframes tn-snip {
          0%,100% { transform: rotate(0deg); }
          30%      { transform: rotate(-14deg); }
          70%      { transform: rotate(14deg); }
        }
        .tn-blade-top    { transform-origin: 68px 58px; ${animated ? 'animation: tn-snip 2.2s ease-in-out infinite;' : ''} }
        .tn-blade-bottom { transform-origin: 68px 62px; ${animated ? 'animation: tn-snip 2.2s ease-in-out infinite reverse;' : ''} }
      `}</style>

      {/* Top blade — warm tan → brand purple */}
      <g className="tn-blade-top">
        <ellipse cx="28" cy="28" rx="18" ry="22" stroke={`url(#${BRAND_GRAD_ID}-top)`} strokeWidth="3.5" fill="none" />
        <ellipse cx="28" cy="28" rx="10" ry="12" stroke={`url(#${BRAND_GRAD_ID}-top)`} strokeWidth="2" fill="none" />
        <path d="M40 18 Q55 30 68 58" stroke={top} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M38 36 Q53 44 68 58" stroke={top} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M68 58 L110 30" stroke={top} strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Bottom blade — mauve → brand purple */}
      <g className="tn-blade-bottom">
        <ellipse cx="28" cy="92" rx="18" ry="22" stroke={`url(#${BRAND_GRAD_ID}-bot)`} strokeWidth="3.5" fill="none" />
        <ellipse cx="28" cy="92" rx="10" ry="12" stroke={`url(#${BRAND_GRAD_ID}-bot)`} strokeWidth="2" fill="none" />
        <path d="M40 102 Q55 90 68 62" stroke={bottom} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M38 84 Q53 76 68 62" stroke={bottom} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M68 62 L110 90" stroke={bottom} strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Pivot screw */}
      <circle cx="68" cy="60" r="6" fill="none" stroke={pivot} strokeWidth="2.5" />
      <circle cx="68" cy="60" r="2.5" fill={pivot} />
    </svg>
  )
}

export function Logo({ size = 'md', variant = 'icon', className, animated = false, dark = false }: LogoProps) {
  const sizes = {
    sm: { icon: 28, script: 'text-lg',  now: 'text-[8px]',  gap: 'gap-1.5' },
    md: { icon: 38, script: 'text-2xl', now: 'text-[10px]', gap: 'gap-2'   },
    lg: { icon: 54, script: 'text-4xl', now: 'text-sm',     gap: 'gap-2.5' },
    xl: { icon: 72, script: 'text-5xl', now: 'text-base',   gap: 'gap-3'   },
  }
  const s = sizes[size]
  // Light-on-dark: cream heading, tan accent; Dark-on-light: deep purple heading, tan accent
  const tailorColor = dark ? 'text-amber-300' : 'text-violet-900'
  const nowColor    = dark ? 'text-amber-200' : 'text-violet-700'

  if (variant === 'icon') {
    return <BrandIcon width={s.icon} dark={dark} animated={animated} />
  }

  return (
    <div className={cn('inline-flex items-center select-none', s.gap, className)}>
      <BrandIcon width={s.icon} dark={dark} animated={animated} />
      <div className="flex flex-col leading-none gap-[2px]">
        <span
          className={cn('font-bold leading-none', s.script, tailorColor)}
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Tailor
        </span>
        <span className={cn('font-black tracking-[0.22em] uppercase leading-none', s.now, nowColor)}>
          NOW
        </span>
      </div>
    </div>
  )
}

export { BrandIcon as ScissorsLogo }
