import { TRAJETORIA } from '../conteudo'

export default function Trajetoria() {
  return (
    <section className="sessao" id="trajetoria" aria-labelledby="titulo-trajetoria">
      <p className="rotulo">02 / Trajetória</p>

      <h2 className="titulo" id="titulo-trajetoria">
        Onde eu estou e como cheguei aqui.
      </h2>

      <ol className="linha-tempo">
        {TRAJETORIA.map((etapa) => (
          <li className="etapa" key={`${etapa.ano}-${etapa.titulo}`}>
            <span className="etapa__ano">{etapa.ano}</span>
            <div>
              <h3 className="etapa__titulo">
                {etapa.titulo}
                {etapa.agora && <span className="marca">próximo</span>}
              </h3>
              <p className="etapa__texto">{etapa.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
