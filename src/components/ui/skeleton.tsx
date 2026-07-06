import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function TailorCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-white/[0.08] overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-white/[0.08] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-28" />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-white/[0.08] overflow-hidden">
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="p-6 space-y-4">
          <div className="flex gap-4 items-end -mt-10">
            <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
            <div className="space-y-2 pb-1 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
