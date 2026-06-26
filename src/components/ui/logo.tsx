import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'full' | 'icon'
  className?: string
  animated?: boolean
  dark?: boolean
}

function ScissorsIcon({ width, dark, animated }: { width: number; dark?: boolean; animated?: boolean }) {
  const top = dark ? '#C4B5FD' : '#7C3AED'
  const bottom = dark ? '#FCD34D' : '#D97706'
  const pivot = dark ? '#C4B5FD' : '#7C3AED'
  const pivotBg = dark ? 'transparent' : 'white'

  const h = Math.round(width * (120 / 140))

  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 140 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <style>{`
        @keyframes tn-snip {
          0%,100% { transform: rotate(0deg); }
          30%      { transform: rotate(-14deg); }
          70%      { transform: rotate(14deg); }
        }
        .tn-blade-top    { transform-origin: 68px 58px; ${animated ? 'animation: tn-snip 2.2s ease-in-out infinite;' : ''} }
        .tn-blade-bottom { transform-origin: 68px 62px; ${animated ? 'animation: tn-snip 2.2s ease-in-out infinite reverse;' : ''} }
      `}</style>

      {/* Top blade — violet */}
      <g className="tn-blade-top">
        <ellipse cx="28" cy="28" rx="18" ry="22" stroke={top} strokeWidth="3.5" fill="none" />
        <ellipse cx="28" cy="28" rx="10" ry="12" stroke={top} strokeWidth="2" fill="none" />
        <path d="M40 18 Q55 30 68 58" stroke={top} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M38 36 Q53 44 68 58" stroke={top} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M68 58 L110 30" stroke={top} strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Bottom blade — gold */}
      <g className="tn-blade-bottom">
        <ellipse cx="28" cy="92" rx="18" ry="22" stroke={bottom} strokeWidth="3.5" fill="none" />
        <ellipse cx="28" cy="92" rx="10" ry="12" stroke={bottom} strokeWidth="2" fill="none" />
        <path d="M40 102 Q55 90 68 62" stroke={bottom} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M38 84 Q53 76 68 62" stroke={bottom} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M68 62 L110 90" stroke={bottom} strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Pivot screw */}
      <circle cx="68" cy="60" r="6" fill={pivotBg} stroke={pivot} strokeWidth="2.5" />
      <circle cx="68" cy="60" r="2.5" fill={pivot} />
    </svg>
  )
}

export function Logo({ size = 'md', variant = 'icon', className, animated = false, dark = false }: LogoProps) {
  const sizes = {
    sm: { scissors: 28, script: 'text-lg',  now: 'text-[8px]',  gap: 'gap-1.5' },
    md: { scissors: 38, script: 'text-2xl', now: 'text-[10px]', gap: 'gap-2'   },
    lg: { scissors: 54, script: 'text-4xl', now: 'text-sm',     gap: 'gap-2.5' },
    xl: { scissors: 72, script: 'text-5xl', now: 'text-base',   gap: 'gap-3'   },
  }
  const s = sizes[size]
  const tailorColor = dark ? 'text-violet-300' : 'text-violet-700'
  const nowColor    = dark ? 'text-white'       : 'text-gray-900'

  if (variant === 'icon') {
    return <ScissorsIcon width={s.scissors} dark={dark} animated={animated} />
  }

  return (
    <div className={cn('inline-flex items-center select-none', s.gap, className)}>
      <ScissorsIcon width={s.scissors} dark={dark} animated={animated} />
      <div className="flex flex-col leading-none gap-[2px]">
        <span
          className={cn('font-bold leading-none', s.script, tailorColor)}
          style={{ fontFamily: 'var(--font-script, "Dancing Script", cursive)' }}
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

export { ScissorsIcon as ScissorsLogo }
