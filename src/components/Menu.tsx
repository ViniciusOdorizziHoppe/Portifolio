import { useEffect, useRef, useState } from 'react'

const LINKS = [
  { rotulo: 'Sobre Mim', href: '#sobre-mim', id: 'sobre-mim' },
  { rotulo: 'Trajetória', href: '#trajetoria', id: 'trajetoria' },
  { rotulo: 'Projetos', href: '#projetos', id: 'projetos' },
]

/**
 * Menu fixo. Sobre o hero ele fica transparente (igual ao print) e só ganha
 * fundo branco depois que a página rola. A seção em leitura fica em azul.
 */
export default function Menu() {
  const [solido, setSolido] = useState(false)
  const [ativo, setAtivo] = useState<string | null>(null)
  const quadro = useRef(0)

  useEffect(() => {
    const medir = () => {
      quadro.current = 0
      setSolido(window.scrollY > 24)

      const linha = window.scrollY + window.innerHeight * 0.35
      let atual: string | null = null
      for (const link of LINKS) {
        const el = document.getElementById(link.id)
        if (el && el.getBoundingClientRect().top + window.scrollY <= linha) atual = link.id
      }
      setAtivo(atual)
    }

    const aoRolar = () => {
      if (quadro.current) return
      quadro.current = requestAnimationFrame(medir)
    }

    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', aoRolar)
    medir()

    return () => {
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('resize', aoRolar)
      if (quadro.current) cancelAnimationFrame(quadro.current)
    }
  }, [])

  return (
    <header className={`menu${solido ? ' menu--solido' : ''}`}>
      <nav aria-label="Navegação principal">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={ativo === link.id ? 'ativo' : undefined}
            aria-current={ativo === link.id ? 'true' : undefined}
          >
            {link.rotulo}
          </a>
        ))}
      </nav>
    </header>
  )
}
