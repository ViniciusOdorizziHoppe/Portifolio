import { PROJETOS, TITULO_PROJETOS } from '../conteudo'
import type { Projeto } from '../conteudo'

function Conteudo({ projeto }: { projeto: Projeto }) {
  return (
    <>
      <span className="projeto__num" aria-hidden="true">
        {projeto.numero}
      </span>

      <div className="projeto__corpo">
        <h3 className="projeto__nome">{projeto.nome}</h3>
        <p className="projeto__desc">{projeto.resumo}</p>

        <ul className="tags" aria-label="Tecnologias">
          {projeto.stack.map((tec) => (
            <li className="tag" key={tec}>
              {tec}
            </li>
          ))}
        </ul>
      </div>

      <div className="projeto__meta">
        <span className={`status status--${projeto.status}`}>{projeto.statusTexto}</span>
        {projeto.link && (
          <span className="projeto__seta" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>
    </>
  )
}

export default function Projetos() {
  return (
    <section className="sessao" id="projetos" aria-labelledby="titulo-projetos">
      <p className="rotulo">03 / Projetos</p>

      <h2 className="titulo" id="titulo-projetos">
        {TITULO_PROJETOS}
      </h2>

      <ul className="projetos">
        {PROJETOS.map((projeto) => (
          <li className="projeto" key={projeto.numero}>
            {projeto.link ? (
              <a className="projeto__linha" href={projeto.link} target="_blank" rel="noopener noreferrer">
                <Conteudo projeto={projeto} />
              </a>
            ) : (
              <div className="projeto__linha">
                <Conteudo projeto={projeto} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
