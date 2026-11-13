#!/usr/bin/env python3
"""Envia ofertas da Shopee (ofertas.json) para a fila do fb-bot na VPS.

A VPS não consegue raspar a Shopee (precisa do navegador logado que fica
no notebook), então o fluxo é: o PC escolhe as ofertas, formata o post e
empurra para a fila; a VPS publica na Página no horário.

Exemplos:
  python enviar_ofertas.py --n 3                  # 3 ofertas boas, publica já (1 a cada intervalo)
  python enviar_ofertas.py --n 5 --quando 2026-11-14T09:00
  python enviar_ofertas.py --n 2 --dry            # só mostra o texto, não envia
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

RAIZ = os.path.dirname(os.path.abspath(__file__))
OFERTAS = os.path.abspath(os.path.join(RAIZ, "..", "..", "..", "promo-shopee", "ofertas.json"))
API_PADRAO = "http://185.115.161.188:8183"
CHAVE_PADRAO = os.environ.get("FB_CHAVE", "")


def carregar_ofertas(caminho: str):
    with open(caminho, encoding="utf-8") as f:
        dados = json.load(f)
    if isinstance(dados, dict):
        return dados.get("ofertas") or dados.get("itens") or []
    return dados


def link_com_sub(link: str, item_id: str) -> str:
    """Anexa (ou troca) o sub_id para separar o tráfego do Facebook."""
    if not link:
        return ""
    base = link.split("?")[0]
    return f"{base}?sub_id={item_id}-facebook-pg"


def texto_html(nome: str, preco: float, antes: float, desconto: int, link: str, vendas: str) -> str:
    nome_curto = (nome or "").strip()
    if len(nome_curto) > 95:
        nome_curto = nome_curto[:92].rstrip() + "..."

    def brl(v):
        return "R$ " + f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    linhas = [
        "🔥 ACHADINHO DO DIA",
        "",
        nome_curto,
        "",
        f"💰 De {brl(antes)} por {brl(preco)}  ({desconto}% OFF)",
    ]
    if vendas:
        linhas.append(f"📦 {vendas} vendidos")
    linhas += [
        "",
        f"🛒 {link}",
        "",
        "#achadinhos #shopee #ofertas #promocao",
    ]
    return "\n".join(linhas)


def escolher(ofertas, n: int, min_comissao: float, min_desconto: float):
    boas = []
    for o in ofertas:
        if not o.get("ativo", True):
            continue
        if not o.get("link"):
            continue
        comissao = float(o.get("comissao_reais") or 0)
        desconto = int(o.get("desconto") or 0)
        if comissao < min_comissao or desconto < min_desconto:
            continue
        boas.append(o)

    boas.sort(key=lambda o: (float(o.get("comissao_reais") or 0), int(o.get("desconto") or 0)), reverse=True)
    return boas[:n]


def enviar(api: str, chave: str, itens):
    corpo = json.dumps({"itens": itens}).encode("utf-8")
    req = urllib.request.Request(
        api.rstrip("/") + "/fb/fila",
        data=corpo,
        method="POST",
        headers={"content-type": "application/json", "x-chave": chave},
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    p = argparse.ArgumentParser(description="Manda ofertas da Shopee para a fila do Facebook")
    p.add_argument("--n", type=int, default=3, help="quantas ofertas")
    p.add_argument("--min-comissao", type=float, default=20.0, help="comissão mínima em R$")
    p.add_argument("--min-desconto", type=float, default=25.0, help="desconto mínimo em %%")
    p.add_argument("--quando", default=None, help="ISO 8601 (padrão: publicar assim que o robô rodar)")
    p.add_argument("--api", default=API_PADRAO)
    p.add_argument("--chave", default=CHAVE_PADRAO)
    p.add_argument("--arquivo", default=OFERTAS)
    p.add_argument("--dry", action="store_true", help="só imprime, não envia")
    args = p.parse_args()

    if not os.path.exists(args.arquivo):
        sys.exit(f"não achei {args.arquivo}")

    ofertas = carregar_ofertas(args.arquivo)
    escolhidas = escolher(ofertas, args.n, args.min_comissao, args.min_desconto)
    if not escolhidas:
        sys.exit("nenhuma oferta passou no filtro (comissão/desconto)")
    if not args.chave and not args.dry:
        sys.exit("defina a chave: --chave XXX ou variável FB_CHAVE")

    quando = args.quando or datetime.now(timezone.utc).isoformat()
    itens = []
    for o in escolhidas:
        item_id = str(o.get("item_id") or o.get("id"))
        link = link_com_sub(o.get("link") or o.get("link_curto") or "", item_id)
        itens.append(
            {
                "mensagem": texto_html(
                    o.get("nome", ""),
                    float(o.get("preco") or 0),
                    float(o.get("preco_antigo") or o.get("preco") or 0),
                    int(o.get("desconto") or 0),
                    link,
                    str(o.get("vendas") or ""),
                ),
                "link": link,
                "imagem": o.get("imagem") or "",
                "quando": quando,
                "etiqueta": item_id,
                "origem": "ofertas.json",
            }
        )
        print("─" * 60)
        print(itens[-1]["mensagem"])
        print(f"[comissão R$ {o.get('comissao_reais')} · desconto {o.get('desconto')}%]")

    if args.dry:
        print("\n(dry run: nada foi enviado)")
        return

    try:
        r = enviar(args.api, args.chave, itens)
    except urllib.error.HTTPError as e:
        sys.exit(f"API respondeu {e.code}: {e.read().decode('utf-8', 'ignore')[:300]}")
    except Exception as e:
        sys.exit(f"falha ao falar com a API: {e}")

    print("\n✓", r.get("criados"), "item(ns) na fila")
    for i in r.get("itens", []):
        print("  ", i.get("id"), i.get("etiqueta"), i.get("quando"))


if __name__ == "__main__":
    main()
