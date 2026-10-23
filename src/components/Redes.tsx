import { REDES } from '../conteudo'
import { ICONES_REDE } from '../redes-icons'

/**
 * Pilha de redes sociais no canto inferior esquerdo do hero (como no print).
 * LinkedIn e Instagram usam tile colorido com o símbolo em branco; GitHub é o
 * gato preto puro e o WhatsApp é o balão verde.
 */

function Icone({ nome }: { nome: string }) {
  if (nome === 'LinkedIn') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect width="24" height="24" rx="3.2" fill="#0A66C2" />
        <text
          x="12"
          y="18.1"
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="14.6"
          fontWeight="700"
          letterSpacing="-0.7"
          fill="#ffffff"
        >
          in
        </text>
      </svg>
    )
  }

  if (nome === 'Instagram') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="grad-instagram" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#FEDA75" />
            <stop offset="35%" stopColor="#FA7E1E" />
            <stop offset="62%" stopColor="#D62976" />
            <stop offset="100%" stopColor="#4F5BD5" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="5.4" fill="url(#grad-instagram)" />
        <g transform="translate(3.4 3.4) scale(0.7167)">
          <path d={ICONES_REDE.Instagram} fill="#ffffff" />
        </g>
      </svg>
    )
  }

  if (nome === 'WhatsApp') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect width="24" height="24" rx="5.4" fill="#25D366" />
        <g transform="translate(3.6 3.6) scale(0.7)">
          <path d={ICONES_REDE.WhatsApp} fill="#ffffff" />
        </g>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONES_REDE.GitHub} fill="#181717" />
    </svg>
  )
}

export default function Redes() {
  return (
    <ul className="redes">
      {REDES.map((rede) => (
        <li key={rede.nome}>
          <a
            href={rede.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={rede.nome}
            title={rede.nome}
          >
            <Icone nome={rede.nome} />
          </a>
        </li>
      ))}
    </ul>
  )
}
