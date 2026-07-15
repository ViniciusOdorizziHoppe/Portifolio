import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ───── S-Curve Ribbon (centered, z=0) ───── */
function SRibbon() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()

  const { geometry, material } = useMemo(() => {
    const w = viewport.width * 0.44
    const h = 5.5

    // S-curve spanning viewport height
    const points = [
      new THREE.Vector3(w * 0.15, h, 0),
      new THREE.Vector3(w * 0.6, h * 0.7, 0),
      new THREE.Vector3(w * 0.5, h * 0.35, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-w * 0.5, -h * 0.35, 0),
      new THREE.Vector3(-w * 0.55, -h * 0.7, 0),
      new THREE.Vector3(w * 0.35, -h, 0),
    ]

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.6)
    const geo = new THREE.TubeGeometry(curve, 240, 0.55, 8, false)

    // Flatten into ribbon
    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] *= 0.22
      const x = pos[i]
      const y = pos[i + 1]
      pos[i + 2] += Math.sin(x * 1.5 + y * 2.0) * 0.35
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
  }, [viewport.width])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()
    const scrollY = window.scrollY
    const maxScroll = document.body.scrollHeight - window.innerHeight
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0.5

    meshRef.current.position.x = (progress - 0.5) * viewport.width * 0.35
    meshRef.current.position.z = 0
    meshRef.current.rotation.z = Math.sin(t * 0.08) * 0.06

    const pos = geometry.attributes.position.array as Float32Array
    const phase = t + progress * 6
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      pos[i + 2] =
        Math.sin(x * 1.8 + y * 2.2 + phase * 1.5) * 0.42 +
        Math.cos(x * 2.5 - y * 1.6 + phase * 1.1) * 0.30 +
        Math.sin(x * 3.2 + y * 2.8 - phase * 0.7) * 0.18 +
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
      <ambientLight intensity={0.4} color="#ccccff" />
      <directionalLight position={[5, 8, 5]} intensity={2.8} color="#ffffff" />
      <directionalLight position={[-3, 2, -4]} intensity={0.7} color="#aaccff" />
      <pointLight position={[0, 3, 5]} intensity={1.5} color="#ffffff" />
    </>
  )
}

/* ───── Fixed Canvas (z-index 5 — middle layer) ───── */
export default function RiverFlow() {
  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 5 }} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.5, 9], fov: 48 }}
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

/* ───── River Banks (HTML cards with alternating z-index) ───── */

type Bank = {
  id: string
  title: string
  desc: string
  depth: 'foreground' | 'background'
  shore: 'EAST' | 'WEST'
  zIndex: number
}

const banks: Bank[] = [
  {
    id: '01',
    title: 'NORTHERN BANK',
    desc: 'A corrente pressiona a margem leste aqui, deixando a margem oeste aberta para este monólito repousar.',
    depth: 'foreground',
    shore: 'EAST',
    zIndex: 20,
  },
  {
    id: '02',
    title: 'SOUTHERN BANK',
    desc: 'Agora o rio curva para oeste, passando na frente desta placa. O fluxo corta a arquitetura, reivindicando o primeiro plano.',
    depth: 'background',
    shore: 'WEST',
    zIndex: 0,
  },
  {
    id: '03',
    title: 'EASTERN BEND',
    desc: 'Uma curva fechada para leste. O vidro repousa alto na margem oposta, refratando o azul profundo enquanto a corrente desliza por baixo.',
    depth: 'foreground',
    shore: 'EAST',
    zIndex: 20,
  },
  {
    id: '04',
    title: 'WESTERN BEND',
    desc: 'A curva final para oeste. O rio passa à frente deste plano, lançando sua luminância sobre a superfície antes de descer.',
    depth: 'background',
    shore: 'WEST',
    zIndex: 0,
  },
]

export function RiverBanks() {
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      {banks.map((bank, i) => {
        // Position: alternate right (EAST) / left (WEST) along the S
        const isEast = bank.shore === 'EAST'
        const topPercent = 8 + i * 22 // Spread vertically

        return (
          <div
            key={bank.id}
            className="absolute w-[260px] transition-all duration-1000"
            style={{
              top: `${topPercent}%`,
              right: isEast ? '4%' : 'auto',
              left: isEast ? 'auto' : '4%',
              zIndex: bank.zIndex,
            }}
          >
            {/* Glass card */}
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-5 shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] font-bold tracking-widest text-white/50 uppercase">
                  BANK // {bank.id}
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/20 text-white/40 uppercase">
                  {bank.depth === 'foreground' ? 'FOREGROUND' : 'BACKGROUND'}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-sans text-sm font-semibold tracking-wide text-white/90 mb-1.5">
                {bank.title}
              </h3>

              {/* Description */}
              <p className="text-[11px] leading-relaxed text-white/55">
                {bank.desc}
              </p>

              {/* Metadata */}
              <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
                <div>
                  <span className="font-mono text-[9px] text-white/30 uppercase">DEPTH</span>
                  <p className="font-mono text-[11px] text-white/60">{bank.depth === 'foreground' ? '+50px' : '-50px'}</p>
                </div>
                <div>
                  <span className="font-mono text-[9px] text-white/30 uppercase">SHORE</span>
                  <p className="font-mono text-[11px] text-white/60">{bank.shore}</p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
