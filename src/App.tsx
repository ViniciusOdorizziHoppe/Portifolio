import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { motion, useInView } from 'framer-motion'

function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-vercel-black">
      <Nav />
      <Hero />
      <Projects />
      <OrbitingStack />
      <Achievements />
      <Footer />
    </div>
  )
}

/* ───── Nav ───── */
function Nav() {
  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md"
      style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <span className="font-mono text-sm font-medium uppercase tracking-tight">VH</span>
        <div className="flex items-center gap-6">
          <a href="#projetos" className="text-sm font-medium text-vercel-gray transition-colors hover:text-vercel-black">Projetos</a>
          <a href="#stack" className="text-sm font-medium text-vercel-gray transition-colors hover:text-vercel-black">Stack</a>
          <a href="#contato" className="rounded-full bg-vercel-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80">Contato</a>
        </div>
      </div>
    </motion.header>
  )
}

/* ───── 3D Wave Background (Three.js) ───── */
function WaveBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Dynamic import to avoid SSR issues
    let anim = 0
    let cleanup: (() => void) | null = null

    import('three').then((THREE) => {
      if (!container.isConnected) return

      const width = container.clientWidth
      const height = container.clientHeight
      if (width === 0 || height === 0) return

      // Scene
      const scene = new THREE.Scene()

      // Camera — looking down at the wave from above
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
      camera.position.set(0, 6, 10)
      camera.lookAt(0, 0, 0)

      // Renderer
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      container.appendChild(renderer.domElement)
      renderer.domElement.style.position = 'absolute'
      renderer.domElement.style.inset = '0'

      // Lights for 3D depth
      const ambient = new THREE.AmbientLight('#191970', 0.6)
      scene.add(ambient)
      const dir = new THREE.DirectionalLight('#00008b', 1.2)
      dir.position.set(5, 10, 5)
      scene.add(dir)
      const dir2 = new THREE.DirectionalLight('#4169e1', 0.5)
      dir2.position.set(-5, 3, -3)
      scene.add(dir2)

      // Wave geometry — subdivided plane
      const segments = 120
      const size = 14
      const geo = new THREE.PlaneGeometry(size, size, segments, segments)
      geo.rotateX(-Math.PI / 2.5) // tilt for perspective

      // Material — blue metallic
      const mat = new THREE.MeshStandardMaterial({
        color: '#00008b',
        metalness: 0.3,
        roughness: 0.5,
        flatShading: false,
        side: THREE.DoubleSide,
      })

      const mesh = new THREE.Mesh(geo, mat)
      scene.add(mesh)

      // Store original positions for wave calculation
      const origPositions = new Float32Array(geo.attributes.position.array)

      const resize = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        if (w === 0 || h === 0) return
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }

      const start = performance.now()
      const draw = () => {
        const t = (performance.now() - start) * 0.001
        const pos = geo.attributes.position.array as Float32Array

        for (let i = 0; i < pos.length; i += 3) {
          const ox = origPositions[i]
          const oy = origPositions[i + 1]
          // Flowing downward: Y drives the wave phase
          const wave1 = Math.sin(ox * 1.8 + t * 1.2) * Math.cos(oy * 1.5 + t * 0.6) * 0.5
          const wave2 = Math.sin(ox * 2.5 - t * 0.9) * Math.sin(oy * 2.0 + t * 0.7) * 0.35
          const wave3 = Math.cos(ox * 3.0 + oy * 1.8 + t * 0.4) * 0.2
          pos[i + 2] = wave1 + wave2 + wave3
        }
        geo.attributes.position.needsUpdate = true
        geo.computeVertexNormals()

        renderer.render(scene, camera)
        anim = requestAnimationFrame(draw)
      }
      anim = requestAnimationFrame(draw)

      window.addEventListener('resize', resize)

      cleanup = () => {
        cancelAnimationFrame(anim)
        window.removeEventListener('resize', resize)
        renderer.dispose()
        geo.dispose()
        mat.dispose()
        container.removeChild(renderer.domElement)
      }
    })

    return () => {
      cancelAnimationFrame(anim)
      cleanup?.()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ background: 'linear-gradient(180deg, #00008b 0%, #191970 100%)' }}
    />
  )
}

