import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { motion, useInView } from 'framer-motion'

const ThreeBackground = lazy(() => import('./ThreeBackground'))

// ═══════════════════════════════════════════
// APP
// ═══════════════════════════════════════════
function App() {
  return (
    <div className="min-h-screen bg-[--color-bg] font-sans text-[--color-text] antialiased">
      <Suspense
        fallback={
          <div
            className="pointer-events-none fixed inset-0"
            style={{
              zIndex: 0,
              background:
                'radial-gradient(ellipse 80% 60% at 30% 20%, rgba(245,197,24,0.04) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 70% 80%, rgba(10,114,239,0.04) 0%, transparent 60%)',
            }}
            aria-hidden="true"
          />
        }
      >
        <ThreeBackground />
      </Suspense>

      <div className="relative z-10">
        <Nav />
        <Hero />
        <Services />
        <Projects />
        <Testimonials />
        <Stack />
        <Articles />
        <Contact />
        <Footer />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════
function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(9,9,11,0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid transparent',
      }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <a href="#" className="font-[family-name:var(--font-cinzel)] text-base font-semibold tracking-tight text-[--color-text] no-underline">
          Vinícius <span className="text-[--color-accent]">Odorizzi</span>
        </a>

        <nav className="flex items-center gap-6 md:gap-8">
          <a href="#servicos" className="text-sm text-[--color-text-secondary] hover:text-[--color-text] transition-colors no-underline">Serviços</a>
          <a href="#projetos" className="text-sm text-[--color-text-secondary] hover:text-[--color-text] transition-colors no-underline">Projetos</a>
          <a href="#stack" className="text-sm text-[--color-text-secondary] hover:text-[--color-text] transition-colors no-underline">Stack</a>
          <a href="#contato" className="btn-primary text-sm !py-2.5 !px-5 !text-[13px] no-underline">
            Contratar
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </a>
        </nav>
      </div>
    </motion.header>
  )
}

