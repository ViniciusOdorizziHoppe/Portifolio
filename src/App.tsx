import { useEffect } from 'react'
import Ilha from './components/Ilha'
import Menu from './components/Menu'
import Projetos from './components/Projetos'
import Redes from './components/Redes'
import Rodape from './components/Rodape'
import SobreMim from './components/SobreMim'
import TechTrail from './components/TechTrail'
import Trajetoria from './components/Trajetoria'

/**
 * Primeira parte do site segue o print de referência: menu centralizado, nome
 * serifado à esquerda, círculo (futura foto) à direita e os ícones de
 * tecnologia correndo em loop por trás dos dois. Abaixo vêm as três seções.
 */

// Quando a foto estiver pronta: salve em public/eu.jpg e troque para '/eu.jpg'.
const FOTO: string | null = null

export default function App() {
  // Link direto com #secao precisa rolar depois que o React monta a página.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    const alvo = document.getElementById(id)
    if (alvo) requestAnimationFrame(() => alvo.scrollIntoView({ block: 'start' }))
  }, [])

  return (
    <>
      <Menu />

      <main>
        <section className="hero" aria-label="Vinícius Odorizzi">
          <TechTrail />
          <h1 className="nome">
            Vinícius <span>Odorizzi</span>
          </h1>
          <Ilha foto={FOTO} />
          <Redes />
        </section>

        <SobreMim />
        <Trajetoria />
        <Projetos />
      </main>

      <Rodape />
    </>
  )
}
