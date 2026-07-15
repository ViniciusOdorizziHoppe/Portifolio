import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function SRibbon() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()

  const { geometry, material } = useMemo(() => {
    const w = viewport.width * 0.45
    const h = viewport.height * 1.3

    // Vertical S: starts left, sweeps right, returns left
    const points = [
      new THREE.Vector3(w * 0.6, h, 0),
      new THREE.Vector3(-w * 0.5, h * 0.7, 0),
      new THREE.Vector3(-w * 0.7, h * 0.4, 0),
      new THREE.Vector3(w * 0.1, h * 0.1, 0),
      new THREE.Vector3(w * 0.7, -h * 0.1, 0),
      new THREE.Vector3(w * 0.7, -h * 0.4, 0),
      new THREE.Vector3(-w * 0.2, -h * 0.7, 0),
      new THREE.Vector3(-w * 0.5, -h, 0),
    ]

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.35)
    const geo = new THREE.TubeGeometry(curve, 220, 0.5, 8, false)

    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] *= 0.18
      const x = pos[i]
      const y = pos[i + 1]
      pos[i + 2] += Math.sin(x * 1.5 + y * 1.8) * 0.3
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
  }, [viewport.width, viewport.height])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    meshRef.current.position.set(0, 0, 0)
    meshRef.current.rotation.z = Math.sin(t * 0.04) * 0.02

    const pos = geometry.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      pos[i + 2] =
        Math.sin(y * 1.8 + x * 2.2 + t * 1.5) * 0.30 +
        Math.cos(y * 2.5 - x * 1.6 + t * 1.1) * 0.22 +
        Math.sin(y * 3.2 + x * 2.8 - t * 0.7) * 0.12 +
        Math.sin(x * 1.5 + y * 1.8) * 0.3
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