// ═══════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════
function Hero() {
  const [displayed, setDisplayed] = useState('')
  const [cursor, setCursor] = useState(true)
  const fullText = 'Vinícius Odorizzi.'

  useEffect(() => {
    if (displayed.length < fullText.length) {
      const t = setTimeout(() => setDisplayed(fullText.slice(0, displayed.length + 1)), 60)
      return () => clearTimeout(t)
    }
  }, [displayed])

  useEffect(() => {
    const i = setInterval(() => setCursor((c) => !c), 530)
    return () => clearInterval(i)
  }, [])

  const splitIdx = 'Vinícius '.length
  const first = displayed.slice(0, Math.min(displayed.length, splitIdx))
  const second = displayed.slice(splitIdx)

  return (
    <section className="relative spotlight">
      <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-32 md:pt-52">
        {/* Availability badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 font-mono text-[11px] font-medium text-green-400 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            disponível · Q3 2026
          </span>
        </motion.div>

        {/* Typewriter name */}
        <h1 className="max-w-3xl font-sans text-[clamp(48px,8vw,96px)] font-black leading-[0.95] tracking-[-0.04em]">
          <span className="text-gradient">{first}</span>
          <span className="font-[family-name:var(--font-cinzel)] text-[--color-accent]">{second}</span>
          <span
            className={`font-light ${cursor ? 'opacity-100' : 'opacity-0'} text-[--color-text-tertiary]`}
          >
            |
          </span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 max-w-xl text-[17px] leading-relaxed text-[--color-text-secondary]"
        >
          Full-stack developer. Crio aplicações web que funcionam, convertem e escalam —
          do design ao deploy, sem atalhos.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-2 font-mono text-xs text-[--color-text-tertiary]"
        >
          {'//'} React · TypeScript · Node.js · Python · Java
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-10 flex flex-wrap gap-4"
        >
          <a href="#contato" className="btn-primary">
            Solicitar orçamento
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a href="#projetos" className="btn-secondary">
            Ver projetos
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════
const services = [
  {
    title: 'Sites & Landings',
    desc: 'Landing pages que convertem, sites institucionais e portfólios profissionais. Design → código → deploy.',
    tech: ['React', 'Vite', 'Tailwind', 'SEO'],
    color: '#0a72ef',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    title: 'Automações',
    desc: 'Scripts, bots, integrações e fluxos que eliminam trabalho manual. Economize horas por semana.',
    tech: ['Python', 'Node.js', 'APIs', 'Chrome Ext'],
    color: '#7928ca',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: 'Apps & APIs',
    desc: 'Aplicações web completas com backend, banco de dados, pagamentos e painéis administrativos.',
    tech: ['Express', 'MongoDB', 'Stripe', 'TypeScript'],
    color: '#F5C518',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7" />
        <path d="M16 3H8l-1 4h10l-1-4z" />
        <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
]

function Services() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="servicos" ref={ref} className="relative spotlight-bottom">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[--color-accent] mb-3">
            Serviços
          </h2>
          <p className="text-[clamp(28px,5vw,48px)] font-black tracking-[-0.03em] mb-3">
            O que eu faço de melhor.
          </p>
          <p className="text-[15px] text-[--color-text-secondary] max-w-lg mb-12">
            Cada serviço é pensado para entregar resultado, não apenas código.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass group relative p-6 transition-all duration-300 hover:bg-[rgba(255,255,255,0.05)] hover:-translate-y-1"
            >
              {/* Icon */}
              <div
                className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110"
                style={{ background: s.color }}
              >
                {s.icon}
              </div>

              <h3 className="font-sans text-lg font-semibold tracking-[-0.02em] mb-2">{s.title}</h3>
              <p className="text-sm leading-relaxed text-[--color-text-secondary] mb-4">{s.desc}</p>

              <div className="flex flex-wrap gap-1.5">
                {s.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-[rgba(255,255,255,0.06)] px-2 py-0.5 font-mono text-[10px] font-medium text-[--color-text-tertiary]"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Hover accent line */}
              <div
                className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ background: s.color }}
              />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="#contato" className="btn-secondary">
            Preciso de algo personalizado
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════
interface Project {
  initials: string
  name: string
  desc: string
  tech: string[]
  meta: string[]
  metric: string
  url: string
  github?: string
  gradient: string
}

const projects: Project[] = [
  {
    initials: 'MO',
    name: 'Morph',
    desc: 'SaaS de transformação de fotos com IA. Stripe com PIX e assinaturas recorrentes. Do upload ao checkout em segundos.',
    tech: ['JavaScript', 'Stripe API', 'OpenAI', 'Serverless'],
    meta: ['SaaS', 'IA'],
    metric: 'PIX + Stripe',
    url: 'https://morph-one-tan.vercel.app',
    github: 'https://github.com/ViniciusOdorizziHoppe/morph',
    gradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a72ef 100%)',
  },
  {
    initials: 'LC',
    name: 'LexiCube',
    desc: 'Análise automática de notícias com IA — classificação, sumarização e detecção de viés. Projeto de pesquisa com bolsa PVI.',
    tech: ['Python', 'Transformers', 'scikit-learn', 'FastAPI'],
    meta: ['NLP', 'Bolsa PVI'],
    metric: 'Pesquisa IFC',
    url: 'https://github.com/ViniciusOdorizziHoppe/lexicube',
    github: 'https://github.com/ViniciusOdorizziHoppe/lexicube',
    gradient: 'linear-gradient(135deg, #1a0a2e 0%, #7928ca 50%, #00008b 100%)',
  },
  {
    initials: 'RK',
    name: 'RankBR',
    desc: 'Plataforma de rankings com dados em tempo real — dashboards, filtros e comparativos. Deploy na Vercel + Render.',
    tech: ['React', 'Express', 'TypeScript', 'Neon PG'],
    meta: ['Plataforma', 'Dados'],
    metric: 'Vercel + Render',
    url: 'https://rankbr.vercel.app',
    github: 'https://github.com/ViniciusOdorizziHoppe/RankBR',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a2a4e 50%, #0a72ef 100%)',
  },
]

function Projects() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, i: number) => {
    const card = cardsRef.current[i]
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -8
    const rotateY = ((x - centerX) / centerX) * 8
    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`
  }

  const handleMouseLeave = (i: number) => {
    const card = cardsRef.current[i]
    if (!card) return
    card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
  }

  return (
    <section id="projetos" ref={ref} className="relative">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[--color-accent] mb-3">
            Projetos
          </h2>
          <p className="text-[clamp(28px,5vw,48px)] font-black tracking-[-0.03em] mb-12">
            Sistemas em produção.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <motion.div
              key={p.name}
              ref={(el) => { cardsRef.current[i] = el }}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={() => handleMouseLeave(i)}
              className="tilt-3d group relative overflow-hidden rounded-2xl p-5 transition-shadow duration-300 hover:shadow-2xl"
              style={{ background: p.gradient, minHeight: '220px' }}
            >
              {/* Watermark initials */}
              <div className="pointer-events-none absolute -bottom-4 -right-2 select-none font-[family-name:var(--font-cinzel)] text-[7rem] font-bold leading-none text-white/[0.05]">
                {p.initials}
              </div>

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col">
                {/* Meta labels */}
                <div className="mb-3 flex items-center gap-1.5">
                  {p.meta.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[10px] font-medium text-white/90 backdrop-blur-sm"
                    >
                      {m}
                    </span>
                  ))}
                </div>

                <h3 className="font-sans text-lg font-bold tracking-[-0.02em] text-white mb-1.5">
                  {p.name}
                </h3>
                <p className="text-sm leading-relaxed text-white/70 mb-auto">{p.desc}</p>

                {/* Tech tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tech.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/65"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Bottom row */}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="font-mono text-xs font-semibold text-white/85">{p.metric}</span>
                  <div className="flex items-center gap-3">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-white/55 hover:text-[--color-accent] transition-colors no-underline"
                    >
                      demo →
                    </a>
                    {p.github && (
                      <a
                        href={p.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-white/45 hover:text-[--color-accent] transition-colors no-underline"
                      >
                        código →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <a href="#contato" className="btn-primary">
            Gostou do que viu? Vamos construir o seu projeto.
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════
// TESTIMONIALS
// ═══════════════════════════════════════════
const testimonials = [
  {
    quote:
      'O Vinícius pegou uma ideia solta e entregou um sistema completo em semanas. Profissionalismo de gente grande com 16 anos.',
    name: 'Cliente Silvania',
    role: 'Projeto Imobiliária',
  },
  {
    quote:
      'Contratei para automatizar um processo manual que me tomava 4h por dia. Hoje rola sozinho. Melhor investimento do ano.',
    name: 'Cliente RankBR',
    role: 'Plataforma de Dados',
  },
  {
    quote:
      'Destaque no Hackathon UDESC como líder técnico. Capacidade de resolver problema real sob pressão e entregar funcionando.',
    name: 'Prof. IFC Ibirama',
    role: 'Hackathon UDESC 2025',
  },
]

function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative spotlight">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[--color-border] to-transparent" />

      <div ref={ref} className="mx-auto max-w-[1200px] px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[--color-accent] mb-3">
            Depoimentos
          </h2>
          <p className="text-[clamp(28px,5vw,48px)] font-black tracking-[-0.03em]">
            Quem já trabalhou comigo.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass relative p-6"
            >
              {/* Quote mark */}
              <svg
                className="mb-4 h-8 w-8 text-[--color-accent]/15"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              <p className="text-sm leading-relaxed text-[--color-text-secondary] mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 border-t border-[--color-border] pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[--color-accent] to-[#e0b010] text-xs font-bold text-[#0a0a0a]">
                  {t.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[--color-text]">{t.name}</p>
                  <p className="text-xs text-[--color-text-tertiary]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════
// STACK
// ═══════════════════════════════════════════
const techIcons = [
  { name: 'React', color: '#61DAFB' },
  { name: 'TypeScript', color: '#3178C6' },
  { name: 'Node.js', color: '#339933' },
  { name: 'Python', color: '#3776AB' },
  { name: 'Tailwind', color: '#06B6D4' },
  { name: 'MongoDB', color: '#47A248' },
  { name: 'PostgreSQL', color: '#4169E1' },
  { name: 'Docker', color: '#2496ED' },
  { name: 'Git', color: '#F05032' },
  { name: 'Stripe', color: '#635BFF' },
  { name: 'Java', color: '#ED8B00' },
  { name: 'Vercel', color: '#ffffff' },
]

function Stack() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="stack" ref={ref} className="relative spotlight-bottom">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[--color-border] to-transparent" />

      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[--color-accent] mb-3">
            Stack
          </h2>
          <p className="text-[clamp(28px,5vw,48px)] font-black tracking-[-0.03em]">
            Tecnologias que domino.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="relative mx-auto mb-14 flex max-w-sm flex-col items-center"
        >
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-6xl font-black text-[--color-text]">681</span>
            <span className="font-mono text-3xl font-black text-[--color-accent]">+</span>
          </div>
          <p className="text-sm text-[--color-text-secondary] mb-4">contribuições no GitHub</p>

          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-mono text-5xl font-black text-[--color-text]">26</span>
          </div>
          <p className="text-sm text-[--color-text-secondary] mb-6">repositórios</p>

          <span className="inline-flex items-center gap-2 rounded-full border border-[--color-accent]/20 bg-[--color-accent]/5 px-5 py-2 font-mono text-xs font-semibold text-[--color-accent] tracking-wide">
            TÉCNICO EM INFORMÁTICA — IFC IBIRAMA
          </span>
        </motion.div>

        {/* Tech cloud */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto flex max-w-2xl flex-wrap justify-center gap-3"
        >
          {techIcons.map((tech, i) => (
            <motion.span
              key={tech.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
              className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-[--color-border] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm font-medium text-[--color-text] backdrop-blur-sm transition-all hover:scale-105 hover:border-[--color-border-hover] hover:bg-[rgba(255,255,255,0.06)]"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: tech.color }} />
              {tech.name}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════
// ARTICLES
// ═══════════════════════════════════════════
const articles = [
  {
    title: 'Quanto custa um site profissional em 2026?',
    summary:
      'Guia completo de preços: landing page, site institucional, e-commerce e sistema web. Entenda as variáveis que afetam o orçamento.',
    tags: ['Site', 'Orçamento'],
  },
  {
    title: 'Automação de processos: quanto sua empresa perde com trabalho manual?',
    summary:
      'Scripts, bots e integrações podem eliminar horas de tarefas repetitivas. Casos reais de empresas que reduziram custos em 60%+.',
    tags: ['Automação', 'Produtividade'],
  },
  {
    title: 'React, Node.js ou Python: qual stack escolher para seu projeto?',
    summary:
      'Cada tecnologia resolve problemas diferentes. Um guia prático para founders e gestores tomarem a decisão certa sem viés técnico.',
    tags: ['Stack', 'Decisão Técnica'],
  },
]

function Articles() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[--color-border] to-transparent" />

      <div ref={ref} className="mx-auto max-w-[1200px] px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[--color-accent] mb-3">
            Artigos
          </h2>
          <p className="text-[clamp(28px,5vw,48px)] font-black tracking-[-0.03em] mb-2">
            Conteúdo que ajuda você a decidir.
          </p>
          <p className="text-sm text-[--color-text-secondary] max-w-lg">
            Escrevo sobre desenvolvimento, tecnologia e como resolver problemas reais com código.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {articles.map((a, i) => (
            <motion.a
              key={a.title}
              href="#contato"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="glass group block p-6 no-underline transition-all duration-300 hover:bg-[rgba(255,255,255,0.05)] hover:-translate-y-1 hover:border-[--color-accent]/20"
            >
              <div className="mb-3 flex items-center gap-2">
                {a.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[--color-accent]/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-[--color-accent]"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <h3 className="font-sans text-base font-semibold tracking-[-0.02em] mb-2 text-[--color-text] group-hover:text-[--color-accent] transition-colors">
                {a.title}
              </h3>
              <p className="text-sm leading-relaxed text-[--color-text-secondary] mb-4">{a.summary}</p>

              <span className="inline-flex items-center gap-1 font-mono text-xs text-[--color-accent] group-hover:gap-2 transition-all">
                ler artigo
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════
function Contact() {
  const [form, setForm] = useState({ nome: '', desafio: '', empresa: '', orcamento: '', descricao: '' })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('portfolio_form')
    if (saved) {
      try {
        setForm(JSON.parse(saved))
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('portfolio_form', JSON.stringify(form))
  }, [form])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const buildMsg = () =>
    encodeURIComponent(
      `*Novo orçamento — Portfolio*\n\n*Nome:* ${form.nome || '(não informado)'}\n*Desafio:* ${form.desafio || '(não informado)'}\n*Empresa:* ${form.empresa || '(não informado)'}\n*Orçamento:* ${form.orcamento || '(não informado)'}\n*Descrição:* ${form.descricao || '(não informado)'}`
    )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    localStorage.removeItem('portfolio_form')
    window.open(`https://wa.me/5547997615032?text=${buildMsg()}`, '_blank')
  }

  return (
    <section
      id="contato"
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(245,197,24,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 90%, rgba(10,114,239,0.05) 0%, transparent 60%), #09090b',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[--color-accent]/20 to-transparent" />

      <div className="relative z-10 mx-auto max-w-[660px] px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-[--color-accent] mb-4">
            Contato
          </h2>
          <p className="text-[clamp(28px,5vw,42px)] font-black tracking-[-0.03em]">
            Vamos conversar sobre o seu projeto.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[--color-text-secondary]">
            Preencha o formulário e você será redirecionado para o WhatsApp com todas as informações.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mt-8 p-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
              <svg className="h-7 w-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold">Mensagem preparada!</p>
            <p className="mt-1 text-sm text-[--color-text-secondary]">
              Se o WhatsApp não abriu,{' '}
              <button
                onClick={() =>
                  window.open(`https://wa.me/5547997615032?text=${buildMsg()}`, '_blank')
                }
                className="text-[--color-accent] underline hover:text-[--color-accent-hover]"
              >
                clique aqui
              </button>
              .
            </p>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            viewport={{ once: true }}
            className="mt-8 space-y-4"
          >
            <label className="block">
              <span className="text-xs font-medium text-[--color-text-secondary]">Nome</span>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Seu nome completo"
                className="mt-1.5 w-full rounded-xl border border-[--color-border] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[--color-text] placeholder:text-[--color-text-tertiary] transition-all focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/30"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-[--color-text-secondary]">Qual o desafio que você quer resolver?</span>
              <textarea
                name="desafio"
                rows={2}
                value={form.desafio}
                onChange={handleChange}
                placeholder="Ex: Preciso de um site para captar leads, meu processo manual está lento..."
                className="mt-1.5 w-full resize-none rounded-xl border border-[--color-border] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[--color-text] placeholder:text-[--color-text-tertiary] transition-all focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/30"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-[--color-text-secondary]">Tamanho da empresa</span>
                <select
                  name="empresa"
                  value={form.empresa}
                  onChange={handleChange}
                  className="mt-1.5 w-full appearance-none rounded-xl border border-[--color-border] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[--color-text] transition-all focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/30"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23707070' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  <option value="">Selecione...</option>
                  <option value="Freelancer">Freelancer / Autônomo</option>
                  <option value="Pequena">Empresa pequena (1-10)</option>
                  <option value="Média">Empresa média (11-50)</option>
                  <option value="Grande">Empresa grande (50+)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[--color-text-secondary]">Orçamento estimado</span>
                <select
                  name="orcamento"
                  value={form.orcamento}
                  onChange={handleChange}
                  className="mt-1.5 w-full appearance-none rounded-xl border border-[--color-border] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[--color-text] transition-all focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/30"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23707070' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  <option value="">Selecione...</option>
                  <option value="Ate 1k">Até R$ 1.000</option>
                  <option value="1k-3k">R$ 1.000 — R$ 3.000</option>
                  <option value="3k-8k">R$ 3.000 — R$ 8.000</option>
                  <option value="8k+">Acima de R$ 8.000</option>
                  <option value="Indefinido">A definir / Não sei</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-[--color-text-secondary]">Descreva o que você precisa</span>
              <textarea
                name="descricao"
                rows={3}
                value={form.descricao}
                onChange={handleChange}
                placeholder="Quanto mais detalhes, melhor. Funcionalidades, prazo, referências..."
                className="mt-1.5 w-full resize-none rounded-xl border border-[--color-border] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[--color-text] placeholder:text-[--color-text-tertiary] transition-all focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/30"
              />
            </label>

            <div className="pt-2">
              {form.nome.trim() && form.desafio.trim() && form.descricao.trim() ? (
                <button
                  type="submit"
                  className="btn-primary w-full !bg-[#25D366] !shadow-[0_8px_32px_rgba(37,211,102,0.3)] hover:!bg-[#1fb855]"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                  </svg>
                  Chamar no WhatsApp
                </button>
              ) : (
                <p className="text-center text-sm text-[--color-text-tertiary]">
                  Preencha nome, desafio e descrição para chamar no WhatsApp
                </p>
              )}
            </div>
          </motion.form>
        )}

        <div className="mt-10 flex justify-center gap-8 text-sm">
          <a href="mailto:viniciusodorizzi25@gmail.com" className="text-[--color-text-tertiary] hover:text-[--color-text] transition-colors no-underline">
            Email
          </a>
          <a href="https://github.com/ViniciusOdorizziHoppe" target="_blank" rel="noopener noreferrer" className="text-[--color-text-tertiary] hover:text-[--color-text] transition-colors no-underline">
            GitHub
          </a>
          <a href="https://linkedin.com/in/viniciusodorizzi" target="_blank" rel="noopener noreferrer" className="text-[--color-text-tertiary] hover:text-[--color-text] transition-colors no-underline">
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════
function Footer() {
  return (
    <footer className="border-t border-[--color-border]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-3 px-6 py-12 text-center">
        <p className="font-[family-name:var(--font-cinzel)] text-lg font-semibold tracking-tight">
          Vinícius <span className="text-[--color-accent]">Odorizzi</span>
        </p>
        <p className="text-xs text-[--color-text-tertiary]">
          © {new Date().getFullYear()} · built with precision · Presidente Getúlio, SC
        </p>
      </div>
    </footer>
  )
}

export default App
