import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import RiverFlow from './RiverFlow'

function App() {
  return (
    <div className="min-h-screen font-sans text-[--color-text]">
      <RiverFlow />
      <div className="relative z-10">
        <Nav />
        <Hero />
        <Services />
        <Projects />
        <Testimonials />
        <Stack />
        <Contact />
        <Footer />
      </div>
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
      style={{ boxShadow: 'rgba(0,0,0,0.06) 0px 0px 0px 1px' }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <span className="font-[family-name:var(--font-cinzel)] text-base font-semibold tracking-tight">
          Vinícius Odorizzi
        </span>
        <div className="flex items-center gap-6 md:gap-8">
          <a href="#servicos" className="text-sm text-[--color-text-secondary] hover:text-[--color-text] transition-colors">Serviços</a>
          <a href="#projetos" className="text-sm text-[--color-text-secondary] hover:text-[--color-text] transition-colors">Projetos</a>
          <a href="#stack" className="text-sm text-[--color-text-secondary] hover:text-[--color-text] transition-colors">Stack</a>
          <a href="#contato" className="text-sm text-[--color-text-secondary] hover:text-[--color-text] transition-colors">Contato</a>
          <a href="#contato" className="rounded-full bg-[--color-text] px-4 py-2 text-sm font-medium text-white hover:opacity-80 transition-opacity">Contratar</a>
        </div>
      </div>
    </motion.header>
  )
}

/* ───── Hero ───── */
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
    const i = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(i)
  }, [])

  const splitIdx = 'Vinícius '.length
  const first = displayed.slice(0, Math.min(displayed.length, splitIdx))
  const second = displayed.slice(splitIdx)

  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-16 pt-32 md:pt-48">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="font-mono text-xs text-[--color-text-muted]">disponível · Q3 2026</span>
      </div>

      <h1 className="max-w-3xl font-sans text-5xl font-semibold leading-[1.05] tracking-[-0.05em] md:text-7xl md:tracking-[-0.04em]">
        <span>{first}</span>
        <span className="font-[family-name:var(--font-cinzel)]">{second}</span>
        <span className={`font-light ${cursor ? 'opacity-100' : 'opacity-0'} text-[--color-text-muted]`}>|</span>
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-relaxed text-[--color-text-secondary] md:text-xl">
        Crio aplicações web que funcionam, convertem e escalam — do design ao deploy, sem atalhos.
      </p>

      <p className="mt-3 font-mono text-xs text-[--color-text-muted]">
        {'//'} mesmo stack da Netflix, Uber e Nubank.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href="#contato" className="inline-flex items-center gap-2 rounded-md bg-[--color-text] px-5 py-2.5 text-sm font-medium text-white hover:bg-[--color-text]/80 transition-all">
          Solicitar orçamento
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </a>
        <a href="#projetos" className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-[--color-text-secondary] hover:text-[--color-text] transition-all"
          style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}>
          Ver projetos
        </a>
      </div>
    </section>
  )
}

/* ───── Services ───── */
const services = [
  {
    title: 'Sites & Landings',
    desc: 'Landing pages que convertem, sites institucionais e portfólios profissionais. Do design ao deploy.',
    tech: ['React', 'Vite', 'Tailwind', 'SEO'],
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
    ),
    color: '#0a72ef',
  },
  {
    title: 'Automações',
    desc: 'Scripts, bots, integrações e fluxos que eliminam trabalho manual. Economize horas por semana.',
    tech: ['Python', 'Node.js', 'APIs', 'Chrome Ext'],
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
    ),
    color: '#7928ca',
  },
  {
    title: 'Apps & APIs',
    desc: 'Aplicações web completas com backend, banco de dados, pagamentos e painéis administrativos.',
    tech: ['Express', 'MongoDB', 'Stripe', 'TypeScript'],
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7" /><path d="M16 3H8l-1 4h10l-1-4z" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" /></svg>
    ),
    color: '#00008b',
  },
]

