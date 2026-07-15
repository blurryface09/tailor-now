'use client'
import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

/* ─── Waving cloth (landing / auth only) ────────────────────── */
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
        color="#4B3B66" emissive="#362A4C" emissiveIntensity={0.4}
        metalness={0.5} roughness={0.5}
        transparent opacity={0.18} side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/* ─── Sewing Needle with thread ──────────────────────────────── */
function Needle({ pos, rot, scale, threadColor, eScale, speed, phase }: {
  pos: [number,number,number]; rot: [number,number,number]
  scale: number; threadColor: string; eScale: number; speed: number; phase: number
}) {
  const group = useRef<THREE.Group>(null)
  const threadCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.15, 0, 0),
    new THREE.Vector3(1.35, 0.18, 0.05),
    new THREE.Vector3(1.65, 0.42, 0.08),
    new THREE.Vector3(2.0,  0.48, 0.04),
    new THREE.Vector3(2.35, 0.25, -0.04),
    new THREE.Vector3(2.55, 0.0, 0),
  ]), [])

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.rotation.x = rot[0] + t * speed * 0.25
    group.current.rotation.y = rot[1] + t * speed * 0.35
    group.current.position.y = pos[1] + Math.sin(t * speed * 0.5 + phase) * 0.5
    group.current.position.x = pos[0] + Math.sin(t * speed * 0.28 + phase * 0.7) * 0.18
  })

  return (
    <group ref={group} position={pos} scale={scale}>
      {/* Shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.028, 0.065, 2.4, 8]} />
        <meshStandardMaterial color="#D8D8D8" emissive="#B0B0B0" emissiveIntensity={0.2 * eScale} metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Sharp tip */}
      <mesh position={[-1.28, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.028, 0.18, 8]} />
        <meshStandardMaterial color="#ECECEC" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Eye */}
      <mesh position={[1.06, 0, 0]}>
        <torusGeometry args={[0.075, 0.022, 6, 18]} />
        <meshStandardMaterial color="#B8B8B8" emissive="#888" emissiveIntensity={0.15 * eScale} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Thread looping through the eye */}
      <mesh>
        <tubeGeometry args={[threadCurve, 16, 0.016, 6, false]} />
        <meshStandardMaterial color={threadColor} emissive={threadColor} emissiveIntensity={0.5 * eScale} metalness={0.05} roughness={0.7} />
      </mesh>
    </group>
  )
}

/* ─── Thread Spool ───────────────────────────────────────────── */
function Spool({ pos, rot, scale, threadColor, eScale, speed, phase }: {
  pos: [number,number,number]; rot: [number,number,number]
  scale: number; threadColor: string; eScale: number; speed: number; phase: number
}) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.rotation.y = rot[1] + t * speed * 1.1   // spin on axis
    group.current.rotation.x = rot[0] + t * speed * 0.15
    group.current.position.y = pos[1] + Math.sin(t * speed * 0.5 + phase) * 0.45
  })
  return (
    <group ref={group} position={pos} scale={scale}>
      {/* Thread wound on spool */}
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.85, 16]} />
        <meshStandardMaterial color={threadColor} emissive={threadColor} emissiveIntensity={0.4 * eScale} metalness={0.1} roughness={0.62} />
      </mesh>
      {/* Top flange */}
      <mesh position={[0, 0.47, 0]}>
        <cylinderGeometry args={[0.37, 0.37, 0.07, 16]} />
        <meshStandardMaterial color="#C8A882" metalness={0.22} roughness={0.55} />
      </mesh>
      {/* Bottom flange */}
      <mesh position={[0, -0.47, 0]}>
        <cylinderGeometry args={[0.37, 0.37, 0.07, 16]} />
        <meshStandardMaterial color="#C8A882" metalness={0.22} roughness={0.55} />
      </mesh>
    </group>
  )
}

