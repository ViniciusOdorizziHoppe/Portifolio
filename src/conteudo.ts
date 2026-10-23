/**
 * Todo o texto do site fica aqui. Editar este arquivo muda o site inteiro.
 * Marquei com "revisar" no comentário o que vale você conferir antes de publicar.
 */

export type Fato = { rotulo: string; valor: string }

export const SOBRE: { titulo: string; paragrafos: string[]; fatos: Fato[] } = {
  titulo: 'Aprendo construindo. E publico antes de estar pronto.',
  paragrafos: [
    'Sou Vinícius Odorizzi, tenho 16 anos e moro em Presidente Getúlio, no Alto Vale do Itajaí (SC). Estudo no IFC de Ibirama, no 2º ano do ensino médio integrado ao Técnico em Informática, e desde 2025 sou bolsista de iniciação científica no projeto LexiCube.',
    'No dia a dia construo o produto inteiro: interface, API, banco de dados e deploy. Prefiro entregar algo pequeno funcionando e no ar do que um plano grande na gaveta. É assim que mantenho hoje um marketplace local, um agente de vendas no WhatsApp e um pipeline de análise de notícias com LLMs.',
    'Se aparece um problema, eu resolvo com código. Depois eu melhoro.',
  ],
  fatos: [
    { rotulo: 'Base', valor: 'Presidente Getúlio, SC' },
    { rotulo: 'Formação', valor: 'IFC Ibirama: Técnico em Informática (2º ano)' },
    { rotulo: 'Bolsa', valor: 'PVI2822-2025, projeto LexiCube' },
    { rotulo: 'Stack', valor: 'TypeScript, React, Node.js, Python, MySQL, MongoDB' },
    { rotulo: 'Foco', valor: 'Produto web, IA aplicada e dados' },
  ],
}

/** Timeline: do mais recente para o mais antigo. Ajuste anos e textos aqui. */
export type Etapa = { ano: string; titulo: string; texto: string; agora?: boolean }

export const TRAJETORIA: Etapa[] = [
  {
    ano: '2026',
    titulo: 'MICTI 2026, Categoria 2',
    texto:
      'LexiCube selecionado para a mostra do IFC em Fraiburgo, de 24 a 26 de novembro. Levo o pipeline inteiro funcionando: coleta, extração de entidades, classificação e resumo.',
    agora: true,
  },
  {
    ano: '2026',
    titulo: 'Produtos próprios no ar',
    texto:
      'Acha Região, Odorizzi AI e este portfólio saem do rascunho: marca, interface, backend e deploy feitos por mim, do começo ao fim.',
  },
  {
    ano: '2025',
    titulo: 'Bolsa de iniciação científica (PVI2822-2025)',
    texto:
      'Aprovação no Edital ENPEX 15/2025 com o projeto LexiCube: análise de notícias com LLMs e OLAP. Primeiro contato sério com pipeline de dados, NER e modelo de linguagem rodando em produção.',
  },
  {
    ano: '2025',
    titulo: 'IFC Ibirama: Técnico em Informática',
    texto:
      'Ingresso no ensino médio integrado ao curso técnico. A base que sustenta o resto: lógica, estrutura de dados, banco de dados e desenvolvimento de sistemas.',
  },
]

export type Status = 'no-ar' | 'dev' | 'pausa'

export type Projeto = {
  numero: string
  nome: string
  resumo: string
  stack: string[]
  status: Status
  statusTexto: string
  link?: string
}

/* Se mudar a quantidade de projetos, ajuste o título abaixo. */
export const TITULO_PROJETOS = 'Cinco coisas que construí e estão no mundo.'

export const PROJETOS: Projeto[] = [
  {
    numero: '01',
    nome: 'Acha Região',
    resumo:
      'Marketplace do comércio local do Alto Vale. O app começa vazio, sem dado falso: cresce na medida em que o comércio entra, com QR code no balcão e compartilhamento no WhatsApp.',
    stack: ['JavaScript', 'Express', 'Render', 'Vercel'],
    status: 'no-ar',
    statusTexto: 'No ar',
    link: 'https://acha-regiao-qp7x.vercel.app',
  },
  {
    numero: '02',
    nome: 'LexiCube',
    resumo:
      'Análise de notícias com LLMs e OLAP: coleta por RSS, extração de entidades, classificação e resumo, tudo consolidado em um data warehouse. É o projeto da minha bolsa de iniciação científica no IFC.',
    stack: ['Python', 'LLM', 'NER', 'SQL', 'Flask'],
    status: 'dev',
    statusTexto: 'Em desenvolvimento',
  },
  {
    numero: '03',
    nome: 'Odorizzi AI',
    resumo:
      'Agente de vendas no WhatsApp. Atende, tira dúvidas, qualifica o contato e passa para um humano quando a conversa pede. Roda 24 horas sem depender de ninguém digitando.',
    stack: ['Node.js', 'Baileys', 'DeepSeek', 'MongoDB'],
    status: 'no-ar',
    statusTexto: 'No ar',
  },
  {
    numero: '04',
    nome: 'Morph Auto',
    resumo:
      'Transforma foto de carro tirada na rua em foto de anúncio, com fundo e iluminação de estúdio. Extensão de Chrome mais um pipeline de tratamento de imagem com IA.',
    stack: ['React', 'Chrome Extension', 'IA de imagem'],
    status: 'pausa',
    statusTexto: 'Em pausa',
  },
  {
    numero: '05',
    nome: 'Este portfólio',
    resumo:
      'O site que você está vendo. Tipografia serifada, muito branco e uma trilha de ícones que corre em loop por trás do nome e do círculo, sempre na camada de baixo.',
    stack: ['React', 'Vite', 'TypeScript'],
    status: 'no-ar',
    statusTexto: 'No ar',
    link: 'https://viniciusodorizzi.com',
  },
]

export const CONTATO = {
  github: 'https://github.com/ViniciusOdorizziHoppe',
  linkedin: 'https://www.linkedin.com/in/vinicius-odorizzi-5aa319353',
  instagram: 'https://www.instagram.com/vinicius.odorizzi',
  email: 'viniciushoppe@outlook.com',
  whatsapp: 'https://wa.me/5547997615032',
  cidade: 'Presidente Getúlio, SC',
}

/** Ordem da pilha de ícones no canto do hero. */
export const REDES: { nome: string; href: string }[] = [
  { nome: 'LinkedIn', href: CONTATO.linkedin },
  { nome: 'GitHub', href: CONTATO.github },
  { nome: 'Instagram', href: CONTATO.instagram },
  { nome: 'WhatsApp', href: CONTATO.whatsapp },
]
