import { useRef, useMemo, Suspense, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function SRibbon() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()

  const { geometry, material } = useMemo(() => {
    const w = viewport.width * 0.45
    const h = viewport.height * 1.3
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
    const geo = new THREE.TubeGeometry(curve, 160, 0.5, 8, false)
    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] *= 0.18
      pos[i + 2] += Math.sin(pos[i] * 1.5 + pos[i + 1] * 1.8) * 0.3
    }
    geo.computeVertexNormals()
    const mat = new THREE.MeshStandardMaterial({
      color: '#00008b', metalness: 0.6, roughness: 0.22,
      side: THREE.DoubleSide, emissive: '#000044', emissiveIntensity: 0.45,
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
      const x = pos[i], y = pos[i + 1]
      pos[i + 2] = Math.sin(y * 1.8 + x * 2.2 + t * 1.5) * 0.30 +
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

function StaticRiver() {
  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }} aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00008b" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#0a72ef" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#7928ca" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d="M0,350 C200,450 400,200 600,300 C800,400 1000,150 1200,280 C1300,350 1400,250 1440,220 L1440,0 L0,0 Z" fill="url(#rg)" />
        <path d="M0,400 C300,250 500,450 800,350 C1000,280 1200,400 1440,320 L1440,0 L0,0 Z" fill="url(#rg)" opacity="0.5" />
      </svg>
    </div>
  )
}

function canRunWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}

function isLowEndDevice(): boolean {
  // 4GB+ RAM, 4+ cores → high-end. Otherwise conservative.
  const ram = (navigator as any).deviceMemory
  const cores = navigator.hardwareConcurrency || 0
  if (ram && ram < 4) return true
  if (cores && cores < 4) return true
  return false
}

export default function RiverFlow() {
  const [mode, setMode] = useState<'static' | '3d' | 'loading'>('loading')

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || !canRunWebGL() || isLowEndDevice()) {
      setMode('static')
    } else {
      setMode('3d')
    }
  }, [])

  if (mode === 'static') return <StaticRiver />
  if (mode === 'loading') return <StaticRiver />

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        performance={{ min: 0.3 }}
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
