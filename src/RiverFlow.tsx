import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ───── Full-page S River ───── */
function SRibbon() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()

  const { geometry, material } = useMemo(() => {
    const w = viewport.width * 0.42
    const h = viewport.height * 0.55

    // S-curve spanning the viewport
    const points = [
      new THREE.Vector3(-w, h * 0.9, 0),
      new THREE.Vector3(w * 0.4, h * 0.6, 0),
      new THREE.Vector3(w * 0.5, h * 0.3, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-w * 0.5, -h * 0.3, 0),
      new THREE.Vector3(-w * 0.4, -h * 0.6, 0),
      new THREE.Vector3(w * 0.3, -h * 0.9, 0),
    ]

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
    const geo = new THREE.TubeGeometry(curve, 200, 0.5, 6, false)

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
    const scrollY = window.scrollY
    const maxScroll = document.body.scrollHeight - window.innerHeight
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0.5

    // Scroll shifts the ribbon laterally
    const xOffset = (progress - 0.5) * viewport.width * 0.5
    meshRef.current.position.x = xOffset
    meshRef.current.rotation.z = Math.sin(t * 0.12) * 0.1

    // Flowing river animation
    const pos = geometry.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      const flowSpeed = t + progress * 4
      const wave1 = Math.sin(x * 1.8 + y * 2.2 + flowSpeed * 1.5) * 0.45
      const wave2 = Math.cos(x * 2.5 - y * 1.6 + flowSpeed * 1.1) * 0.3
      const wave3 = Math.sin(x * 3.2 + y * 2.8 - flowSpeed * 0.7) * 0.2
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
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight position={[5, 8, 5]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-3, 2, -4]} intensity={0.7} color="#aaccff" />
      <pointLight position={[0, 4, 6]} intensity={1} color="#ffffff" />
    </>
  )
}

/* ───── Fixed Canvas ───── */
export default function RiverFlow() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Lighting />
          <SRibbon />
        </Suspense>
      </Canvas>
    </div>
  )
}

/* ───── Floating cards ───── */
export function RiverCards() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[5]" aria-hidden="true">
      {cards.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-xl bg-white shadow-lg"
          style={{
            top: c.top,
            left: c.left,
            width: '140px',
            height: '90px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
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
      ))}
    </div>
  )
}

const cards = [
  { top: '12%', left: '8%' },
  { top: '28%', left: '72%' },
  { top: '45%', left: '15%' },
  { top: '58%', left: '78%' },
  { top: '72%', left: '10%' },
  { top: '85%', left: '68%' },
  { top: '22%', left: '40%' },
  { top: '65%', left: '45%' },
]
