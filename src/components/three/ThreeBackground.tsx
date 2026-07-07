'use client'
import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

/* ─── Waving cloth ───────────────────────────────────────────── */
function WavingCloth() {
  const mesh = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => new THREE.PlaneGeometry(20, 14, 48, 32), [])
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const pos = mesh.current.geometry.attributes.position
    const t = clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i)
      pos.setZ(i,
        Math.sin(x * 0.4 + t * 0.7) * 0.5 +
        Math.sin(y * 0.35 + t * 0.5) * 0.35 +
        Math.sin((x + y) * 0.25 + t * 0.35) * 0.25
      )
    }
    pos.needsUpdate = true
    mesh.current.geometry.computeVertexNormals()
  })
  return (
    <mesh ref={mesh} geometry={geo} position={[0, 0, -5]}>
      <meshStandardMaterial
        color="#5B21B6" emissive="#4C1D95" emissiveIntensity={0.4}
        metalness={0.5} roughness={0.5}
        transparent opacity={0.18} side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/* ─── Torus ring ─────────────────────────────────────────────── */
function Ring({ pos, rot, scale, color, emissive, speed, phase }: {
  pos: [number, number, number]; rot: [number, number, number]
  scale: number; color: string; emissive: string; speed: number; phase: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const t = clock.elapsedTime
    mesh.current.rotation.x = rot[0] + t * speed * 0.45
    mesh.current.rotation.y = rot[1] + t * speed * 0.65
    mesh.current.position.y = pos[1] + Math.sin(t * speed * 0.5 + phase) * 0.6
  })
  return (
    <mesh ref={mesh} position={pos} scale={scale}>
      <torusGeometry args={[1, 0.28, 16, 48]} />
      <meshStandardMaterial
        color={color} emissive={emissive} emissiveIntensity={1.2}
        metalness={0.9} roughness={0.1} transparent opacity={0.9}
      />
    </mesh>
  )
}

/* ─── Diamond ────────────────────────────────────────────────── */
function Diamond({ pos, rot, scale, color, emissive, speed, phase }: {
  pos: [number, number, number]; rot: [number, number, number]
  scale: number; color: string; emissive: string; speed: number; phase: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const t = clock.elapsedTime
    mesh.current.rotation.x = rot[0] + t * speed * 0.35
    mesh.current.rotation.y = rot[1] + t * speed * 0.55
    mesh.current.rotation.z = rot[2] + t * speed * 0.25
    mesh.current.position.y = pos[1] + Math.sin(t * speed * 0.7 + phase) * 0.45
    mesh.current.position.x = pos[0] + Math.sin(t * speed * 0.3 + phase * 0.6) * 0.2
  })
  return (
    <mesh ref={mesh} position={pos} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={color} emissive={emissive} emissiveIntensity={1.5}
        metalness={0.95} roughness={0.05} transparent opacity={0.92}
      />
    </mesh>
  )
}

/* ─── Wire crystal ───────────────────────────────────────────── */
function Crystal({ pos, rot, scale, color, emissive, speed, phase }: {
  pos: [number, number, number]; rot: [number, number, number]
  scale: number; color: string; emissive: string; speed: number; phase: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const t = clock.elapsedTime
    mesh.current.rotation.x = rot[0] + t * speed * 0.28
    mesh.current.rotation.y = rot[1] + t * speed * 0.42
    mesh.current.position.y = pos[1] + Math.sin(t * speed * 0.6 + phase) * 0.4
  })
  return (
    <mesh ref={mesh} position={pos} scale={scale}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={color} emissive={emissive} emissiveIntensity={0.9}
        metalness={0.8} roughness={0.2} wireframe transparent opacity={0.85}
      />
    </mesh>
  )
}

/* ─── Glowing star particles ─────────────────────────────────── */
function StarField({ count = 240 }: { count?: number }) {
  const pts = useRef<THREE.Points>(null)
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const violet = new THREE.Color('#8B5CF6')
    const amber  = new THREE.Color('#F59E0B')
    const white  = new THREE.Color('#ffffff')
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 28
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 3
      const c = i % 5 === 0 ? amber : i % 3 === 0 ? white : violet
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [count])

  useFrame(({ clock }) => {
    if (!pts.current) return
    pts.current.rotation.y = clock.elapsedTime * 0.012
    pts.current.rotation.x = clock.elapsedTime * 0.007
  })

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  )
}

/* ─── Mouse camera ───────────────────────────────────────────── */
function CameraRig({ strength }: { strength: number }) {
  const { camera, mouse } = useThree()
  useFrame(() => {
    camera.position.x += (mouse.x * strength - camera.position.x) * 0.05
    camera.position.y += (mouse.y * strength * 0.7 - camera.position.y) * 0.05
    camera.lookAt(0, 0, 0)
  })
  return null
}

