import { type CSSProperties, type ReactNode } from 'react'
import { ArrowRight } from '@phosphor-icons/react'

/* --- Fonts --- */

/**
 * As duas faces do hero. Cinzel carrega o título (a marca "Vinícius Odorizzi"
 * já vive nela); Geist carrega o resto. Ambas já vêm carregadas no index.html
 * do site, então este arquivo fica self-contained sem wiring extra de fonte.
 */
const SERIF = "'Cinzel', ui-serif, Georgia, Cambria, serif"
const SANS =
  "'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"

/* --- Motion --- */

/**
 * O texto sobe em cascata no load. Guardado por prefers-reduced-motion:
 * quem pede página parada recebe página parada.
 */
const HERO_STYLES = `
@keyframes portfolio-hero-rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .portfolio-hero-rise { animation: none !important; opacity: 1 !important; transform: none !important; }
}
`

/**
 * O que o botão faz sob o ponteiro.
 *
 * O sheen é disparado pelo :hover (nunca em loop sob máscara): loop fica onde
 * estiver quando o ponteiro chega — metade das vezes você pega o brilho parado
 * na borda. Preso ao hover ele sai da borda esquerda e cruza uma vez.
 *
 * O rosto também levanta, como no cluely.com: um banho de branco em blend
 * `overlay`, que clareia a pintura em vez de cobri-la.
 */
const BUTTON_STYLES = `
@keyframes portfolio-hero-sheen {
  from { transform: translateX(-140%) skewX(-16deg); }
  to   { transform: translateX(320%)  skewX(-16deg); }
}
.portfolio-hero-sheen { transform: translateX(-140%) skewX(-16deg); }
.portfolio-hero-btn:hover .portfolio-hero-sheen {
  animation: portfolio-hero-sheen 0.85s cubic-bezier(0.32, 0, 0.24, 1);
}
.portfolio-hero-btn::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: 1;
  border-radius: inherit;
  opacity: 0;
  mix-blend-mode: overlay;
  background: radial-gradient(101.79% 101.79% at 65.61% 81.79%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%);
  transition: opacity 0.3s ease-in-out;
}
.portfolio-hero-btn:hover::after { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .portfolio-hero-btn:hover .portfolio-hero-sheen { animation: none; }
}
`

/** Uma linha subindo. `step` ordena contra as vizinhas. */
function rise(step: number): CSSProperties {
  return {
    animation: `portfolio-hero-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${step * 0.09}s both`,
  }
}

/* --- Button --- */

/**
 * O botão de vidro, na versão ouro da marca (amarelo #F5C518 em vez do azul
 * do cluely). Quatro camadas fazem o vidro:
 *
 * 1. Dois radiais empilhados — banho de branco baixo e à direita, sobre um
 *    ouro que corre de champagne a âmbar — em blend `overlay`, que é o que
 *    impede de ler como tinta chapada.
 * 2. Um fio de luz brilhante no topo que morre embaixo, desenhado como caixa
 *    com padding mascarada até a própria borda (borda normal não aceita
 *    gradiente).
 * 3. Duas sombras internas: luz fria no lábio superior, âmbar fundo no poço
 *    inferior.
 * 4. Uma faixa de luz que cruza o rosto uma vez por hover, sobre o banho que
 *    levanta a face. Ver BUTTON_STYLES.
 */
function HeroButton({ href, icon, children }: { href: string; icon?: ReactNode; children?: ReactNode }) {
  return (
    <a
      href={href}
      className="portfolio-hero-btn relative inline-flex w-fit items-center gap-[8px] overflow-hidden rounded-[10px] px-6 py-[13px] text-[16px] font-bold tracking-[-0.13px] transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      style={{
        fontFamily: SANS,
        color: '#201400',
        backgroundImage:
          'radial-gradient(101.79% 101.79% at 65.61% 81.79%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%), radial-gradient(114.65% 114.65% at 9.73% 17.27%, #ffd75e 0%, #c98a06 100%)',
        backgroundBlendMode: 'overlay, normal',
        boxShadow:
          '20px 20px 24px rgba(245,197,24,0.3), inset -3px -3px 4px rgba(255,235,170,0.5), inset 4px 4px 4px rgba(120,80,0,0.3)',
      }}
    >
      <style>{BUTTON_STYLES}</style>

      {/* Borda iluminada. Um fio de blur para ler como vidro, não como traço. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 z-20 blur-[1px]">
        <span
          className="absolute -left-px -top-px z-20 h-full w-full"
          style={{
            opacity: 0.45,
            padding: 3,
            borderRadius: 10,
            background:
              'linear-gradient(176.87deg, rgba(255,255,255,0.55) 8.56%, rgba(255,255,255,0) 85.04%)',
            WebkitMask:
              'linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)',
            WebkitMaskComposite: 'xor',
            mask: 'linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)',
            maskComposite: 'exclude',
          }}
        />
      </span>

      {/* O sweep. Espera fora da borda esquerda e cruza uma vez por hover. */}
      <span
        aria-hidden
        className="portfolio-hero-sheen pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 blur-[5px]"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)',
        }}
      />

      {icon ? <span className="relative z-30 -mb-px">{icon}</span> : null}
      <span className="relative z-30">{children}</span>
    </a>
  )
}

