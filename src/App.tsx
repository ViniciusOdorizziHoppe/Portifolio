import Ilha from './components/Ilha'
import TechTrail from './components/TechTrail'

/**
 * Primeira parte do site (hero) — segue o print de referência:
 * menu centralizado, nome serifado à esquerda, círculo (futura foto) à direita
 * e os ícones de tecnologia correndo em loop por trás dos dois.
 */

// Quando a foto estiver pronta: salve em public/eu.jpg e troque para '/eu.jpg'.
const FOTO: string | null = null

const LINKS = [
  { rotulo: 'Sobre Mim', href: '#sobre-mim' },
  { rotulo: 'Trajetória', href: '#trajetoria' },
  { rotulo: 'Projetos', href: '#projetos' },
]

export default function App() {
  return (
    <main className="hero">
      <TechTrail />

      <nav className="menu" aria-label="Navegação principal">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.rotulo}
          </a>
        ))}
      </nav>

      <h1 className="nome">
        Vinícius <span>Odorizzi</span>
      </h1>

      <Ilha foto={FOTO} />
    </main>
  )
}
