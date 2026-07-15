import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ───── Vertical S-Curve Ribbon ───── */
function SRibbon() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()

  const { geometry, material } = useMemo(() => {
    const w = viewport.width * 0.5
    const h = viewport.height * 1.2

    // Vertical S-curve with pronounced horizontal sway
    const points = [
      new THREE.Vector3(-w * 0.3, h, 0),
      new THREE.Vector3(w * 0.9, h * 0.75, 0),
      new THREE.Vector3(w * 0.7, h * 0.45, 0),
      new THREE.Vector3(-w * 0.1, h * 0.15, 0),
      new THREE.Vector3(-w * 0.7, -h * 0.15, 0),
      new THREE.Vector3(-w * 0.7, -h * 0.45, 0),
      new THREE.Vector3(w * 0.3, -h * 0.75, 0),
      new THREE.Vector3(w * 0.5, -h, 0),
    ]

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4)
    const geo = new THREE.TubeGeometry(curve, 200, 0.55, 8, false)

    // Flatten into ribbon
    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      // Flatten Z (depth) so ribbon stays thin front-to-back
      pos[i + 2] *= 0.2
      const x = pos[i]
      const y = pos[i + 1]
      pos[i + 2] += Math.sin(x * 1.5 + y * 1.8) * 0.35
    }
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      color: '#00008b',
      metalness: 0.6,
      roughness: 0.22,
      side: THREE.DoubleSide,
      emissive: '#000044',
      emissiveIntensity: 0.45,
    })

    return { geometry: geo, material: mat }
  }, [viewport.height])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()
    const scrollY = window.scrollY
    const maxScroll = document.body.scrollHeight - window.innerHeight
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0.5

    // Scroll shifts the ribbon vertically
    const yOffset = (0.5 - progress) * viewport.height * 0.6
    meshRef.current.position.y = yOffset
    meshRef.current.position.z = 0
    meshRef.current.rotation.z = Math.sin(t * 0.06) * 0.04

    // Flowing current
    const pos = geometry.attributes.position.array as Float32Array
    const phase = t + progress * 5
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      pos[i + 2] =
        Math.sin(y * 1.8 + x * 2.2 + phase * 1.5) * 0.35 +
        Math.cos(y * 2.5 - x * 1.6 + phase * 1.1) * 0.25 +
        Math.sin(y * 3.2 + x * 2.8 - phase * 0.7) * 0.15 +
        Math.sin(x * 1.5 + y * 1.8) * 0.35
    }
    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} color="#ccccff" />
      <directionalLight position={[5, 8, 5]} intensity={2.8} color="#ffffff" />
      <directionalLight position={[-3, 2, -4]} intensity={0.7} color="#aaccff" />
      <pointLight position={[0, 3, 5]} intensity={1.5} color="#ffffff" />
    </>
  )
}

/* ───── Fixed Canvas (below content, z=0) ───── */
export default function RiverFlow() {
  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
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
