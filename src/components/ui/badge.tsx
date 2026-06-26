import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
      {
        'bg-violet-100 text-violet-700': variant === 'default',
        'bg-green-100 text-green-700': variant === 'success',
        'bg-amber-100 text-amber-700': variant === 'warning',
        'bg-red-100 text-red-700': variant === 'danger',
        'bg-blue-100 text-blue-700': variant === 'info',
        'bg-yellow-100 text-yellow-700': variant === 'gold',
      },
      className
    )}>
      {children}
    </span>
  )
}
