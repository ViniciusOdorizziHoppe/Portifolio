import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import RiverFlow, { RiverBanks } from './RiverFlow'

function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-vercel-black">
      <RiverFlow />
      <RiverBanks />
      <div className="relative z-10">
        <Nav />
        <Hero />
        <Services />
        <Projects />
        <OrbitingStack />
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
      style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <span className="font-mono text-sm font-medium uppercase tracking-tight">VH</span>
        <div className="flex items-center gap-6">
          <a href="#servicos" className="text-sm font-medium text-vercel-gray transition-colors hover:text-vercel-black">Serviços</a>
          <a href="#projetos" className="text-sm font-medium text-vercel-gray transition-colors hover:text-vercel-black">Projetos</a>
          <a href="#stack" className="text-sm font-medium text-vercel-gray transition-colors hover:text-vercel-black">Stack</a>
          <a href="#contato" className="rounded-full bg-vercel-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80">Contato</a>
        </div>
      </div>
    </motion.header>
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
    <section className="relative overflow-hidden bg-white">
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 pb-20 pt-32 md:pt-48">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-mono text-xs font-medium uppercase tracking-wide text-vercel-muted"
        >
          Desenvolvimento de software
        </motion.p>

        <h1 className="mt-4 max-w-3xl font-sans text-5xl font-semibold leading-none tracking-[-0.05em] md:text-7xl md:tracking-[-0.04em] text-vercel-black">
          <span>{firstPart}</span>
          <span className="font-[family-name:var(--font-cinzel)] font-semibold">{secondPart}</span>
          <span className={`font-light ${cursor ? 'opacity-100' : 'opacity-0'} text-vercel-muted transition-opacity`}>|</span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-vercel-gray md:text-xl"
        >
          Transformo ideias em produtos digitais — sites, automações e aplicações que geram resultado.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <a href="#contato"
            className="inline-flex items-center gap-2 rounded-md bg-vercel-black px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-vercel-black/80">
            Solicitar orçamento
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </a>
          <a href="#projetos"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-vercel-gray transition-all hover:text-vercel-black"
            style={{ boxShadow: 'rgb(235,235,235) 0px 0px 0px 1px' }}>
            Ver projetos
          </a>
        </motion.div>
      </div>
    </section>
  )
}

/* ───── Services ───── */
const services = [
  {
    title: 'Sites & Landings',
    desc: 'Landing pages que convertem, sites institucionais e portfólios profissionais. Do design ao deploy.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    ),
    tags: ['React', 'Vite', 'Tailwind', 'SEO'],
  },
  {
    title: 'Automações',
    desc: 'Scripts, bots, integrações e fluxos que eliminam trabalho manual. Economize horas por semana.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    ),
    tags: ['Python', 'Node.js', 'APIs', 'Chrome Ext'],
  },
  {
    title: 'Apps & APIs',
    desc: 'Aplicações web completas com backend, banco de dados, pagamentos e painéis administrativos.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
    ),
    tags: ['Express', 'MongoDB', 'Stripe', 'TypeScript'],
  },
]

function Services() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="servicos" className="mx-auto max-w-[1200px] px-6 py-20 bg-white" ref={ref}>
      <div className="mb-12 flex items-center gap-3">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-develop-blue">Serviços</span>
        <span className="h-px flex-1 bg-vercel-border" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {services.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="group rounded-xl bg-vercel-bg p-6 transition-all hover:shadow-md"
            style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}
          >
            <div className="mb-4 inline-flex rounded-lg border border-vercel-border bg-white p-2.5 text-develop-blue">
              {s.icon}
            </div>
            <h3 className="font-sans text-lg font-semibold tracking-[-0.02em]">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-vercel-gray">{s.desc}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {s.tags.map((t) => (
                <span key={t} className="rounded-full bg-[#ebf5ff] px-2 py-0.5 font-mono text-[11px] font-medium text-[#0068d6]">{t}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <a href="#contato"
          className="inline-flex items-center gap-2 rounded-md bg-vercel-black px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80">
          Preciso de algo personalizado
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </a>
      </motion.div>
    </section>
  )
}

/* ───── Projects ───── */
function Projects() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="projetos" className="border-t border-vercel-border mx-auto max-w-[1200px] px-6 py-20 bg-white" ref={ref}>
      <div className="mb-12 flex items-center gap-3">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-preview-pink">Projetos</span>
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

      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-sm text-vercel-gray"
      >
        Gostou do que viu?{' '}
        <a href="#contato" className="font-medium text-link-blue underline underline-offset-4 hover:text-vercel-black">
          Vamos construir o seu projeto.
        </a>
      </motion.p>
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
    <section id="stack" className="border-t border-vercel-border mx-auto max-w-[1200px] px-6 py-20 bg-white" ref={ref}>
      <div className="mb-12 flex items-center gap-3">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-ship-red">Stack</span>
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

