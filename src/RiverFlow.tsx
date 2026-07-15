import { useRef, useMemo, Suspense, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ───── River Ribbon ───── */
function RiverRibbon({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()

  const geometry = useMemo(() => {
    const width = viewport.width * 3.5
    const height = 3.5
    const segmentsX = 240
    const segmentsY = 10

    const geo = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY)
    const pos = geo.attributes.position.array as Float32Array

    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      const wave1 = Math.sin(x * 0.8 + y * 1.5) * 1.2
      const wave2 = Math.cos(x * 1.3 - y * 0.7) * 0.6
      const wave3 = Math.sin(x * 2.1 + y * 2.3) * 0.3
      pos[i + 2] = wave1 + wave2 + wave3
    }

    geo.computeVertexNormals()
    return geo
  }, [viewport.width])

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#0b1e40',
      metalness: 0.7,
      roughness: 0.25,
      side: THREE.DoubleSide,
      emissive: '#030d1f',
      emissiveIntensity: 0.5,
    })
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return

    const t = state.clock.getElapsedTime()

    // Map scrollProgress (0-1) to horizontal displacement across viewport
    const xOffset = (scrollProgress - 0.5) * viewport.width * 2.2

    meshRef.current.position.x = xOffset
    meshRef.current.position.y = -1.2

    // Tilt + subtle rotation
    meshRef.current.rotation.x = -0.35
    meshRef.current.rotation.y = Math.sin(t * 0.25) * 0.25
    meshRef.current.rotation.z = Math.sin(t * 0.18) * 0.2

    // Animate vertices
    const pos = geometry.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i] - xOffset
      const y = pos[i + 1]
      const wave1 = Math.sin(x * 0.8 + y * 1.5 + t * 1.3) * 1.2
      const wave2 = Math.cos(x * 1.3 - y * 0.7 + t * 0.9) * 0.6
      const wave3 = Math.sin(x * 2.1 + y * 2.3 - t * 0.6) * 0.35
      pos[i + 2] = wave1 + wave2 + wave3
    }
    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.35} color="#1a2a5a" />
      <directionalLight position={[5, 8, 5]} intensity={1.8} color="#4466bb" />
      <directionalLight position={[-3, 2, -4]} intensity={0.5} color="#1a3a6a" />
      <pointLight position={[0, 4, 6]} intensity={1} color="#3355bb" />
    </>
  )
}

/* ───── Cards ───── */
const dummyCards = [
  { top: '8%', left: '5%' },
  { top: '28%', left: '22%' },
  { top: '12%', left: '42%' },
  { top: '30%', left: '60%' },
  { top: '10%', left: '78%' },
]

function Card({ top, left }: { top: string; left: string }) {
  return (
    <div
      className="absolute rounded-xl bg-white transition-transform duration-700 hover:scale-105"
      style={{
        top,
        left,
        width: '160px',
        height: '100px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1)',
        zIndex: 10,
      }}
    >
      <div className="flex h-full items-center justify-center p-3">
        <div className="space-y-2">
          <div className="mx-auto h-2 w-16 rounded bg-gray-100" />
          <div className="mx-auto h-2 w-24 rounded bg-gray-50" />
          <div className="mx-auto h-2 w-14 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

/* ───── Section ───── */
export default function RiverFlowSection() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const viewH = window.innerHeight

      // Progress: 0 when section enters viewport, 1 when it leaves
      const start = viewH * 0.8
      const end = -rect.height * 0.6
      const progress = 1 - (rect.top - end) / (start - end)
      setScrollProgress(Math.max(0, Math.min(1, progress)))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section ref={sectionRef} className="relative border-t border-vercel-border">
      {/* Label */}
      <div className="absolute left-6 top-6 z-20 flex items-center gap-3 pointer-events-none">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-white/50">
          Fluxo
        </span>
        <span className="h-px w-12 bg-white/15" />
      </div>

      {/* Cards layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {dummyCards.map((c, i) => (
          <Card key={i} top={c.top} left={c.left} />
        ))}
      </div>

      {/* 3D Canvas */}
      <div className="h-[500px] w-full" style={{ background: 'linear-gradient(180deg, #020817 0%, #0a1628 50%, #020817 100%)' }}>
        <Canvas
          camera={{ position: [0, 1.5, 8], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <Lighting />
            <RiverRibbon scrollProgress={scrollProgress} />
          </Suspense>
        </Canvas>
      </div>
    </section>
  )
}
