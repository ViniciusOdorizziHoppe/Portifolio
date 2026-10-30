# Enemzeiro — sistema de contas, acesso e webhooks

App em `/enemzeiro`, API em `/api/ez/*` (uma única função roteadora: limite de 12 funções do plano Hobby), banco no Neon (tabelas `ez_*`).

## Como o acesso funciona

```
compra na plataforma
      │  webhook assinado
      ▼
/api/ez/webhook-<plataforma>  →  ez_eventos (dedupe)  →  ez_acessos (status + acesso_ate)
                                                              │
aluno entra com e-mail e senha  →  ez_sessoes (cookie HttpOnly) ─┘
      │
      ▼
/api/ez/sessao  responde liberado: true/false
```

- **Conta criada pela compra**: o webhook cria a conta com o e-mail do comprador, sem senha.
  O aluno usa "Cadastre-se" com **o mesmo e-mail da compra** e define a senha (rota `ez-cadastro` completa a conta existente) — ou `ez-ativar` só define a senha.
- **Reembolso** corta o acesso na hora. **Cancelamento** mantém até a data paga.
- **Evento repetido** não renova duas vezes (idempotência por transação + status).
- **Sem trial** por padrão? Não: `EZ_TRIAL_DIAS` (padrão **7**). `0` desliga o teste grátis.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

Obrigatórias para vender:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | já existe (Neon) |
| `EZ_WEBHOOK_HOTMART_TOKEN` | segredo só seu (veja abaixo) |
| `EZ_WEBHOOK_KIWIFY_TOKEN` | idem |
| `EZ_WEBHOOK_EDUZZ_TOKEN` | idem |
| `EZ_WEBHOOK_MONETIZZE_TOKEN` | idem |
| `EZ_WEBHOOK_KIRVANO_TOKEN` | idem |
| `EZ_TRIAL_DIAS` | `7` (ou `0` para desligar) |

Alternativa ao token na URL: `EZ_WEBHOOK_<PLATAFORMA>_SECRET` aceita **HMAC SHA-256** do corpo
(header `x-webhook-signature`/`signature` ou `?signature=`). Se nenhum dos dois existir, o webhook
**recusa tudo** (fail closed) — de propósito.

## URLs de webhook (colar em cada plataforma)

```
https://www.viniciusodorizzi.com/api/ez/webhook-hotmart?t=SEU_TOKEN
https://www.viniciusodorizzi.com/api/ez/webhook-kiwify?t=SEU_TOKEN
https://www.viniciusodorizzi.com/api/ez/webhook-eduzz?t=SEU_TOKEN
https://www.viniciusodorizzi.com/api/ez/webhook-monetizze?t=SEU_TOKEN
https://www.viniciusodorizzi.com/api/ez/webhook-kirvano?t=SEU_TOKEN
```

## Rotas

| Rota | Método | O que faz |
|---|---|---|
| `/api/ez/cadastro` | POST | cria conta (ou completa a criada pela compra) e abre sessão |
| `/api/ez/entrar` | POST | login, com bloqueio após 10 tentativas por 15 min |
| `/api/ez/ativar` | POST | primeiro acesso de quem comprou (define a senha) |
| `/api/ez/sessao` | GET | diz se pode abrir e se tem acesso |
| `/api/ez/progresso` | GET/POST | sincroniza o progresso (máx. 48 KB) |
| `/api/ez/sair` | POST | encerra a sessão |
| `/api/ez/conta` | DELETE | apaga conta, senha, sessão, progresso (LGPD) |

## Segurança aplicada

- senha com **scrypt** + salt, comparação em tempo constante
- sessão: token de 32 bytes aleatórios, guardado só no servidor, cookie `HttpOnly` + `SameSite=Lax` (+ `Secure` em https)
- login: mensagem genérica (não revela se o e-mail existe) e freio de força bruta por IP+e-mail
- SQL sempre parametrizado
- corpo limitado a 64 KB, progresso a 48 KB
- webhook: segredo na URL **ou** HMAC, comparação em tempo constante, dedupe por transação
- `Cache-Control: no-store` e `X-Content-Type-Options: nosniff` em todas as respostas

## Testes

```bash
node tests/enemzeiro.test.mjs        # 47 asserções: webhook, acesso, login, sessão, progresso, LGPD
node tests/servidor-ez.mjs           # app + API com PGlite em http://localhost:4400/enemzeiro/
node tests/aplicar-schema-enemzeiro.mjs  # aplica sql/enemzeiro.sql no Neon
```