/* ─── Full scene ─────────────────────────────────────────────── */
function Scene({ variant }: { variant: 'full' | 'subtle' | 'light' }) {
  const s = variant === 'subtle' ? 0.72 : variant === 'light' ? 0.85 : 1

  const rings: Parameters<typeof Ring>[0][] = [
    { pos: [-6.5, 2.5, -3], rot: [0.5, 0.2, 0.1], scale: 1.5 * s, color: '#7C3AED', emissive: '#6D28D9', speed: 0.5, phase: 0.0 },
    { pos: [ 7.0,-1.5, -4], rot: [1.0, 0.5, 0.3], scale: 1.0 * s, color: '#8B5CF6', emissive: '#7C3AED', speed: 0.35, phase: 1.2 },
    { pos: [-2.5,-4.5, -2], rot: [0.2, 0.8, 0.1], scale: 0.8 * s, color: '#A78BFA', emissive: '#8B5CF6', speed: 0.6, phase: 2.4 },
    { pos: [ 4.5, 4.5, -5], rot: [0.7, 0.3, 0.9], scale: 1.2 * s, color: '#7C3AED', emissive: '#5B21B6', speed: 0.4, phase: 0.8 },
    { pos: [ 1.0,-5.5, -6], rot: [0.3, 0.6, 0.4], scale: 1.8 * s, color: '#6D28D9', emissive: '#4C1D95', speed: 0.25, phase: 3.1 },
  ]

  const diamonds: Parameters<typeof Diamond>[0][] = [
    { pos: [ 3.5, 1.5, -1.5], rot: [0, 0, 0],       scale: 0.8 * s, color: '#FBBF24', emissive: '#F59E0B', speed: 0.7, phase: 0.5 },
    { pos: [-7.0,-2.0, -4],   rot: [0.3, 0.1, 0],   scale: 0.55 * s, color: '#F59E0B', emissive: '#D97706', speed: 0.55, phase: 1.8 },
    { pos: [ 1.0, 5.0, -6],   rot: [0.5, 0.3, 0.2], scale: 1.0 * s, color: '#FCD34D', emissive: '#FBBF24', speed: 0.45, phase: 2.7 },
    { pos: [-2.5, 0.5, -1],   rot: [0.1, 0.6, 0.3], scale: 0.45 * s, color: '#FBBF24', emissive: '#F59E0B', speed: 0.8, phase: 0.2 },
    { pos: [ 8.0,-3.5, -5],   rot: [0.4, 0.2, 0.5], scale: 0.65 * s, color: '#F59E0B', emissive: '#D97706', speed: 0.5, phase: 1.4 },
    { pos: [-5.5, 5.0, -7],   rot: [0.2, 0.7, 0.1], scale: 0.9 * s,  color: '#FDE68A', emissive: '#FBBF24', speed: 0.38, phase: 3.5 },
    { pos: [ 2.0,-2.5, -2],   rot: [0.6, 0.4, 0.3], scale: 0.5 * s,  color: '#F59E0B', emissive: '#D97706', speed: 0.62, phase: 0.9 },
  ]

  const crystals: Parameters<typeof Crystal>[0][] = [
    { pos: [-4.5, 3.5, -4], rot: [0, 0, 0],       scale: 0.65 * s, color: '#C4B5FD', emissive: '#A78BFA', speed: 0.35, phase: 1.1 },
    { pos: [ 6.0, 2.0, -3], rot: [0.2, 0.4, 0.1], scale: 0.9 * s,  color: '#A78BFA', emissive: '#8B5CF6', speed: 0.28, phase: 2.3 },
    { pos: [ 2.5,-4.5, -4], rot: [0.5, 0.1, 0.3], scale: 0.55 * s, color: '#DDD6FE', emissive: '#C4B5FD', speed: 0.45, phase: 0.6 },
    { pos: [-1.0, 6.5, -8], rot: [0.3, 0.5, 0.2], scale: 1.2 * s,  color: '#8B5CF6', emissive: '#7C3AED', speed: 0.2, phase: 4.2 },
  ]

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]}   intensity={2.0} color="#8B5CF6" />
      <directionalLight position={[-5,-3, 3]}   intensity={1.5} color="#F59E0B" />
      <pointLight       position={[0, 0, 4]}    intensity={1.5} color="#ffffff" />
      <pointLight       position={[-4, 3, 0]}   intensity={2.0} color="#7C3AED" />
      <pointLight       position={[ 4,-2, 0]}   intensity={2.0} color="#F59E0B" />

      <CameraRig strength={variant === 'subtle' ? 1.0 : variant === 'light' ? 1.2 : 1.8} />
      <StarField count={variant === 'subtle' ? 140 : variant === 'light' ? 120 : 260} />
      {variant === 'full' && <WavingCloth />}

      {rings.map((r, i)    => <Ring    key={`r${i}`} {...r} />)}
      {diamonds.map((d, i) => <Diamond key={`d${i}`} {...d} />)}
      {crystals.map((c, i) => <Crystal key={`c${i}`} {...c} />)}

      <EffectComposer>
        <Bloom
          intensity={variant === 'full' ? 1.4 : variant === 'light' ? 0.25 : 0.9}
          luminanceThreshold={variant === 'light' ? 0.6 : 0.2}
          luminanceSmoothing={0.6}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

/* ─── Export ─────────────────────────────────────────────────── */
export function ThreeBackground({ variant = 'full' }: { variant?: 'full' | 'subtle' | 'light' }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
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