function Services() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="servicos" ref={ref} className="relative overflow-hidden bg-gradient-to-b from-[#f8fafd] to-white">
      {/* Decorative gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[--color-accent] via-[#7928ca] to-[--color-river]" />

      <div className="mx-auto max-w-[1200px] px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-[--color-accent] mb-2">
            Serviços
          </h2>
          <p className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl mb-2">
            O que eu faço de melhor.
          </p>
          <p className="text-sm text-[--color-text-secondary] max-w-lg mb-10">
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
              className="group relative rounded-2xl bg-white p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)' }}
            >
              {/* Colored icon circle */}
              <div
                className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110"
                style={{ background: s.color }}
              >
                {s.icon}
              </div>

              <h3 className="font-sans text-lg font-semibold tracking-[-0.02em] mb-2">{s.title}</h3>
              <p className="text-sm leading-relaxed text-[--color-text-secondary] mb-4">{s.desc}</p>

              <div className="flex flex-wrap gap-1.5">
                {s.tech.map(t => (
                  <span key={t} className="rounded-md bg-[#f4f4f5] px-2 py-0.5 font-mono text-[10px] font-medium text-[--color-text-secondary]">
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

        <div className="mt-10 text-center">
          <a href="#contato" className="inline-flex items-center gap-2 rounded-full bg-[--color-text] px-6 py-3 text-sm font-medium text-white hover:bg-[--color-text]/80 transition-all">
            Preciso de algo personalizado
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </a>
        </div>
      </div>
    </section>
  )
}

/* ───── Projects ───── */
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
    desc: 'Transforme fotos comuns em imagens profissionais usando IA — sem editar manualmente. Stripe com PIX e assinaturas recorrentes.',
    tech: ['JavaScript', 'Stripe API', 'OpenAI', 'Serverless'],
    meta: ['SaaS', 'IA'],
    metric: 'PIX + Stripe',
    url: 'https://morph-one-tan.vercel.app',
    github: 'https://github.com/ViniciusOdorizziHoppe/morph',
    gradient: 'linear-gradient(135deg, #0a0a1a, #1a1a3e)',
  },
  {
    initials: 'LC',
    name: 'LexiCube',
    desc: 'Análise automática de notícias com IA — classificação, sumarização e detecção de viés. Projeto de pesquisa com bolsa PVI no IFC.',
    tech: ['Python', 'Transformers', 'scikit-learn', 'FastAPI'],
    meta: ['NLP', 'Bolsa PVI'],
    metric: 'Pesquisa IFC',
    url: 'https://github.com/ViniciusOdorizziHoppe/lexicube',
    github: 'https://github.com/ViniciusOdorizziHoppe/lexicube',
    gradient: 'linear-gradient(135deg, #7928ca, #00008b)',
  },
  {
    initials: 'RK',
    name: 'RankBR',
    desc: 'Plataforma de rankings com dados em tempo real — dashboards, filtros e comparativos. Stack moderna com deploy na Vercel + Render.',
    tech: ['React', 'Express', 'TypeScript', 'Neon PG'],
    meta: ['Plataforma', 'Dados'],
    metric: 'Vercel + Render',
    url: 'https://rankbr.vercel.app',
    github: 'https://github.com/ViniciusOdorizziHoppe/RankBR',
    gradient: 'linear-gradient(135deg, #1a1a2e, #0a72ef)',
  },
]

function Projects() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="projetos" ref={ref} className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-[--color-accent] mb-2">
            Projetos
          </h2>
          <p className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl mb-10">
            Sistemas em produção.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]"
              style={{ background: p.gradient, minHeight: '200px' }}
            >
              {/* Watermark initials */}
              <div className="absolute -bottom-4 -right-2 select-none font-[family-name:var(--font-cinzel)] text-[6rem] font-bold leading-none text-white/[0.06]">
                {p.initials}
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                {/* Meta labels */}
                <div className="flex items-center gap-1.5 mb-3">
                  {p.meta.map(m => (
                    <span key={m} className="rounded-full bg-white/15 px-2.5 py-0.5 font-mono text-[10px] font-medium text-white/90 backdrop-blur-sm">
                      {m}
                    </span>
                  ))}
                </div>

                <h3 className="font-sans text-base font-semibold tracking-[-0.02em] text-white mb-1.5">{p.name}</h3>
                <p className="text-sm leading-relaxed text-white/75 mb-auto">{p.desc}</p>

                {/* Tech tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tech.slice(0, 3).map(t => (
                    <span key={t} className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/70">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Bottom row */}
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="font-mono text-xs font-semibold text-white/90">{p.metric}</span>
                  <div className="flex items-center gap-3">
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-[11px] text-white/60 hover:text-white transition-colors">
                      demo →
                    </a>
                    {p.github && (
                      <a href={p.github} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-[11px] text-white/50 hover:text-white transition-colors">
                        código →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="#contato" className="inline-flex items-center gap-2 rounded-full bg-[--color-text] px-6 py-3 text-sm font-medium text-white hover:bg-[--color-text]/80 transition-all">
            Gostou do que viu? Vamos construir o seu projeto.
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </a>
        </div>
      </div>
    </section>
  )
}

