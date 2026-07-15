import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ───── Card positions in 3D space (viewport-relative Y) ───── */
const CARD_POSITIONS = [
  { x: -2.8, y: 3.0 },
  { x: 3.0, y: 1.8 },
  { x: -3.2, y: 0.4 },
  { x: 2.5, y: -1.0 },
  { x: -2.5, y: -2.2 },
  { x: 3.2, y: -3.5 },
]

/* ───── White card mesh ───── */
function Card3D({ position, scrollY }: { position: { x: number; y: number }; scrollY: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!meshRef.current) return
    // Cards scroll vertically — map page scroll to 3D Y offset
    const pageHeight = document.body.scrollHeight - window.innerHeight
    const progress = pageHeight > 0 ? scrollY / pageHeight : 0
    // Cards span from top to bottom of 3D view
    const yRange = 7
    const yOffset = (0.5 - progress) * yRange
    meshRef.current.position.y = position.y + yOffset
    meshRef.current.position.x = position.x
    meshRef.current.position.z = 0.3

    // Subtle float
    const t = performance.now() * 0.001
    meshRef.current.rotation.z = Math.sin(t * 0.4 + position.x) * 0.04
    meshRef.current.rotation.x = Math.cos(t * 0.3 + position.y) * 0.03
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.6, 1.0, 0.08]} />
      <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} />
    </mesh>
  )
}

/* ───── S-Curve Ribbon ───── */
function SRibbon() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()

  const { geometry, material } = useMemo(() => {
    const w = viewport.width * 0.44
    const h = 4.5

    // S-curve: top-left to bottom-right
    const points = [
      new THREE.Vector3(-w, h, 0),
      new THREE.Vector3(w * 0.3, h * 0.65, 0),
      new THREE.Vector3(w * 0.4, h * 0.3, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-w * 0.4, -h * 0.3, 0),
      new THREE.Vector3(-w * 0.35, -h * 0.65, 0),
      new THREE.Vector3(w * 0.4, -h, 0),
    ]

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
    const geo = new THREE.TubeGeometry(curve, 220, 0.45, 6, false)

    // Flatten into ribbon
    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] *= 0.25
      pos[i + 2] += Math.sin(pos[i] * 1.5 + pos[i + 1] * 2.0) * 0.35
    }
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      color: '#00008b',
      metalness: 0.55,
      roughness: 0.28,
      side: THREE.DoubleSide,
      emissive: '#000044',
      emissiveIntensity: 0.4,
    })

    return { geometry: geo, material: mat }
  }, [viewport.width])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    // Scroll drives lateral sway
    const scrollY = window.scrollY
    const maxScroll = document.body.scrollHeight - window.innerHeight
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0.5

    meshRef.current.position.x = (progress - 0.5) * viewport.width * 0.4
    meshRef.current.rotation.z = Math.sin(t * 0.1) * 0.08
    meshRef.current.position.z = -0.2 // Behind cards

    // Flowing waves
    const pos = geometry.attributes.position.array as Float32Array
    const flowPhase = t + progress * 5
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      pos[i + 2] =
        Math.sin(x * 1.8 + y * 2.2 + flowPhase * 1.5) * 0.4 +
        Math.cos(x * 2.5 - y * 1.6 + flowPhase * 1.1) * 0.28 +
        Math.sin(x * 3.2 + y * 2.8 - flowPhase * 0.7) * 0.18 +
        Math.sin(x * 1.5 + y * 2.0) * 0.35
    }
    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.45} color="#ffffff" />
      <directionalLight position={[5, 8, 5]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-3, 2, -4]} intensity={0.6} color="#aaccff" />
      <pointLight position={[0, 3, 5]} intensity={1.2} color="#ffffff" />
    </>
  )
}

/* ───── Scene ───── */
function Scene() {
  const scrollY = useRef(0)

  useFrame(() => {
    scrollY.current = window.scrollY
  })

  return (
    <>
      <Lighting />
      <SRibbon />
      {CARD_POSITIONS.map((pos, i) => (
        <Card3D key={i} position={pos} scrollY={scrollY.current} />
      ))}
    </>
  )
}

/* ───── Fixed Canvas ───── */
export default function RiverFlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 48 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
