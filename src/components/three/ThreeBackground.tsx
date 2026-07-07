'use client'
import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── Waving cloth plane ─────────────────────────────────────── */
function WavingCloth() {
  const mesh = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => new THREE.PlaneGeometry(18, 12, 40, 28), [])

  useFrame(({ clock }) => {
    if (!mesh.current) return
    const pos = mesh.current.geometry.attributes.position
    const t = clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      pos.setZ(i,
        Math.sin(x * 0.4 + t * 0.6) * 0.35 +
        Math.sin(y * 0.35 + t * 0.45) * 0.25 +
        Math.sin((x + y) * 0.25 + t * 0.3) * 0.2
      )
    }
    pos.needsUpdate = true
    mesh.current.geometry.computeVertexNormals()
  })

  return (
    <mesh ref={mesh} geometry={geo} position={[0, 0, -6]}>
      <meshStandardMaterial
        color="#7C3AED"
        metalness={0.4}
        roughness={0.6}
        transparent
        opacity={0.09}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  )
}

/* ─── Torus ring ─────────────────────────────────────────────── */
function FloatingRing({ pos, rot, scale, color, speed, phase }: {
  pos: [number, number, number]
  rot: [number, number, number]
  scale: number
  color: string
  speed: number
  phase: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const t = clock.elapsedTime
    mesh.current.rotation.x = rot[0] + t * speed * 0.4
    mesh.current.rotation.y = rot[1] + t * speed * 0.6
    mesh.current.position.y = pos[1] + Math.sin(t * speed * 0.5 + phase) * 0.5
  })
  return (
    <mesh ref={mesh} position={pos} scale={scale}>
      <torusGeometry args={[1, 0.22, 14, 40]} />
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} transparent opacity={0.55} />
    </mesh>
  )
}

/* ─── Diamond (octahedron) ───────────────────────────────────── */
function FloatingDiamond({ pos, rot, scale, color, speed, phase }: {
  pos: [number, number, number]
  rot: [number, number, number]
  scale: number
  color: string
  speed: number
  phase: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const t = clock.elapsedTime
    mesh.current.rotation.x = rot[0] + t * speed * 0.3
    mesh.current.rotation.y = rot[1] + t * speed * 0.5
    mesh.current.rotation.z = rot[2] + t * speed * 0.2
    mesh.current.position.y = pos[1] + Math.sin(t * speed * 0.7 + phase) * 0.4
    mesh.current.position.x = pos[0] + Math.sin(t * speed * 0.3 + phase * 0.5) * 0.15
  })
  return (
    <mesh ref={mesh} position={pos} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} metalness={0.95} roughness={0.05} transparent opacity={0.7} />
    </mesh>
  )
}

/* ─── Crystal (icosahedron) ──────────────────────────────────── */
function FloatingCrystal({ pos, rot, scale, color, speed, phase }: {
  pos: [number, number, number]
  rot: [number, number, number]
  scale: number
  color: string
  speed: number
  phase: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const t = clock.elapsedTime
    mesh.current.rotation.x = rot[0] + t * speed * 0.25
    mesh.current.rotation.y = rot[1] + t * speed * 0.4
    mesh.current.position.y = pos[1] + Math.sin(t * speed * 0.6 + phase) * 0.35
  })
  return (
    <mesh ref={mesh} position={pos} scale={scale}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.15} transparent opacity={0.5} wireframe />
    </mesh>
  )
}

/* ─── Star particles ─────────────────────────────────────────── */
function StarField({ count = 200 }: { count?: number }) {
  const pts = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 30
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20
      arr[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5
    }
    return arr
  }, [count])

  useFrame(({ clock }) => {
    if (!pts.current) return
    pts.current.rotation.y = clock.elapsedTime * 0.015
    pts.current.rotation.x = clock.elapsedTime * 0.008
  })

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#A78BFA" transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

/* ─── Mouse-reactive camera ──────────────────────────────────── */
function CameraRig({ strength = 1.5 }: { strength?: number }) {
  const { camera, mouse } = useThree()
  useFrame(() => {
    camera.position.x += (mouse.x * strength - camera.position.x) * 0.04
    camera.position.y += (mouse.y * strength * 0.7 - camera.position.y) * 0.04
    camera.lookAt(0, 0, 0)
  })
  return null
}