/* --- Component --- */

/**
 * Um hero que senta DENTRO da fotografia em vez de por cima dela.
 *
 * O problema de texto branco sobre foto clara é que overlay preto chapado
 * conserta a leitura e destrói a foto. O véu aqui é um gradiente: pesado no
 * céu (onde estão as palavras) e zerado no meio do quadro (onde começa a
 * terra). Uma poça suave de sombra atrás do texto pelo mesmo motivo — segue as
 * palavras em vez de seguir o quadro.
 *
 * Título em serifa (Cinzel, a marca) e o resto em grotesca (Geist), para as
 * duas nunca brigarem.
 */
export default function HeroImage() {
  const veil = 0.85
  const lead = 0.32
  const minHeight = '100svh'

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-[#0a0d12]"
      style={{ minHeight, fontFamily: SANS }}
    >
      <style>{HERO_STYLES}</style>

      {/* Foto, depois os dois véus, depois o texto — empilhados por z explícito
          (e não por índice negativo na foto), para um background setado de fora
          nunca cair no meio da pilha. */}
      <img
        src="/hero-bg.jpg"
        alt=""
        aria-hidden
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 z-0 h-full w-full object-cover"
        style={{ objectPosition: '50% 55%' }}
      />

      {/* Peso na faixa de leitura, zero no topo — véu que nasce forte deixa o
          céu cinza. */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(to bottom,
            rgba(3,8,14,${0.14 * veil}) 0%,
            rgba(3,8,14,${0.3 * veil}) 30%,
            rgba(3,8,14,${0.12 * veil}) 58%,
            rgba(3,8,14,0) 74%)`,
        }}
      />

      {/* Sombra que segue as palavras, não o quadro. Alta o bastante para
          alcançar a linha sob o botão. */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background: `radial-gradient(56% 54% at 50% ${lead * 100 + 12}%,
            rgba(2,6,10,${0.46 * veil}) 0%,
            rgba(2,6,10,${0.26 * veil}) 48%,
            rgba(2,6,10,0) 78%)`,
        }}
      />

      <div
        className="relative z-10 flex h-full w-full flex-col items-center px-6 text-center sm:px-10"
        style={{
          minHeight,
          paddingTop: `calc(${lead} * ${minHeight} - 6rem)`,
          paddingBottom: '4rem',
        }}
      >
        <p
          className="portfolio-hero-rise mb-5 inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.18em] text-white/70"
          style={rise(0)}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Disponível para novos projetos · Q3 2026
        </p>

        <h1
          className="portfolio-hero-rise max-w-[20ch] text-balance text-[clamp(2.5rem,7.4vw,5rem)] font-normal leading-[1.02] tracking-[-0.02em] text-white"
          style={{
            ...rise(1),
            fontFamily: SERIF,
            textShadow: '0 2px 30px rgba(3,8,14,0.5)',
          }}
        >
          Do código ao caixa.
        </h1>

        <p
          className="portfolio-hero-rise mt-6 max-w-[64ch] text-pretty text-[clamp(1rem,1.5vw,1.175rem)] font-normal leading-relaxed text-white"
          style={{
            ...rise(2),
            textShadow: '0 1px 18px rgba(3,8,14,0.55)',
          }}
        >
          Sou Vinícius Odorizzi — desenvolvedor full-stack do Alto Vale (SC).
          Crio sites, aplicações e automações que convertem e escalam, do
          design ao deploy. Sem enrolação, sem código de mentira: resultado
          medido em venda.
        </p>

        <div className="portfolio-hero-rise mt-9 flex flex-col items-center gap-3" style={rise(3)}>
          <HeroButton href="#contato" icon={<ArrowRight size={18} weight="bold" />}>
            Solicitar orçamento
          </HeroButton>

          <p
            className="text-[13px] text-white/70"
            style={{ textShadow: '0 1px 10px rgba(3,8,14,0.9)' }}
          >
            Técnico em Informática IFC · Bolsa PVI LexiCube · resposta em até 24h
          </p>
        </div>
      </div>
    </section>
  )
}
