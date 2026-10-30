// Login com Google: o app manda o access token que o Google entregou ao navegador
// e aqui confirmamos com o proprio Google que o token é valido E que foi emitido
// para o nosso Client ID (aud). Sem client secret, sem confiar no que o cliente diz.
const GOOGLE_TOKENINFO = 'https://oauth2.googleapis.com/tokeninfo';

/**
 * @param {string} accessToken token devolvido pelo Google Identity Services
 * @param {string} clientId nosso Client ID (publico)
 * @returns {{erro?:string, email?:string, nome?:string}}
 */
export async function verificarTokenGoogle(accessToken, clientId) {
  if (!accessToken || typeof accessToken !== 'string' || accessToken.length > 4096) {
    return { erro: 'token_invalido' };
  }
  if (!clientId) return { erro: 'client_id_ausente' };

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

  // o token precisa ter sido emitido para o NOSSO app
  if (String(dados.aud || '') !== String(clientId)) return { erro: 'token_de_outro_app' };
  if (dados.email_verified !== true && dados.email_verified !== 'true') return { erro: 'email_nao_verificado' };

  const email = String(dados.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { erro: 'email_invalido' };

  return {
    email,
    nome: String(dados.name || '').trim().slice(0, 80) || email.split('@')[0],
    sub: String(dados.sub || '')
  };
}
