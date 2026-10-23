import { SOBRE } from '../conteudo'

export default function SobreMim() {
  return (
    <section className="sessao" id="sobre-mim" aria-labelledby="titulo-sobre">
      <p className="rotulo">01 / Sobre mim</p>

      <div className="sobre">
        <div className="sobre__texto">
          <h2 className="titulo" id="titulo-sobre">
            {SOBRE.titulo}
          </h2>
          {SOBRE.paragrafos.map((paragrafo) => (
            <p key={paragrafo.slice(0, 24)} className="corpo">
              {paragrafo}
            </p>
          ))}
        </div>

        <dl className="fatos">
          {SOBRE.fatos.map((fato) => (
            <div key={fato.rotulo}>
              <dt>{fato.rotulo}</dt>
              <dd>{fato.valor}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
