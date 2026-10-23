/**
 * O círculo do hero — a "ilha": céu, nuvem e duas colinas.
 * É o lugar reservado para a foto do Vinícius: basta passar `foto` (ex.: '/eu.jpg'
 * colocado em public/) e a imagem entra no lugar da ilustração, recortada no
 * mesmo círculo.
 */
type Props = { foto?: string | null }

export default function Ilha({ foto = null }: Props) {
  if (foto) {
    return (
      <div className="ilha">
        <img src={foto} alt="Vinícius Odorizzi" loading="eager" decoding="async" />
      </div>
    )
  }

  return (
    <div className="ilha" role="img" aria-label="Ilustração de uma paisagem: céu com nuvem e colinas verdes">
      <svg viewBox="0 0 300 300">
        <defs>
          <clipPath id="recorte-ilha">
            <circle cx="150" cy="150" r="150" />
          </clipPath>
          <linearGradient id="ceu-ilha" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4E9FF" />
            <stop offset="45%" stopColor="#DEF4FF" />
            <stop offset="72%" stopColor="#F1FBFF" />
            <stop offset="100%" stopColor="#F7FDFF" />
          </linearGradient>
        </defs>

        <g clipPath="url(#recorte-ilha)">
          <rect width="300" height="300" fill="url(#ceu-ilha)" />

          {/* nuvem */}
          <g fill="#ffffff">
            <circle cx="110" cy="62" r="20" />
            <circle cx="150" cy="44" r="32" />
            <circle cx="188" cy="60" r="21" />
            <rect x="90" y="60" width="120" height="22" rx="11" />
          </g>

          {/* colina de trás (verde claro) */}
          <path
            d="M0,206 C45,197 85,193 128,200 C170,207 215,214 250,226 C275,234 292,239 300,240 L300,300 L0,300 Z"
            fill="#C5DF82"
          />

          {/* colina da frente (verde oliva) */}
          <path
            d="M0,264 C30,252 62,240 100,232 C138,224 170,228 200,233 C240,239 274,239 300,238 L300,300 L0,300 Z"
            fill="#88A201"
          />
        </g>
      </svg>
    </div>
  )
}