/* ───── Contact / Qualifier ───── */
function Contact() {
  const [form, setForm] = useState({
    nome: '',
    desafio: '',
    empresa: '',
    orcamento: '',
    descricao: '',
  })

  const [submitted, setSubmitted] = useState(false)

  // Restore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('portfolio_form')
    if (saved) {
      try { setForm(JSON.parse(saved)) } catch {}
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('portfolio_form', JSON.stringify(form))
  }, [form])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const buildWhatsAppMessage = () => {
    const parts = [
      `*Novo orçamento — Portfolio*`,
      ``,
      `*Nome:* ${form.nome || '(não informado)'}`,
      `*Desafio:* ${form.desafio || '(não informado)'}`,
      `*Empresa:* ${form.empresa || '(não informado)'}`,
      `*Orçamento:* ${form.orcamento || '(não informado)'}`,
      `*Descrição:* ${form.descricao || '(não informado)'}`,
    ]
    return encodeURIComponent(parts.join('\n'))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const msg = buildWhatsAppMessage()
    localStorage.removeItem('portfolio_form')
    window.open(`https://wa.me/5547997615032?text=${msg}`, '_blank')
  }

  return (
    <section id="contato" className="border-t border-vercel-border mx-auto max-w-[1200px] px-6 py-20 bg-white">
      <div className="mb-12 flex items-center gap-3">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-develop-blue">Contato</span>
        <span className="h-px flex-1 bg-vercel-border" />
      </div>

      <div className="mx-auto max-w-xl">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
          Vamos conversar sobre o seu projeto
        </h2>
        <p className="mt-3 text-vercel-gray">
          Preencha o formulário abaixo e você será redirecionado para o WhatsApp com todas as informações.
        </p>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-center"
          >
            <p className="font-medium text-green-800">Mensagem preparada!</p>
            <p className="mt-1 text-sm text-green-700">
              O WhatsApp deve ter aberto. Se não abriu,{' '}
              <button onClick={() => window.open(`https://wa.me/5547997615032?text=${buildWhatsAppMessage()}`, '_blank')}
                className="underline">clique aqui</button>.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-vercel-black">Nome</label>
              <input
                type="text" id="nome" name="nome" value={form.nome} onChange={handleChange}
                className="mt-1.5 block w-full rounded-lg border border-vercel-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-develop-blue focus:outline-none focus:ring-1 focus:ring-develop-blue"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label htmlFor="desafio" className="block text-sm font-medium text-vercel-black">Qual o desafio que você quer resolver?</label>
              <textarea
                id="desafio" name="desafio" rows={2} value={form.desafio} onChange={handleChange}
                className="mt-1.5 block w-full rounded-lg border border-vercel-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-develop-blue focus:outline-none focus:ring-1 focus:ring-develop-blue resize-none"
                placeholder="Ex: Preciso de um site para captar leads, meu processo manual está lento..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="empresa" className="block text-sm font-medium text-vercel-black">Tamanho da empresa</label>
                <select
                  id="empresa" name="empresa" value={form.empresa} onChange={handleChange}
                  className="mt-1.5 block w-full rounded-lg border border-vercel-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-develop-blue focus:outline-none focus:ring-1 focus:ring-develop-blue"
                >
                  <option value="">Selecione...</option>
                  <option value="Freelancer">Freelancer / Autônomo</option>
                  <option value="Pequena">Empresa pequena (1-10)</option>
                  <option value="Média">Empresa média (11-50)</option>
                  <option value="Grande">Empresa grande (50+)</option>
                </select>
              </div>

              <div>
                <label htmlFor="orcamento" className="block text-sm font-medium text-vercel-black">Orçamento estimado</label>
                <select
                  id="orcamento" name="orcamento" value={form.orcamento} onChange={handleChange}
                  className="mt-1.5 block w-full rounded-lg border border-vercel-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-develop-blue focus:outline-none focus:ring-1 focus:ring-develop-blue"
                >
                  <option value="">Selecione...</option>
                  <option value="Ate 1k">Até R$ 1.000</option>
                  <option value="1k-3k">R$ 1.000 — R$ 3.000</option>
                  <option value="3k-8k">R$ 3.000 — R$ 8.000</option>
                  <option value="8k+">Acima de R$ 8.000</option>
                  <option value="A definir">A definir / Não sei</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-vercel-black">Descreva o que você precisa</label>
              <textarea
                id="descricao" name="descricao" rows={4} value={form.descricao} onChange={handleChange}
                className="mt-1.5 block w-full rounded-lg border border-vercel-border bg-white px-4 py-2.5 text-sm transition-colors focus:border-develop-blue focus:outline-none focus:ring-1 focus:ring-develop-blue resize-none"
                placeholder="Quanto mais detalhes, melhor. Funcionalidades, prazo, referências, o que já tem pronto..."
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-medium text-white transition-all hover:bg-[#1fb855]"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chamar no WhatsApp
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

/* ───── Footer ───── */
function Footer() {
  return (
    <footer className="border-t border-vercel-border bg-vercel-bg">
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

export default App
