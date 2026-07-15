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
        <Metrics />
        <Work />
        <Stack />
        <About />
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
        <span className="font-mono text-sm font-medium tracking-tight">VH</span>
        <div className="flex items-center gap-8">
          <a href="#work" className="text-sm text-[--color-text-secondary] hover:text-[--color-text] transition-colors">Work</a>
          <a href="#stack" className="text-sm text-[--color-text-secondary] hover:text-[--color-text] transition-colors">Stack</a>
          <a href="#about" className="text-sm text-[--color-text-secondary] hover:text-[--color-text] transition-colors">About</a>
          <a href="#contact" className="text-sm text-[--color-text-secondary] hover:text-[--color-text] transition-colors">Contact</a>
          <a href="#contact" className="rounded-full bg-[--color-text] px-4 py-2 text-sm font-medium text-white hover:opacity-80 transition-opacity">Contratar</a>
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
    <section className="mx-auto max-w-[1200px] px-6 pb-20 pt-32 md:pt-48">
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
        Full-stack developer. Automações que eliminam trabalho manual, sistemas que processam dados em escala, interfaces que respondem em milissegundos.
      </p>

      <p className="mt-3 font-mono text-xs text-[--color-text-muted]">
        {'//'} o código fala por mim.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href="#contact" className="inline-flex items-center gap-2 rounded-md bg-[--color-text] px-5 py-2.5 text-sm font-medium text-white hover:bg-[--color-text]/80 transition-all">
          Contratar
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </a>
        <a href="#work" className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-[--color-text-secondary] hover:text-[--color-text] transition-all"
          style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}>
          Ver projetos
        </a>
      </div>
    </section>
  )
}

/* ───── Metrics ───── */
const metrics = [
  { value: '681+', label: 'contribuições' },
  { value: '26', label: 'repositórios' },
  { value: '6', label: 'projetos ativos' },
  { value: '3', label: 'stacks principais' },
]

