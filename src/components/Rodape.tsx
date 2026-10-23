import { CONTATO } from '../conteudo'

export default function Rodape() {
  return (
    <footer className="rodape">
      <div>
        <p className="rodape__nome">
          Vinícius <span>Odorizzi</span>
        </p>
        <p className="rodape__cidade">{CONTATO.cidade}</p>
      </div>

      <nav className="rodape__links" aria-label="Contato">
        <a href={CONTATO.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
        <a href={`mailto:${CONTATO.email}`}>{CONTATO.email}</a>
        <a href={CONTATO.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href={CONTATO.instagram} target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
        <a href={CONTATO.whatsapp} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
      </nav>
    </footer>
  )
}
