import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ───── Particle Field ─────
function Particles({ count = 400 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null)

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const siz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4
      siz[i] = Math.random() * 0.03 + 0.01
    }
    return [pos, siz]
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()
    meshRef.current.rotation.y = t * 0.02
    meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.05
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#ffffff"
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

// ───── Polar Grid (spatial anchor) ─────
function PolarGrid() {
  const gridRef = useRef<THREE.PolarGridHelper>(null)

  useFrame((state) => {
    if (!gridRef.current) return
    gridRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.04
    gridRef.current.rotation.y = Math.cos(state.clock.getElapsedTime() * 0.03) * 0.03
  })

  return (
    <primitive
      ref={gridRef}
      object={new THREE.PolarGridHelper(6, 32, 24, 64, 0xffffff, 0xffffff)}
      position={[0, -3.5, -2]}
      rotation={[-0.6, 0, 0]}
    />
  )
}

// ───── Camera controller (mouse parallax) ─────
function CameraRig() {
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useFrame((state) => {
    // Smooth lerp towards mouse
    current.current.x += (target.current.x - current.current.x) * 0.02
    current.current.y += (target.current.y - current.current.y) * 0.02

    state.camera.position.x = current.current.x
    state.camera.position.y = current.current.y
    state.camera.lookAt(0, 0, 0)
  })

  // Track mouse globally
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', (e) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.current.y = (e.clientY / window.innerHeight - 0.5) * -1.5
    })
  }

  return null
}

// ───── Ambient glow orbs ─────
function GlowOrbs() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      child.position.y = Math.sin(t * 0.3 + i * 2) * 0.8
      child.position.x = Math.cos(t * 0.2 + i * 1.5) * 1.2
    })
  })

  return (
    <group ref={groupRef}>
      <mesh position={[-3, 2, -3]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#F5C518" transparent opacity={0.04} />
      </mesh>
      <mesh position={[4, -1, -3]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial color="#0a72ef" transparent opacity={0.03} />
      </mesh>
      <mesh position={[-2, -2.5, -3]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color="#7928ca" transparent opacity={0.03} />
      </mesh>
    </group>
  )
}

// ───── Scene ─────
function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <Particles count={400} />
      <PolarGrid />
      <GlowOrbs />
      <CameraRig />
    </>
  )
}

// ───── Export ─────
export default function ThreeBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
        }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
