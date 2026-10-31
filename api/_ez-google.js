// Login com Google: o app manda o access token que o Google entregou ao navegador
// e aqui confirmamos com o proprio Google que o token é valido E que foi emitido
// para o nosso Client ID (aud). Sem client secret, sem confiar no que o cliente diz.
const GOOGLE_TOKENINFO = 'https://oauth2.googleapis.com/tokeninfo';
const GOOGLE_USERINFO = 'https://www.googleapis.com/oauth2/v3/userinfo';

/**
 * @param {string} accessToken token devolvido pelo Google Identity Services
 * @param {string|string[]} clientIdOuLista nossos Client IDs (publicos). Aceita lista
 *   porque ja trocamos de Client ID uma vez e o token pode vir do antigo.
 * @returns {{erro?:string, email?:string, nome?:string}}
 */
export async function verificarTokenGoogle(accessToken, clientIdOuLista) {
  const ids = (Array.isArray(clientIdOuLista) ? clientIdOuLista : [clientIdOuLista])
    .map((x) => String(x || '').trim()).filter(Boolean);
  if (!accessToken || typeof accessToken !== 'string' || accessToken.length > 4096) {
    return { erro: 'token_invalido' };
  }
  if (!ids.length) return { erro: 'client_id_ausente' };

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  let dados;
  try {
    const r = await fetch(`${GOOGLE_TOKENINFO}?access_token=${encodeURIComponent(accessToken)}`,
      { signal: ctrl.signal });
    if (!r.ok) return { erro: 'token_recusado' };
    dados = await r.json();
  } catch {
    return { erro: 'google_indisponivel' };
  } finally {
    clearTimeout(t);
  }

  // o token precisa ter sido emitido para o NOSSO app (aud ou azp)
  const emitidoPara = [String(dados.aud || ''), String(dados.azp || '')];
  if (!emitidoPara.some((x) => ids.includes(x))) return { erro: 'token_de_outro_app' };
  if (dados.email_verified !== true && dados.email_verified !== 'true') return { erro: 'email_nao_verificado' };

  const email = String(dados.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { erro: 'email_invalido' };

  // o tokeninfo de access token nao traz o nome da pessoa; quando falta, busca no userinfo
  // (o scope pedido pelo app inclui profile, entao o endpoint responde)
  let nome = String(dados.name || '').trim();
  if (!nome) {
    try {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 6000);
      const ru = await fetch(GOOGLE_USERINFO, {
        headers: { Authorization: 'Bearer ' + accessToken },
        signal: ctrl2.signal
      });
      if (ru.ok) {
        const u = await ru.json();
        nome = String(u.name || u.given_name || '').trim();
      }
      clearTimeout(t2);
    } catch { /* sem nome do Google: cai no prefixo do e-mail */ }
  }

  return {
    email,
    nome: nome.slice(0, 80) || email.split('@')[0],
    sub: String(dados.sub || '')
  };
}