/* ─── Scissors (blades open/close gently) ────────────────────── */
function Scissors({ pos, rot, scale, speed, phase }: {
  pos: [number,number,number]; rot: [number,number,number]
  scale: number; speed: number; phase: number
}) {
  const group = useRef<THREE.Group>(null)
  const upper = useRef<THREE.Group>(null)
  const lower = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!group.current || !upper.current || !lower.current) return
    const t = clock.elapsedTime
    const open = Math.abs(Math.sin(t * speed * 0.55 + phase)) * 0.22 + 0.04
    upper.current.rotation.z = open
    lower.current.rotation.z = -open
    group.current.rotation.y = rot[1] + t * speed * 0.22
    group.current.rotation.z = rot[2] + t * speed * 0.12
    group.current.position.y = pos[1] + Math.sin(t * speed * 0.42 + phase) * 0.5
  })

  return (
    <group ref={group} position={pos} scale={scale} rotation={[rot[0], 0, 0]}>
      {/* Upper blade + ring */}
      <group ref={upper}>
        <mesh position={[0.72, 0.04, 0]}>
          <boxGeometry args={[1.55, 0.09, 0.038]} />
          <meshStandardMaterial color="#CECECE" emissive="#999" emissiveIntensity={0.12} metalness={0.95} roughness={0.05} />
        </mesh>
        <mesh position={[-0.58, 0.42, 0]}>
          <torusGeometry args={[0.26, 0.065, 8, 20]} />
          <meshStandardMaterial color="#AEAEAE" metalness={0.9} roughness={0.12} />
        </mesh>
        <mesh position={[-0.22, 0.2, 0]} rotation={[0, 0, Math.PI / 4.5]}>
          <cylinderGeometry args={[0.038, 0.038, 0.58, 8]} />
          <meshStandardMaterial color="#AEAEAE" metalness={0.9} roughness={0.12} />
        </mesh>
      </group>
      {/* Lower blade + ring */}
      <group ref={lower}>
        <mesh position={[0.72, -0.04, 0]}>
          <boxGeometry args={[1.55, 0.09, 0.038]} />
          <meshStandardMaterial color="#C4C4C4" emissive="#888" emissiveIntensity={0.12} metalness={0.95} roughness={0.05} />
        </mesh>
        <mesh position={[-0.58, -0.42, 0]}>
          <torusGeometry args={[0.26, 0.065, 8, 20]} />
          <meshStandardMaterial color="#9E9E9E" metalness={0.9} roughness={0.12} />
        </mesh>
        <mesh position={[-0.22, -0.2, 0]} rotation={[0, 0, -Math.PI / 4.5]}>
          <cylinderGeometry args={[0.038, 0.038, 0.58, 8]} />
          <meshStandardMaterial color="#9E9E9E" metalness={0.9} roughness={0.12} />
        </mesh>
      </group>
      {/* Pivot screw */}
      <mesh>
        <sphereGeometry args={[0.085, 10, 10]} />
        <meshStandardMaterial color="#888" metalness={0.85} roughness={0.15} />
      </mesh>
    </group>
  )
}