/* ───── Hero ───── */
function Hero() {
  const fullText = 'Vinícius Odorizzi'
  const [displayed, setDisplayed] = useState('')
  const [cursor, setCursor] = useState(true)

  useEffect(() => {
    if (displayed.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayed(fullText.slice(0, displayed.length + 1))
      }, 80)
      return () => clearTimeout(timeout)
    }
  }, [displayed])

  useEffect(() => {
    const interval = setInterval(() => setCursor((c) => !c), 530)
    return () => clearInterval(interval)
  }, [])

  const splitIdx = 'Vinícius '.length
  const firstPart = displayed.slice(0, Math.min(displayed.length, splitIdx))
  const secondPart = displayed.slice(splitIdx)

  return (
    <section className="relative overflow-hidden">
      <WaveBackground />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 pb-20 pt-32 md:pt-48">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-mono text-xs font-medium uppercase tracking-wide text-vercel-muted"
        >
          Presidente Getúlio, SC
        </motion.p>

        <h1 className="mt-4 max-w-3xl font-sans text-5xl font-semibold leading-none tracking-[-0.05em] md:text-7xl md:tracking-[-0.04em]">
          <span>{firstPart}</span>
          <span className="font-[family-name:var(--font-cinzel)] font-semibold">{secondPart}</span>
          <span className={`font-light ${cursor ? 'opacity-100' : 'opacity-0'} text-develop-blue transition-opacity`}>|</span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-6 text-xl leading-relaxed text-vercel-gray md:text-2xl"
        >
          Full-Stack Developer
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <a href="https://github.com/ViniciusOdorizziHoppe" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-vercel-black transition-all hover:bg-vercel-bg"
            style={{ boxShadow: 'rgb(235,235,235) 0px 0px 0px 1px' }}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
          <a href="https://linkedin.com/in/viniciusodorizzi" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-vercel-black transition-all hover:bg-vercel-bg"
            style={{ boxShadow: 'rgb(235,235,235) 0px 0px 0px 1px' }}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
          <a href="mailto:viniciusodorizzi25@gmail.com"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white bg-vercel-black transition-opacity hover:opacity-80">
            Email
          </a>
        </motion.div>
      </div>
    </section>
  )
}

/* ───── Projects ───── */
function Projects() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="projetos" className="relative mx-auto max-w-[1200px] px-6 pb-20" ref={ref}>
      <div className="mb-12 flex items-center gap-3">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-develop-blue">Projetos</span>
        <span className="h-px flex-1 bg-vercel-border" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <motion.a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="group relative overflow-hidden rounded-xl bg-vercel-bg transition-all hover:shadow-lg"
            style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}
          >
            {p.image ? (
              <img src={p.image} alt={p.name} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div
                className="flex h-48 items-center justify-center transition-transform duration-500 group-hover:scale-105"
                style={{ background: p.gradient }}
              >
                <span className="select-none font-mono text-4xl font-bold text-white/30">{p.initial}</span>
              </div>
            )}
            <div className="p-5">
              <h3 className="font-sans text-lg font-semibold leading-tight tracking-[-0.02em]">{p.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-vercel-gray">{p.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full bg-[#ebf5ff] px-2 py-0.5 font-mono text-[11px] font-medium text-[#0068d6]">{t}</span>
                ))}
                {p.tags.length > 3 && (
                  <span className="rounded-full bg-vercel-border px-2 py-0.5 font-mono text-[11px] text-vercel-muted">+{p.tags.length - 3}</span>
                )}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-white px-5 py-2 text-sm font-medium text-vercel-black">Visitar →</span>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  )
}

