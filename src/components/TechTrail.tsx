import { useEffect, useRef, useState } from 'react'
import { TECH } from '../tech-icons'

/**
 * Trilha das tecnologias — os ícones correm em loop por uma curva que cruza o
 * hero por trás do nome e do círculo (z-index menor que os dois).
 *
 * A curva foi levantada do print de referência: os pontos de controle são os
 * centros dos ícones na imagem original (1047×588), convertidos para unidades
 * de um viewBox 0–100. O viewBox é esticado sobre o hero (preserveAspectRatio
 * "none") e por isso o comprimento é amostrado em PIXELS — assim a velocidade
 * e a rotação ficam corretas em qualquer proporção de tela.
 */

const TRILHA_DESKTOP =
  'M -14.33,1.70 C -11.29,3.75 3.13,12.74 7.16,16.16 C 11.19,19.58 12.34,22.65 14.14,25.85 C 15.94,29.05 18.22,33.41 19.87,38.78 C 21.52,44.15 23.94,57.59 25.79,63.78 C 27.64,69.97 30.79,79.78 32.95,82.48 C 35.11,85.18 38.63,82.94 41.07,82.82 C 43.51,82.70 47.16,82.57 50.14,81.63 C 53.12,80.69 58.77,79.80 62.08,76.19 C 65.39,72.58 69.91,64.02 73.54,56.12 C 77.17,48.22 84.39,25.57 87.68,20.41 C 90.97,15.25 93.21,21.42 96.75,19.73 C 100.29,18.04 110.44,10.09 112.70,8.50'

// No celular o hero fica em pé: a curva desce em diagonal, atrás do nome e da ilha.
const TRILHA_MOBILE =
  'M -14.00,3.00 C -9.75,4.42 9.77,9.60 16.00,13.00 C 22.23,16.40 26.03,22.75 30.00,27.00 C 33.97,31.25 40.32,38.75 44.00,43.00 C 47.68,47.25 52.60,52.89 56.00,57.00 C 59.40,61.11 64.60,68.60 68.00,72.00 C 71.40,75.40 75.89,78.59 80.00,81.00 C 84.11,83.41 92.18,88.43 97.00,89.00 C 101.82,89.57 111.59,85.57 114.00,85.00'

const VOLTA_MS = 48000 // uma volta completa
const AMOSTRAS = 720

// Tamanho relativo de cada ícone (o print mistura escalas: GitHub/MySQL maiores).
const ESCALA = [1.06, 1.0, 0.96, 0.92, 0.86, 0.92, 0.84, 0.98, 1.12, 0.88, 1.08, 1.02]

type Ponto = { x: number; y: number; ang: number; acc: number }

export default function TechTrail() {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const iconesRef = useRef<(HTMLSpanElement | null)[]>([])
  const [estreito, setEstreito] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    const aoMudar = () => setEstreito(mq.matches)
    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    const path = pathRef.current
    if (!svg || !path) return

    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const total = TECH.length
    let pontos: Ponto[] = []
    let comprimento = 0
    let raf = 0
    let inicio = 0

    /** Amostra a curva e acumula a distância em pixels. */
    const medir = () => {
      const caixa = svg.getBoundingClientRect()
      if (!caixa.width || !caixa.height) return
      const bruto = path.getTotalLength()
      const px: { x: number; y: number }[] = []

      for (let i = 0; i <= AMOSTRAS; i++) {
        const p = path.getPointAtLength((i / AMOSTRAS) * bruto)
        px.push({ x: (p.x / 100) * caixa.width, y: (p.y / 100) * caixa.height })
      }

      pontos = []
      comprimento = 0
      for (let i = 0; i <= AMOSTRAS; i++) {
        const anterior = pontos[i - 1]
        const d = anterior ? Math.hypot(px[i].x - anterior.x, px[i].y - anterior.y) : 0
        comprimento += d
        pontos.push({ x: px[i].x, y: px[i].y, ang: 0, acc: comprimento })
      }

      for (let i = 0; i <= AMOSTRAS; i++) {
        const a = pontos[Math.max(0, i - 1)]
        const b = pontos[Math.min(AMOSTRAS, i + 1)]
        pontos[i].ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
      }
    }

    /** Posição + ângulo para u ∈ [0,1] do comprimento já em pixels. */
    const posicao = (u: number) => {
      const alvo = u * comprimento
      let lo = 0
      let hi = pontos.length - 1
      while (lo < hi - 1) {
        const meio = (lo + hi) >> 1
        if (pontos[meio].acc < alvo) lo = meio
        else hi = meio
      }
      const a = pontos[lo]
      const b = pontos[hi]
      const f = b.acc > a.acc ? (alvo - a.acc) / (b.acc - a.acc) : 0
      return {
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
        ang: a.ang + (b.ang - a.ang) * f,
      }
    }

    const pintar = (u: number, i: number) => {
      const el = iconesRef.current[i]
      if (!el) return
      const { x, y, ang } = posicao(((u % 1) + 1) % 1)
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${ang.toFixed(1)}deg)`
      el.style.opacity = '1'
    }

    const distribuir = (u0: number) => {
      for (let i = 0; i < total; i++) pintar(u0 + i / total, i)
    }

    const animar = (agora: number) => {
      if (!inicio) inicio = agora
      distribuir((agora - inicio) / VOLTA_MS)
      raf = requestAnimationFrame(animar)
    }

    const iniciar = () => {
      medir()
      distribuir(0)
      if (!semMovimento && document.visibilityState === 'visible') {
        inicio = 0
        raf = requestAnimationFrame(animar)
      }
    }

    const parar = () => cancelAnimationFrame(raf)

    iniciar()

    let debounce = 0
    const aoRedimensionar = () => {
      window.clearTimeout(debounce)
      debounce = window.setTimeout(() => {
        parar()
        iniciar()
      }, 160)
    }

    const aoTrocarVisibilidade = () => {
      parar()
      if (document.visibilityState === 'visible' && !semMovimento) {
        inicio = 0
        raf = requestAnimationFrame(animar)
      }
    }

    // pausa quando o hero sai da tela (economiza bateria)
    const observador = new IntersectionObserver(
      ([entrada]) => {
        parar()
        if (entrada.isIntersecting && !semMovimento) {
          inicio = 0
          raf = requestAnimationFrame(animar)
        }
      },
      { threshold: 0 },
    )
    observador.observe(svg)

    window.addEventListener('resize', aoRedimensionar)
    document.addEventListener('visibilitychange', aoTrocarVisibilidade)

    return () => {
      parar()
      window.clearTimeout(debounce)
      observador.disconnect()
      window.removeEventListener('resize', aoRedimensionar)
      document.removeEventListener('visibilitychange', aoTrocarVisibilidade)
    }
  }, [estreito])

  return (
    <div className="trilha" aria-hidden="true">
      <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none">
        <path ref={pathRef} d={estreito ? TRILHA_MOBILE : TRILHA_DESKTOP} fill="none" stroke="none" />
      </svg>

      {TECH.map((tec, i) => (
        <span
          key={tec.name}
          className="icone"
          ref={(el) => {
            iconesRef.current[i] = el
          }}
          style={{ ['--tam' as string]: `calc(var(--icone) * ${ESCALA[i] ?? 1})` }}
        >
          <svg viewBox="0 0 24 24" role="img" aria-label={tec.name}>
            <path d={tec.path} fill={tec.hex} />
          </svg>
        </span>
      ))}
    </div>
  )
}