/* ─── Full scene ─────────────────────────────────────────────── */
function Scene({ variant }: { variant: 'full' | 'subtle' }) {
  const opacity = variant === 'subtle' ? 0.55 : 1.0

  const rings = useMemo(() => [
    { pos: [-6.5, 2.5, -4]  as [number,number,number], rot: [0.5, 0.2, 0.1]  as [number,number,number], scale: 1.4 * opacity, color: '#7C3AED', speed: 0.5, phase: 0.0 },
    { pos: [ 7.0,-1.5, -5]  as [number,number,number], rot: [1.0, 0.5, 0.3]  as [number,number,number], scale: 0.9 * opacity, color: '#6D28D9', speed: 0.35, phase: 1.2 },
    { pos: [-2.5,-4.0, -3]  as [number,number,number], rot: [0.2, 0.8, 0.1]  as [number,number,number], scale: 0.7 * opacity, color: '#8B5CF6', speed: 0.6, phase: 2.4 },
    { pos: [ 4.5, 4.5, -6]  as [number,number,number], rot: [0.7, 0.3, 0.9]  as [number,number,number], scale: 1.1 * opacity, color: '#7C3AED', speed: 0.4, phase: 0.8 },
    { pos: [ 0.5,-5.0, -7]  as [number,number,number], rot: [0.3, 0.6, 0.4]  as [number,number,number], scale: 1.6 * opacity, color: '#4C1D95', speed: 0.25, phase: 3.1 },
  ], [opacity])

  const diamonds = useMemo(() => [
    { pos: [ 3.5, 1.5, -2]  as [number,number,number], rot: [0,   0,   0  ] as [number,number,number], scale: 0.65 * opacity, color: '#F59E0B', speed: 0.7, phase: 0.5 },
    { pos: [-7.0,-2.0, -5]  as [number,number,number], rot: [0.3, 0.1, 0  ] as [number,number,number], scale: 0.45 * opacity, color: '#D97706', speed: 0.55, phase: 1.8 },
    { pos: [ 1.0, 5.0, -7]  as [number,number,number], rot: [0.5, 0.3, 0.2] as [number,number,number], scale: 0.9 * opacity, color: '#F59E0B', speed: 0.45, phase: 2.7 },
    { pos: [-2.5, 0.5, -1.5] as [number,number,number], rot: [0.1, 0.6, 0.3] as [number,number,number], scale: 0.35 * opacity, color: '#FBBF24', speed: 0.8, phase: 0.2 },
    { pos: [ 8.0,-3.5, -6]  as [number,number,number], rot: [0.4, 0.2, 0.5] as [number,number,number], scale: 0.55 * opacity, color: '#F59E0B', speed: 0.5, phase: 1.4 },
    { pos: [-5.5, 5.0, -8]  as [number,number,number], rot: [0.2, 0.7, 0.1] as [number,number,number], scale: 0.75 * opacity, color: '#FCD34D', speed: 0.38, phase: 3.5 },
    { pos: [ 2.0,-2.5, -3]  as [number,number,number], rot: [0.6, 0.4, 0.3] as [number,number,number], scale: 0.4 * opacity,  color: '#F59E0B', speed: 0.62, phase: 0.9 },
  ], [opacity])

  const crystals = useMemo(() => [
    { pos: [-4.5, 3.5, -5]  as [number,number,number], rot: [0,   0,   0  ] as [number,number,number], scale: 0.55 * opacity, color: '#A78BFA', speed: 0.35, phase: 1.1 },
    { pos: [ 6.0, 2.0, -4]  as [number,number,number], rot: [0.2, 0.4, 0.1] as [number,number,number], scale: 0.8 * opacity,  color: '#8B5CF6', speed: 0.28, phase: 2.3 },
    { pos: [ 2.5,-4.5, -5]  as [number,number,number], rot: [0.5, 0.1, 0.3] as [number,number,number], scale: 0.45 * opacity, color: '#C4B5FD', speed: 0.45, phase: 0.6 },
    { pos: [-1.0, 6.0, -9]  as [number,number,number], rot: [0.3, 0.5, 0.2] as [number,number,number], scale: 1.0 * opacity,  color: '#7C3AED', speed: 0.2,  phase: 4.2 },
  ], [opacity])

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 6, 4]}  intensity={1.2} color="#7C3AED" />
      <directionalLight position={[-5,-3, 3]}  intensity={0.8} color="#F59E0B" />
      <pointLight       position={[0, 0, 5]}   intensity={0.6} color="#ffffff" />

      <CameraRig strength={variant === 'subtle' ? 0.8 : 1.5} />
      <StarField count={variant === 'subtle' ? 120 : 220} />
      {variant === 'full' && <WavingCloth />}

      {rings.map((r, i) => <FloatingRing key={`r${i}`} {...r} />)}
      {diamonds.map((d, i) => <FloatingDiamond key={`d${i}`} {...d} />)}
      {crystals.map((c, i) => <FloatingCrystal key={`c${i}`} {...c} />)}
    </>
  )
}

/* ─── Exported component ─────────────────────────────────────── */
export function ThreeBackground({ variant = 'full' }: { variant?: 'full' | 'subtle' }) {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene variant={variant} />
        </Suspense>
      </Canvas>
    </div>
  )
}