/* ───── Orbiting Stack ───── */
function OrbitingStack() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  const outerItems = [
    { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
    { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-plain.svg' },
    { name: 'Tailwind', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg' },
    { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg' },
    { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
    { name: 'MongoDB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg' },
    { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg' },
    { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg' },
    { name: 'Vite', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg' },
    { name: 'Java', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg' },
    { name: 'MySQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg' },
    { name: 'Figma', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg' },
  ]

  const innerItems = [
    { name: 'Express', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg' },
    { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg' },
    { name: 'Vercel', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vercel/vercel-original.svg' },
    { name: 'Stripe', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/stripe/stripe-original.svg' },
  ]

  const radius = 220
  const innerRadius = 130

  return (
    <section id="stack" className="border-t border-vercel-border mx-auto max-w-[1200px] px-6 py-20" ref={ref}>
      <div className="mb-12 flex items-center gap-3">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-preview-pink">Stack</span>
        <span className="h-px flex-1 bg-vercel-border" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="relative mx-auto flex h-[560px] w-[560px] items-center justify-center max-sm:h-[360px] max-sm:w-[360px]"
      >
        {/* Outer orbit */}
        <div className="absolute inset-0 animate-[spin_30s_linear_infinite]">
          {outerItems.map((item, i) => {
            const angle = (i / outerItems.length) * 2 * Math.PI - Math.PI / 2
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            return (
              <div
                key={item.name}
                className="absolute flex h-10 w-10 items-center justify-center rounded-xl border border-vercel-border bg-white shadow-sm transition-all hover:border-develop-blue hover:shadow-md max-sm:h-7 max-sm:w-7"
                style={{
                  left: `calc(50% + ${x}px - 20px)`,
                  top: `calc(50% + ${y}px - 20px)`,
                }}
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  className="h-5 w-5 max-sm:h-3.5 max-sm:w-3.5"
                  style={{ animation: 'spin 30s linear infinite', animationDirection: 'reverse' }}
                />
              </div>
            )
          })}
        </div>

        {/* Inner orbit (reverse) */}
        <div className="absolute inset-0 animate-[spin_20s_linear_infinite]" style={{ animationDirection: 'reverse' }}>
          {innerItems.map((item, i) => {
            const angle = (i / innerItems.length) * 2 * Math.PI - Math.PI / 2
            const x = Math.cos(angle) * innerRadius
            const y = Math.sin(angle) * innerRadius
            return (
              <div
                key={item.name}
                className="absolute flex h-9 w-9 items-center justify-center rounded-lg border border-vercel-border bg-white/90 shadow-sm transition-all hover:border-develop-blue max-sm:h-6 max-sm:w-6"
                style={{
                  left: `calc(50% + ${x}px - 18px)`,
                  top: `calc(50% + ${y}px - 18px)`,
                }}
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  className="h-4 w-4 max-sm:h-3 max-sm:w-3"
                  style={{ animation: 'spin 20s linear infinite' }}
                />
              </div>
            )
          })}
        </div>

        {/* Center stats */}
        <div className="z-10 flex flex-col items-center text-center">
          <span className="font-mono text-4xl font-semibold text-develop-blue max-sm:text-2xl">681<span className="text-vercel-muted">+</span></span>
          <span className="mt-1 text-xs text-vercel-gray">contribuições</span>
          <span className="mt-3 font-mono text-2xl font-semibold text-vercel-black max-sm:text-lg">26</span>
          <span className="mt-0.5 text-xs text-vercel-gray">repositórios</span>
          <span className="mt-3 rounded-full bg-vercel-black px-3 py-1 font-mono text-[10px] font-medium uppercase text-white">Técnico em Informática</span>
        </div>
      </motion.div>
    </section>
  )
}

/* ───── Achievements ───── */
function Achievements() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section className="border-t border-vercel-border mx-auto max-w-[1200px] px-6 py-20" ref={ref}>
      <div className="mb-12 flex items-center gap-3">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-ship-red">Conquistas</span>
        <span className="h-px flex-1 bg-vercel-border" />
      </div>
      <div className="grid gap-1">
        {achievements.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="flex items-start gap-4 rounded-lg p-4 transition-colors hover:bg-vercel-bg"
          >
            <span className="mt-0.5 font-mono text-sm text-vercel-muted">{a.year}</span>
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-vercel-gray">{a.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* ───── Footer ───── */
function Footer() {
  return (
    <footer id="contato" className="border-t border-vercel-border bg-vercel-bg">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-6 py-12 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-lg font-medium"
        >
          Vamos conversar?
        </motion.p>
        <a href="mailto:viniciusodorizzi25@gmail.com"
          className="font-mono text-sm text-link-blue underline underline-offset-4 transition-colors hover:text-vercel-black">
          viniciusodorizzi25@gmail.com
        </a>
        <p className="mt-4 text-xs text-vercel-muted">viniciusodorizzi.com &copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}

/* ───── Data ───── */
const projects = [
  {
    name: 'MediaTio Vehicle Nexus',
    desc: 'Intermediação de veículos com Meta Ads. CPA R$17, CTR 7.85%. Pipeline de leads automatizado.',
    url: 'https://app.mediatio.api.br',
    tags: ['React', 'TypeScript', 'Node.js', 'Meta Ads'],
    initial: 'MV',
    gradient: 'linear-gradient(135deg, #0a72ef, #7928ca)',
  },
  {
    name: 'Morph',
    desc: 'SaaS de transformação de fotos com IA. Stripe com PIX e assinaturas recorrentes.',
    url: 'https://morph-one-tan.vercel.app',
    tags: ['SaaS', 'IA', 'Stripe', 'JavaScript'],
    initial: 'MO',
    gradient: 'linear-gradient(135deg, #de1d8d, #ff5b4f)',
    image: '/projects/morph.png',
  },
  {
    name: 'LexiCube',
    desc: 'Análise de notícias com IA. Projeto de bolsa PVI no IFC Ibirama.',
    url: 'https://github.com/ViniciusOdorizziHoppe/lexicube',
    tags: ['Python', 'IA', 'NLP', 'Bolsa PVI'],
    initial: 'LC',
    gradient: 'linear-gradient(135deg, #7928ca, #0a72ef)',
  },
  {
    name: 'RankBR',
    desc: 'Rankings com React, Vite, Tailwind, Express + TypeScript. Deploy Vercel + Render + Neon PG.',
    url: 'https://rankbr.vercel.app',
    tags: ['React', 'Express', 'TypeScript', 'Neon PG'],
    initial: 'RK',
    gradient: 'linear-gradient(135deg, #171717, #4d4d4d)',
    image: '/projects/rankbr.png',
  },
  {
    name: 'FIPE na Placa',
    desc: 'PWA para consulta de veículos pela placa. Publicada e em produção.',
    url: '#',
    tags: ['PWA', 'JavaScript', 'API'],
    initial: 'FP',
    gradient: 'linear-gradient(135deg, #0a72ef, #00c6ff)',
  },
  {
    name: 'Opinai — Hackathon UDESC',
    desc: 'Líder técnico no desenvolvimento de solução com IA para feedbacks.',
    url: '#',
    tags: ['Hackathon', 'IA', 'Liderança'],
    initial: 'OP',
    gradient: 'linear-gradient(135deg, #ff5b4f, #de1d8d)',
  },
]

const achievements = [
  { year: '2023', title: 'Menção Honrosa OBMEP', desc: 'Olimpíada Brasileira de Matemática das Escolas Públicas' },
  { year: '2024', title: 'Menção Honrosa OBMEP', desc: 'Segundo ano consecutivo com destaque em matemática' },
  { year: '2025', title: 'Bolsa PVI — IFC', desc: 'Projeto LexiCube: análise de notícias com inteligência artificial' },
  { year: '2026', title: '4 Chrome Extensions', desc: 'Extensões publicadas na Chrome Web Store' },
]

export default App