/* ───── Testimonials ───── */
const testimonials = [
  {
    quote: 'O Vinícius pegou uma ideia solta e entregou um sistema completo em semanas. Profissionalismo de gente grande com 16 anos.',
    name: 'Cliente Silvania',
    role: 'Projeto Imobiliária',
  },
  {
    quote: 'Contratei para automatizar um processo manual que me tomava 4h por dia. Hoje rola sozinho. Melhor investimento do ano.',
    name: 'Cliente RankBR',
    role: 'Plataforma de Dados',
  },
  {
    quote: 'Destaque no Hackathon UDESC como líder técnico. Capacidade de resolver problema real sob pressão e entregar funcionando.',
    name: 'Prof. IFC Ibirama',
    role: 'Hackathon UDESC 2025',
  },
]

function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f8fafd] to-white py-20">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[--color-border] to-transparent" />

      <div ref={ref} className="mx-auto max-w-[1200px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-[--color-accent] mb-2">
            Depoimentos
          </h2>
          <p className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
            Quem já trabalhou comigo.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative rounded-2xl bg-white p-6 shadow-sm"
              style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)' }}
            >
              {/* Quote mark */}
              <svg className="h-8 w-8 text-[--color-accent]/20 mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              <p className="text-sm leading-relaxed text-[--color-text-secondary] mb-4">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-[--color-border]">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[--color-accent] to-[--color-river] flex items-center justify-center text-white text-xs font-semibold">
                  {t.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[--color-text]">{t.name}</p>
                  <p className="text-xs text-[--color-text-muted]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───── Stack ───── */
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
  { name: 'Vercel', color: '#000000' },
]

