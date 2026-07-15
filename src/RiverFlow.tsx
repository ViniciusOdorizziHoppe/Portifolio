import { useRef, useMemo, Suspense, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ───── S-Curve Ribbon ───── */
function SRibbon({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()

  const { geometry, material } = useMemo(() => {
    const w = viewport.width * 0.45
    const h = viewport.height * 0.35

    const points = [
      new THREE.Vector3(-w, -h, 0),
      new THREE.Vector3(-w * 0.7, -h * 0.6, 0),
      new THREE.Vector3(-w * 0.2, -h * 0.2, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(w * 0.2, h * 0.2, 0),
      new THREE.Vector3(w * 0.7, h * 0.6, 0),
      new THREE.Vector3(w, h, 0),
    ]

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
    const geo = new THREE.TubeGeometry(curve, 180, 0.55, 6, false)

    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] *= 0.3
      const x = pos[i]
      const y = pos[i + 1]
      pos[i + 2] += Math.sin(x * 1.5 + y * 2.0) * 0.4
    }
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      color: '#00008b',
      metalness: 0.5,
      roughness: 0.3,
      side: THREE.DoubleSide,
      emissive: '#000066',
      emissiveIntensity: 0.3,
    })

    return { geometry: geo, material: mat }
  }, [viewport.width, viewport.height])

  useFrame((state) => {
    if (!meshRef.current) return

    const t = state.clock.getElapsedTime()
    const xOffset = (scrollProgress - 0.5) * viewport.width * 0.3

    meshRef.current.position.x = xOffset
    meshRef.current.rotation.z = Math.sin(t * 0.15) * 0.12

    const pos = geometry.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      const wave1 = Math.sin(x * 1.8 + y * 2.2 + t * 1.5) * 0.45
      const wave2 = Math.cos(x * 2.5 - y * 1.6 + t * 1.1) * 0.3
      const wave3 = Math.sin(x * 3.2 + y * 2.8 - t * 0.7) * 0.2
      pos[i + 2] = wave1 + wave2 + wave3 + Math.sin(x * 1.5 + y * 2.0) * 0.4
    }
    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight position={[5, 8, 5]} intensity={2.0} color="#ffffff" />
      <directionalLight position={[-3, 2, -4]} intensity={0.8} color="#aaccff" />
      <pointLight position={[0, 4, 6]} intensity={1.2} color="#ffffff" />
    </>
  )
}

/* ───── Hero Background Canvas ───── */
export function HeroRibbon() {
  const [scrollProgress, setScrollProgress] = useState(0.5)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = document.body.scrollHeight - window.innerHeight
      setScrollProgress(maxScroll > 0 ? scrollY / maxScroll : 0.5)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 1, 9], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Lighting />
          <SRibbon scrollProgress={scrollProgress} />
        </Suspense>
      </Canvas>
    </div>
  )
}

/* ───── Cards ───── */
const dummyCards = [
  { top: '5%', left: '5%' },
  { top: '20%', left: '30%' },
  { top: '8%', left: '55%' },
  { top: '22%', left: '75%' },
  { top: '35%', left: '15%' },
  { top: '38%', left: '48%' },
  { top: '32%', left: '80%' },
]

function Card({ top, left }: { top: string; left: string }) {
  return (
    <div
      className="absolute rounded-xl bg-white transition-transform duration-700 hover:scale-105"
      style={{
        top,
        left,
        width: '140px',
        height: '90px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1)',
        zIndex: 10,
      }}
    >
      <div className="flex h-full items-center justify-center p-3">
        <div className="space-y-1.5">
          <div className="mx-auto h-1.5 w-14 rounded bg-gray-100" />
          <div className="mx-auto h-1.5 w-20 rounded bg-gray-50" />
          <div className="mx-auto h-1.5 w-12 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

/* ───── Seção com cards (fundo branco) ───── */
export default function RiverFlowSection() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const viewH = window.innerHeight
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
    <section ref={sectionRef} className="relative bg-white">
      <div className="absolute left-6 top-6 z-20 flex items-center gap-3 pointer-events-none">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-vercel-muted">
          Fluxo
        </span>
        <span className="h-px w-12 bg-vercel-border" />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        {dummyCards.map((c, i) => (
          <Card key={i} top={c.top} left={c.left} />
        ))}
      </div>

      <div className="h-[500px] w-full">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Lighting />
            <SRibbon scrollProgress={scrollProgress} />
          </Suspense>
        </Canvas>
      </div>
    </section>
  )
}
