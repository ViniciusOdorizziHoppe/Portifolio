// Login com Facebook: o app manda o access token que o SDK entregou no navegador.
// Confirmamos com o proprio Facebook (debug_token) que o token e valido E que foi
// emitido para o NOSSO app, e so depois pedimos o perfil. Nada de confiar no cliente.
const GRAPH = 'https://graph.facebook.com/v21.0';

async function buscar(url, ms = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) return { erro: 'http_' + r.status };
    return { dados: await r.json() };
  } catch {
    return { erro: 'rede' };
  } finally {
    clearTimeout(t);
  }
}

/**
 * @param {string} accessToken token devolvido pelo SDK do Facebook
 * @param {string} appId App ID do nosso app Meta (publico)
 * @param {string} appSecret App Secret (so no servidor)
 * @returns {{erro?:string, email?:string, nome?:string, sub?:string}}
 */
export async function verificarTokenFacebook(accessToken, appId, appSecret) {
  if (!accessToken || typeof accessToken !== 'string' || accessToken.length > 4096) {
    return { erro: 'token_invalido' };
  }
  if (!appId || !appSecret) return { erro: 'app_nao_configurado' };

  const tokenApp = `${appId}|${appSecret}`;
  const dbg = await buscar(
    `${GRAPH}/debug_token?input_token=${encodeURIComponent(accessToken)}` +
    `&access_token=${encodeURIComponent(tokenApp)}`
  );
  if (dbg.erro) return { erro: dbg.erro === 'rede' ? 'facebook_indisponivel' : 'token_recusado' };

  const info = (dbg.dados && dbg.dados.data) || {};
  if (info.is_valid !== true) return { erro: 'token_invalido' };
  if (String(info.app_id || '') !== String(appId)) return { erro: 'token_de_outro_app' };

  const perfil = await buscar(
    `${GRAPH}/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`
  );
  if (perfil.erro) return { erro: 'perfil_indisponivel' };

  const dados = perfil.dados || {};
  const email = String(dados.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { erro: 'sem_email' };

  return {
    email,
    nome: String(dados.name || '').trim().slice(0, 80) || email.split('@')[0],
    sub: String(dados.id || info.user_id || '')
  };
}