function Metrics() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section ref={ref} className="mx-auto max-w-[1200px] px-6 py-10 border-t border-[--color-border]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08 }}
          >
            <p className="font-mono text-3xl font-semibold text-[--color-text]">{m.value}</p>
            <p className="mt-1 text-xs text-[--color-text-muted]">{m.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* ───── Work ───── */
const projects = [
  {
    category: 'ads · automação',
    name: 'MediaTio Vehicle Nexus',
    desc: 'Intermediação de veículos com Meta Ads. Pipeline de leads automatizado, CPA otimizado.',
    stack: ['React', 'TypeScript', 'Node.js', 'Meta Ads API'],
    metric: 'CPA R$17',
    url: 'https://app.mediatio.api.br',
    gradient: 'linear-gradient(135deg, #0a72ef, #7928ca)',
    initial: 'MV',
  },
  {
    category: 'saas · ia',
    name: 'Morph',
    desc: 'SaaS de transformação de fotos com IA. Stripe com PIX, assinaturas recorrentes, processamento serverless.',
    stack: ['SaaS', 'IA', 'Stripe', 'JavaScript'],
    metric: 'PIX + Stripe',
    url: 'https://morph-one-tan.vercel.app',
    gradient: 'linear-gradient(135deg, #00008b, #0a72ef)',
    initial: 'MO',
    image: '/projects/morph.png',
  },
  {
    category: 'dados · nlp',
    name: 'LexiCube',
    desc: 'Análise de notícias com IA. Processamento de linguagem natural, classificação e sumarização.',
    stack: ['Python', 'IA', 'NLP'],
    metric: 'Bolsa PVI',
    url: 'https://github.com/ViniciusOdorizziHoppe/lexicube',
    gradient: 'linear-gradient(135deg, #7928ca, #00008b)',
    initial: 'LC',
  },
  {
    category: 'plataforma · dados',
    name: 'RankBR',
    desc: 'Plataforma de rankings com dados em tempo real. Deploy Vercel + Render + Neon.',
    stack: ['React', 'Express', 'TypeScript', 'Neon PG'],
    metric: 'Vercel + Render',
    url: 'https://rankbr.vercel.app',
    gradient: 'linear-gradient(135deg, #171717, #0a72ef)',
    initial: 'RK',
    image: '/projects/rankbr.png',
  },
]

function Work() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="work" ref={ref} className="mx-auto max-w-[1200px] px-6 py-20 border-t border-[--color-border] bg-white/80 backdrop-blur-sm">
      <div className="mb-10">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-[--color-accent]">selected work</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">Sistemas em produção.</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((p, i) => (
          <motion.a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="group relative overflow-hidden rounded-xl bg-[--color-surface-alt] p-5 transition-all hover:shadow-md"
            style={{ boxShadow: 'rgba(0,0,0,0.06) 0px 0px 0px 1px' }}
          >
            <span className="font-mono text-[11px] font-medium text-[--color-accent] uppercase tracking-wide">{p.category}</span>
            <h3 className="mt-2 font-sans text-lg font-semibold tracking-[-0.02em]">{p.name}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[--color-text-secondary]">{p.desc}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.stack.map(s => (
                <span key={s} className="rounded-md bg-[--color-border] px-2 py-0.5 font-mono text-[10px] text-[--color-text-secondary]">{s}</span>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[--color-border] pt-3">
              <span className="font-mono text-xs font-medium text-[--color-text]">{p.metric}</span>
              <span className="font-mono text-[11px] text-[--color-text-muted] group-hover:text-[--color-accent] transition-colors">visitar →</span>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  )
}

/* ───── Stack ───── */
const stackGroups = [
  {
    label: 'Frontend',
    items: ['React', 'Vite', 'Tailwind CSS', 'Next.js', 'TypeScript', 'framer-motion'],
  },
  {
    label: 'Backend',
    items: ['Node.js', 'Express', 'Python', 'Java', 'REST APIs', 'WebSocket'],
  },
  {
    label: 'Dados',
    items: ['MongoDB', 'MySQL', 'Neon PostgreSQL', 'Redis'],
  },
  {
    label: 'Infra',
    items: ['Vercel', 'Render', 'Docker', 'Git', 'GitHub Actions', 'Stripe'],
  },
]

function Stack() {
  return (
    <section id="stack" className="mx-auto max-w-[1200px] px-6 py-20 border-t border-[--color-border] bg-white/80 backdrop-blur-sm">
      <div className="mb-10">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-[--color-accent]">stack</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
          Ferramentas certas,<br />para o problema certo.
        </h2>
        <p className="mt-3 text-sm text-[--color-text-secondary] max-w-md">
          Escolho stack por trade-off técnico, não por trending topic.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stackGroups.map(g => (
          <div key={g.label}>
            <p className="font-mono text-[11px] font-medium text-[--color-text-muted] uppercase tracking-wide mb-2">{g.label}</p>
            <div className="space-y-1">
              {g.items.map(item => (
                <p key={item} className="text-sm text-[--color-text-secondary]">{item}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───── About ───── */
function About() {
  return (
    <section id="about" className="mx-auto max-w-[1200px] px-6 py-20 border-t border-[--color-border] bg-white/80 backdrop-blur-sm">
      <div className="max-w-2xl">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-[--color-accent]">about</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
          Desenvolvedor por método.<br />Resultado por consequência.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[--color-text-secondary]">
          Construo software desde os 14. Passei por hackathons, bolsas de pesquisa, projetos reais em produção com pagamento via Stripe e anúncios no Meta Ads. Cada projeto me ensinou uma lição sobre desempenho, confiabilidade e entrega.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[--color-text-secondary]">
          Prefiro sistemas simples que resistem à mudança. Deploy pequeno, contínuo, reversível. Código limpo acima de código rápido.
        </p>
        <p className="mt-4 font-mono text-xs text-[--color-text-muted]">
          {'const'} philosophy {'='} {'"'}build less, deliver more{'"'};
        </p>
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
    <section id="contact" className="mx-auto max-w-[1200px] px-6 py-20 border-t border-[--color-border] bg-white/80 backdrop-blur-sm">
      <div className="max-w-xl">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-[--color-accent]">contact</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
          Vamos construir algo que precisa existir.
        </h2>

        {submitted ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="font-medium text-green-800">Mensagem preparada!</p>
            <p className="mt-1 text-sm text-green-700">
              Se o WhatsApp não abriu,{' '}
              <button onClick={() => window.open(`https://wa.me/5547997615032?text=${buildMsg()}`, '_blank')} className="underline">clique aqui</button>.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input type="text" name="nome" value={form.nome} onChange={handleChange} placeholder="Nome"
              className="w-full rounded-lg border border-[--color-border] bg-white px-4 py-2.5 text-sm focus:border-[--color-accent] focus:outline-none focus:ring-1 focus:ring-[--color-accent]" />
            <textarea name="desafio" rows={2} value={form.desafio} onChange={handleChange} placeholder="Qual o desafio?"
              className="w-full rounded-lg border border-[--color-border] bg-white px-4 py-2.5 text-sm focus:border-[--color-accent] focus:outline-none focus:ring-1 focus:ring-[--color-accent] resize-none" />
            <div className="grid gap-4 sm:grid-cols-2">
              <select name="empresa" value={form.empresa} onChange={handleChange}
                className="w-full rounded-lg border border-[--color-border] bg-white px-4 py-2.5 text-sm focus:border-[--color-accent] focus:outline-none">
                <option value="">Tamanho da empresa</option>
                <option value="Freelancer">Freelancer</option>
                <option value="Pequena">Pequena (1-10)</option>
                <option value="Média">Média (11-50)</option>
                <option value="Grande">Grande (50+)</option>
              </select>
              <select name="orcamento" value={form.orcamento} onChange={handleChange}
                className="w-full rounded-lg border border-[--color-border] bg-white px-4 py-2.5 text-sm focus:border-[--color-accent] focus:outline-none">
                <option value="">Orçamento</option>
                <option value="Ate 1k">Até R$1.000</option>
                <option value="1k-3k">R$1.000–3.000</option>
                <option value="3k-8k">R$3.000–8.000</option>
                <option value="8k+">R$8.000+</option>
              </select>
            </div>
            <textarea name="descricao" rows={3} value={form.descricao} onChange={handleChange} placeholder="Descreva o que precisa"
              className="w-full rounded-lg border border-[--color-border] bg-white px-4 py-2.5 text-sm focus:border-[--color-accent] focus:outline-none focus:ring-1 focus:ring-[--color-accent] resize-none" />

            {(form.nome.trim() && form.desafio.trim() && form.descricao.trim()) ? (
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-sm font-medium text-white hover:bg-[#1fb855] transition-all">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Chamar no WhatsApp
              </button>
            ) : (
              <p className="text-center text-xs text-[--color-text-muted]">Preencha nome, desafio e descrição para chamar no WhatsApp</p>
            )}
          </form>
        )}

        <div className="mt-8 flex gap-4 text-sm">
          <a href="mailto:viniciusodorizzi25@gmail.com" className="text-[--color-accent] hover:text-[--color-text] transition-colors">Email</a>
          <a href="https://github.com/ViniciusOdorizziHoppe" target="_blank" rel="noopener noreferrer" className="text-[--color-accent] hover:text-[--color-text] transition-colors">GitHub</a>
          <a href="https://linkedin.com/in/viniciusodorizzi" target="_blank" rel="noopener noreferrer" className="text-[--color-accent] hover:text-[--color-text] transition-colors">LinkedIn</a>
        </div>
      </div>
    </section>
  )
}

/* ───── Footer ───── */
function Footer() {
  return (
    <footer className="border-t border-[--color-border] bg-[--color-surface-alt]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-3 px-6 py-10 text-center">
        <p className="font-[family-name:var(--font-cinzel)] text-lg font-semibold">Vinícius Odorizzi</p>
        <p className="text-xs text-[--color-text-muted]">© {new Date().getFullYear()} · built with precision · Presidente Getúlio, SC</p>
      </div>
    </footer>
  )
}

export default App
