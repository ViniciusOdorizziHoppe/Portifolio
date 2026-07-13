function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-vercel-black">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white" style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <span className="font-mono text-sm font-medium uppercase tracking-tight">VH</span>
          <div className="flex items-center gap-6">
            <a href="#projetos" className="text-sm font-medium text-vercel-gray transition-colors hover:text-vercel-black">Projetos</a>
            <a href="#stack" className="text-sm font-medium text-vercel-gray transition-colors hover:text-vercel-black">Stack</a>
            <a href="#contato" className="rounded-full bg-vercel-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80">Contato</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-6 pb-20 pt-32 md:pt-48">
        <p className="font-mono text-xs font-medium uppercase tracking-wide text-vercel-muted">Presidente Getúlio, SC</p>
        <h1 className="mt-4 max-w-3xl font-sans text-5xl font-semibold leading-none tracking-[-0.05em] md:text-7xl md:tracking-[-0.04em]">
          Vinícius <span className="text-vercel-muted">Hoppe</span>
        </h1>
        <p className="mt-6 max-w-xl text-xl leading-relaxed text-vercel-gray md:text-2xl">
          Full-Stack Developer. 16 anos. Estudante do IFC Ibirama — Técnico em Informática.
          Bolsista PVI. Duas menções honrosas OBMEP.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="https://github.com/ViniciusOdorizziHoppe" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-vercel-black transition-all hover:bg-vercel-bg"
            style={{ boxShadow: 'rgb(235,235,235) 0px 0px 0px 1px' }}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
          <a href="mailto:viniciusodorizzi25@gmail.com"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white bg-vercel-black transition-opacity hover:opacity-80">
            Email
          </a>
        </div>
      </section>

      {/* Projetos */}
      <section id="projetos" className="mx-auto max-w-[1200px] px-6 pb-20">
        <div className="mb-12 flex items-center gap-3">
          <span className="font-mono text-xs font-medium uppercase tracking-wide text-develop-blue">Projetos</span>
          <span className="h-px flex-1 bg-vercel-border" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
              className="group rounded-xl bg-white p-6 transition-all hover:bg-vercel-bg"
              style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px' }}>
              <h3 className="font-sans text-xl font-semibold leading-tight tracking-[-0.02em]">{p.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-vercel-gray">{p.desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full bg-[#ebf5ff] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#0068d6]">{t}</span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section id="stack" className="border-t border-vercel-border mx-auto max-w-[1200px] px-6 py-20">
        <div className="mb-12 flex items-center gap-3">
          <span className="font-mono text-xs font-medium uppercase tracking-wide text-preview-pink">Stack</span>
          <span className="h-px flex-1 bg-vercel-border" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <StackGroup title="Frontend" items={['React', 'Vite', 'Tailwind CSS', 'TypeScript', 'shadcn/ui', 'PWA']} />
          <StackGroup title="Backend" items={['Node.js', 'Express', 'Python', 'Java', 'MySQL', 'MongoDB']} />
          <StackGroup title="Ferramentas" items={['Git', 'Vercel', 'Render', 'Neon PG', 'Stripe', 'Meta Ads API']} />
        </div>
      </section>

      {/* Conquistas */}
      <section className="border-t border-vercel-border mx-auto max-w-[1200px] px-6 py-20">
        <div className="mb-12 flex items-center gap-3">
          <span className="font-mono text-xs font-medium uppercase tracking-wide text-ship-red">Conquistas</span>
          <span className="h-px flex-1 bg-vercel-border" />
        </div>
        <div className="grid gap-3">
          {achievements.map((a, i) => (
            <div key={i} className="flex items-start gap-4 rounded-lg p-4 transition-colors hover:bg-vercel-bg">
              <span className="mt-0.5 font-mono text-sm text-vercel-muted">{a.year}</span>
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-vercel-gray">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="border-t border-vercel-border bg-vercel-bg">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-6 py-12 text-center">
          <p className="text-lg font-medium">Vamos conversar?</p>
          <a href="mailto:viniciusodorizzi25@gmail.com" className="font-mono text-sm text-link-blue underline underline-offset-4 transition-colors hover:text-vercel-black">
            viniciusodorizzi25@gmail.com
          </a>
          <p className="mt-4 text-xs text-vercel-muted">viniciusodorizzi.com &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}

function StackGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-mono text-xs font-medium uppercase tracking-wide text-vercel-muted">{title}</h3>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-vercel-gray">{item}</li>
        ))}
      </ul>
    </div>
  )
}

const projects = [
  {
    name: 'MediaTio Vehicle Nexus',
    desc: 'Plataforma de intermediação de veículos com Meta Ads integrado — CPA R$17, CTR 7.85%. Pipeline de leads automatizado.',
    url: 'https://github.com/ViniciusOdorizziHoppe/mediatio-vehicle-nexus',
    tags: ['React', 'TypeScript', 'Node.js', 'Meta Ads'],
  },
  {
    name: 'Morph',
    desc: 'SaaS de transformação de fotos com IA. Stripe integrado com PIX e assinaturas recorrentes.',
    url: 'https://github.com/ViniciusOdorizziHoppe/morph',
    tags: ['SaaS', 'IA', 'Stripe', 'JavaScript'],
  },
  {
    name: 'LexiCube',
    desc: 'Análise de notícias com IA — projeto de bolsa PVI no IFC Ibirama. Processamento de linguagem natural.',
    url: 'https://github.com/ViniciusOdorizziHoppe/lexicube',
    tags: ['Python', 'IA', 'NLP', 'Bolsa PVI'],
  },
  {
    name: 'RankBR',
    desc: 'Aplicação de rankings com React, Vite, Tailwind e Express + TypeScript. Deploy Vercel + Render.',
    url: 'https://github.com/ViniciusOdorizziHoppe/RankBR',
    tags: ['React', 'Express', 'TypeScript', 'Neon PG'],
  },
  {
    name: 'FIPE na Placa',
    desc: 'PWA para consulta de veículos pela placa. Publicada e em produção.',
    url: '#',
    tags: ['PWA', 'JavaScript', 'API'],
  },
  {
    name: 'Opinai — Hackathon UDESC',
    desc: 'Líder técnico no desenvolvimento de solução com IA para processamento de feedbacks.',
    url: '#',
    tags: ['Hackathon', 'IA', 'Liderança'],
  },
]

const achievements = [
  { year: '2023', title: 'Menção Honrosa OBMEP', desc: 'Olimpíada Brasileira de Matemática das Escolas Públicas' },
  { year: '2024', title: 'Menção Honrosa OBMEP', desc: 'Segundo ano consecutivo com destaque em matemática' },
  { year: '2025', title: 'Bolsa PVI — IFC', desc: 'Projeto LexiCube: análise de notícias com inteligência artificial' },
  { year: '2026', title: '4 Chrome Extensions', desc: 'Extensões publicadas na Chrome Web Store' },
  { year: '2026', title: '681+ contribuições no GitHub', desc: '26 repositórios ativos, open source e projetos próprios' },
]

export default App
