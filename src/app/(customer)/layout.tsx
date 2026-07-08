import { ThreeBackground } from '@/components/three/ThreeBackground'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <ThreeBackground variant="light" />
      </div>
      {children}
    </>
  )
}