function Stack() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="stack" ref={ref} className="relative overflow-hidden bg-gradient-to-b from-white to-[#f8fafd] py-20">
      {/* Subtle top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[--color-border] to-transparent" />

      <div className="mx-auto max-w-[1200px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-[--color-accent] mb-2">
            Stack
          </h2>
          <p className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
            Tecnologias que domino.
          </p>
        </motion.div>

        {/* Central stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="relative mx-auto mb-12 flex max-w-sm flex-col items-center"
        >
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-6xl font-bold text-[--color-text]">681</span>
            <span className="font-mono text-3xl font-bold text-[--color-accent]">+</span>
          </div>
          <p className="text-sm text-[--color-text-secondary] mb-4">contribuições no GitHub</p>

          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-mono text-5xl font-bold text-[--color-text]">26</span>
          </div>
          <p className="text-sm text-[--color-text-secondary] mb-6">repositórios</p>

          <span className="inline-flex items-center gap-2 rounded-full border border-[--color-river]/20 bg-[--color-river]/5 px-4 py-2 font-mono text-xs font-semibold text-[--color-river] tracking-wide">
            TÉCNICO EM INFORMÁTICA — IFC IBIRAMA
          </span>
        </motion.div>

        {/* Tech icons cloud */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto"
        >
          {techIcons.map((tech, i) => (
            <motion.span
              key={tech.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[--color-border] bg-white px-3.5 py-2 text-sm font-medium text-[--color-text] shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-default"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: tech.color }}
              />
              {tech.name}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ───── Contact ───── */
function Contact() {
  const [form, setForm] = useState({ nome: '', desafio: '', empresa: '', orcamento: '', descricao: '' })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('portfolio_form')
    if (saved) { try { setForm(JSON.parse(saved)) } catch {} }
  }, [])
  useEffect(() => {
    localStorage.setItem('portfolio_form', JSON.stringify(form))
  }, [form])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const buildMsg = () => encodeURIComponent(
    `*Novo orçamento — Portfolio*\n\n*Nome:* ${form.nome || '(não informado)'}\n*Desafio:* ${form.desafio || '(não informado)'}\n*Empresa:* ${form.empresa || '(não informado)'}\n*Orçamento:* ${form.orcamento || '(não informado)'}\n*Descrição:* ${form.descricao || '(não informado)'}`
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    localStorage.removeItem('portfolio_form')
    window.open(`https://wa.me/5547997615032?text=${buildMsg()}`, '_blank')
  }

  return (
    <section id="contato" className="relative overflow-hidden bg-gradient-to-br from-[#08081c] via-[#0f0f2e] to-[#120a24] py-20">
      {/* Top transition from light section */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white to-transparent pointer-events-none" />

      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-[--color-accent]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#7928ca]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-[660px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="font-mono text-xs font-medium uppercase tracking-wide text-blue-400 mb-3">
            Contato
          </h2>
          <p className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
            Vamos conversar sobre o seu projeto.
          </p>
          <p className="mt-2 text-base text-gray-400">
            Preencha o formulário abaixo e você será redirecionado para o WhatsApp com todas as informações.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/10 p-8 text-center backdrop-blur-sm"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
              <svg className="h-7 w-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-white">Mensagem preparada!</p>
            <p className="mt-1 text-sm text-gray-400">
              Se o WhatsApp não abriu,{' '}
              <button onClick={() => window.open(`https://wa.me/5547997615032?text=${buildMsg()}`, '_blank')} className="text-blue-400 underline hover:text-blue-300">
                clique aqui
              </button>.
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
            {/* Nome */}
            <label className="block">
              <span className="text-xs font-medium text-gray-300">Nome</span>
              <input
                type="text" name="nome" value={form.nome} onChange={handleChange}
                placeholder="Seu nome completo"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[--color-accent] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/30 focus:bg-white/[0.10] transition-all"
              />
            </label>

            {/* Desafio */}
            <label className="block">
              <span className="text-xs font-medium text-gray-300">Qual o desafio que você quer resolver?</span>
              <textarea
                name="desafio" rows={2} value={form.desafio} onChange={handleChange}
                placeholder="Ex: Preciso de um site para captar leads, meu processo manual está lento..."
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[--color-accent] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/30 focus:bg-white/[0.10] transition-all resize-none"
              />
            </label>

            {/* Empresa + Orçamento */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-gray-300">Tamanho da empresa</span>
                <select name="empresa" value={form.empresa} onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white focus:border-[--color-accent] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/30 transition-all appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="" className="text-gray-900">Selecione...</option>
                  <option value="Freelancer" className="text-gray-900">Freelancer / Autônomo</option>
                  <option value="Pequena" className="text-gray-900">Empresa pequena (1-10)</option>
                  <option value="Média" className="text-gray-900">Empresa média (11-50)</option>
                  <option value="Grande" className="text-gray-900">Empresa grande (50+)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-300">Orçamento estimado</span>
                <select name="orcamento" value={form.orcamento} onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white focus:border-[--color-accent] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/30 transition-all appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="" className="text-gray-900">Selecione...</option>
                  <option value="Ate 1k" className="text-gray-900">Até R$ 1.000</option>
                  <option value="1k-3k" className="text-gray-900">R$ 1.000 — R$ 3.000</option>
                  <option value="3k-8k" className="text-gray-900">R$ 3.000 — R$ 8.000</option>
                  <option value="8k+" className="text-gray-900">Acima de R$ 8.000</option>
                  <option value="Indefinido" className="text-gray-900">A definir / Não sei</option>
                </select>
              </label>
            </div>

            {/* Descrição */}
            <label className="block">
              <span className="text-xs font-medium text-gray-300">Descreva o que você precisa</span>
              <textarea
                name="descricao" rows={3} value={form.descricao} onChange={handleChange}
                placeholder="Quanto mais detalhes, melhor. Funcionalidades, prazo, referências, o que já tem pronto..."
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-[--color-accent] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/30 focus:bg-white/[0.10] transition-all resize-none"
              />
            </label>

            {/* Submit */}
            <div className="pt-2">
              {(form.nome.trim() && form.desafio.trim() && form.descricao.trim()) ? (
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-base font-semibold text-white hover:bg-[#1fb855] transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Chamar no WhatsApp
                </button>
              ) : (
                <p className="text-center text-sm text-gray-500">
                  Preencha nome, desafio e descrição para chamar no WhatsApp
                </p>
              )}
            </div>
          </motion.form>
        )}

        {/* Contact links */}
        <div className="mt-10 flex justify-center gap-8 text-sm">
          <a href="mailto:viniciusodorizzi25@gmail.com" className="text-gray-400 hover:text-white transition-colors">Email</a>
          <a href="https://github.com/ViniciusOdorizziHoppe" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
          <a href="https://linkedin.com/in/viniciusodorizzi" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a>
        </div>
      </div>
    </section>
  )
}

/* ───── Footer ───── */
function Footer() {
  return (
    <footer className="bg-[#08081c]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-3 px-6 py-10 text-center">
        <p className="font-[family-name:var(--font-cinzel)] text-lg font-semibold text-white">Vinícius Odorizzi</p>
        <p className="text-xs text-gray-500">© {new Date().getFullYear()} · built with precision · Presidente Getúlio, SC</p>
      </div>
    </footer>
  )
}

export default App