/* ─── Button (4-hole disc) ───────────────────────────────────── */
function Button({ pos, rot, scale, color, eScale, speed, phase }: {
  pos: [number,number,number]; rot: [number,number,number]
  scale: number; color: string; eScale: number; speed: number; phase: number
}) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.rotation.x = rot[0] + t * speed * 0.35
    group.current.rotation.y = rot[1] + t * speed * 0.45
    group.current.position.y = pos[1] + Math.sin(t * speed * 0.62 + phase) * 0.38
  })
  const HOLES: [number, number][] = [[-0.14,-0.14],[-0.14,0.14],[0.14,-0.14],[0.14,0.14]]
  return (
    <group ref={group} position={pos} scale={scale}>
      <mesh>
        <cylinderGeometry args={[0.48, 0.48, 0.09, 28]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4 * eScale} metalness={0.3} roughness={0.5} transparent opacity={0.92} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.48, 0.042, 6, 28]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25 * eScale} metalness={0.4} roughness={0.4} />
      </mesh>
      {HOLES.map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <cylinderGeometry args={[0.058, 0.058, 0.14, 8]} />
          <meshStandardMaterial color="#180830" transparent opacity={0.88} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Ambient sparkle dust ───────────────────────────────────── */
function SparkleField({ count = 200, variant }: { count?: number; variant: 'full' | 'subtle' | 'light' }) {
  const pts = useRef<THREE.Points>(null)
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors    = new Float32Array(count * 3)
    const violet = new THREE.Color('#8B5CF6')
    const amber  = new THREE.Color('#C68A52')
    const white  = new THREE.Color('#ffffff')
    for (let i = 0; i < count; i++) {
      positions[i*3]   = (Math.random()-0.5)*28
      positions[i*3+1] = (Math.random()-0.5)*20
      positions[i*3+2] = (Math.random()-0.5)*12-3
      const c = i%5===0 ? amber : i%3===0 ? white : violet
      colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b
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
      <pointsMaterial size={variant==='light' ? 0.04 : 0.06} vertexColors transparent opacity={variant==='light' ? 0.55 : 0.9} sizeAttenuation />
    </points>
  )
}

/* ─── Mouse-follow camera ────────────────────────────────────── */
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
  const s      = variant==='subtle' ? 0.72 : variant==='light' ? 0.85 : 1
  const eScale = variant==='light' ? 0.65 : 1

  const needles = [
    { pos: [-6.5, 2.5,-3] as [number,number,number], rot: [0.5,0.2,0.3] as [number,number,number], scale:1.0*s, threadColor:'#8B5CF6', speed:0.50, phase:0.0 },
    { pos: [ 7.0,-1.5,-4] as [number,number,number], rot: [1.0,0.5,0.1] as [number,number,number], scale:0.75*s, threadColor:'#C68A52', speed:0.35, phase:1.2 },
    { pos: [-2.5,-4.5,-2] as [number,number,number], rot: [0.2,0.8,0.5] as [number,number,number], scale:0.65*s, threadColor:'#F472B6', speed:0.60, phase:2.4 },
    { pos: [ 4.5, 4.5,-5] as [number,number,number], rot: [0.7,0.3,0.2] as [number,number,number], scale:0.90*s, threadColor:'#8B5CF6', speed:0.40, phase:0.8 },
    { pos: [ 1.0,-5.5,-6] as [number,number,number], rot: [0.3,0.6,0.7] as [number,number,number], scale:1.10*s, threadColor:'#C68A52', speed:0.28, phase:3.1 },
  ]

  const spools = [
    { pos: [ 3.5, 1.5,-1.5] as [number,number,number], rot: [0,0.5,0] as [number,number,number], scale:0.85*s, threadColor:'#C68A52', speed:0.70, phase:0.5 },
    { pos: [-7.0,-2.0,-4]   as [number,number,number], rot: [0.3,0.2,0] as [number,number,number], scale:0.65*s, threadColor:'#8B5CF6', speed:0.55, phase:1.8 },
    { pos: [ 1.0, 5.0,-6]   as [number,number,number], rot: [0.2,0.7,0] as [number,number,number], scale:0.90*s, threadColor:'#F472B6', speed:0.45, phase:2.7 },
    { pos: [-2.5, 0.5,-1]   as [number,number,number], rot: [0.4,0.3,0] as [number,number,number], scale:0.55*s, threadColor:'#C68A52', speed:0.80, phase:0.2 },
    { pos: [ 8.0,-3.5,-5]   as [number,number,number], rot: [0.1,0.8,0] as [number,number,number], scale:0.70*s, threadColor:'#4B3B66', speed:0.50, phase:1.4 },
  ]

  const scissorsList = [
    { pos: [-4.5, 3.5,-4] as [number,number,number], rot: [0.3,0.5,1.2] as [number,number,number], scale:0.75*s, speed:0.38, phase:1.1 },
    { pos: [ 6.0, 2.0,-3] as [number,number,number], rot: [0.2,0.3,0.5] as [number,number,number], scale:0.85*s, speed:0.30, phase:2.3 },
    { pos: [ 2.5,-4.5,-4] as [number,number,number], rot: [0.5,0.2,0.8] as [number,number,number], scale:0.60*s, speed:0.48, phase:0.6 },
    { pos: [-1.0, 6.5,-8] as [number,number,number], rot: [0.1,0.6,0.3] as [number,number,number], scale:1.00*s, speed:0.22, phase:4.2 },
  ]

  const buttons = [
    { pos: [-5.5, 5.0,-7] as [number,number,number], rot: [0.2,0.7,0.1] as [number,number,number], scale:0.90*s, color:'#4B3B66', speed:0.38, phase:3.5 },
    { pos: [ 2.0,-2.5,-2] as [number,number,number], rot: [0.6,0.4,0.3] as [number,number,number], scale:0.55*s, color:'#C68A52', speed:0.62, phase:0.9 },
    { pos: [-3.5,-1.5,-3] as [number,number,number], rot: [0.8,0.2,0.5] as [number,number,number], scale:0.70*s, color:'#EC4899', speed:0.44, phase:2.0 },
    { pos: [ 5.5, 3.5,-6] as [number,number,number], rot: [0.3,0.9,0.2] as [number,number,number], scale:0.80*s, color:'#8B5CF6', speed:0.52, phase:1.5 },
  ]

  return (
    <>
      <ambientLight intensity={variant==='light' ? 0.65 : 0.5} />
      <directionalLight position={[5,5,5]}   intensity={variant==='light' ? 1.4 : 2.0} color="#8B5CF6" />
      <directionalLight position={[-5,-3,3]} intensity={variant==='light' ? 1.0 : 1.5} color="#C68A52" />
      <pointLight       position={[0,0,4]}   intensity={1.2} color="#ffffff" />
      <pointLight       position={[-4,3,0]}  intensity={variant==='light' ? 1.2 : 2.0} color="#4B3B66" />
      <pointLight       position={[4,-2,0]}  intensity={variant==='light' ? 1.2 : 2.0} color="#C68A52" />

      <CameraRig strength={variant==='subtle' ? 1.0 : variant==='light' ? 1.2 : 1.8} />
      <SparkleField count={variant==='light' ? 120 : variant==='subtle' ? 140 : 240} variant={variant} />
      {variant==='full' && <WavingCloth />}

      {needles.map((n,i)      => <Needle   key={`n${i}`}  {...n} eScale={eScale} />)}
      {spools.map((sp,i)      => <Spool    key={`sp${i}`} {...sp} eScale={eScale} />)}
      {scissorsList.map((sc,i) => <Scissors key={`sc${i}`} {...sc} />)}
      {buttons.map((b,i)      => <Button   key={`b${i}`}  {...b} eScale={eScale} />)}

      <EffectComposer>
        <Bloom
          intensity={variant==='full' ? 1.4 : variant==='light' ? 0.2 : 0.8}
          luminanceThreshold={variant==='light' ? 0.65 : 0.2}
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
