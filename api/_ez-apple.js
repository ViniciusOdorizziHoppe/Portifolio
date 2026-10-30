// Login com Apple: o app manda o id_token (JWT) devolvido pelo AppleID JS.
// Verificamos a assinatura RS256 contra as chaves publicas da Apple (JWKS),
// o emissor e a audience (nosso Service ID). Sem biblioteca externa, so node:crypto.
import crypto from 'node:crypto';

const KEYS_URL = 'https://appleid.apple.com/auth/keys';
const EMISSOR = 'https://appleid.apple.com';

function b64url(txt) {
  const s = String(txt).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(s, 'base64');
}

let cacheChaves = { quando: 0, chaves: [] };

async function chavesDaApple() {
  const agora = Date.now();
  if (cacheChaves.chaves.length && agora - cacheChaves.quando < 6 * 60 * 60 * 1000) {
    return cacheChaves.chaves;
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(KEYS_URL, { signal: ctrl.signal });
    if (!r.ok) return cacheChaves.chaves;
    const j = await r.json();
    cacheChaves = { quando: agora, chaves: Array.isArray(j.keys) ? j.keys : [] };
    return cacheChaves.chaves;
  } catch {
    return cacheChaves.chaves;
  } finally {
    clearTimeout(t);
  }
}

/**
 * @param {string} idToken JWT devolvido pelo Sign in with Apple
 * @param {string} clientId nosso Service ID da Apple (ex: com.viniciusodorizzi.enemzeiro)
 * @returns {{erro?:string, email?:string, nome?:string, sub?:string}}
 */
export async function verificarIdTokenApple(idToken, clientId) {
  if (!idToken || typeof idToken !== 'string' || idToken.length > 8192) return { erro: 'token_invalido' };
  if (!clientId) return { erro: 'app_nao_configurado' };

  const partes = idToken.split('.');
  if (partes.length !== 3) return { erro: 'token_invalido' };

  let header, claims;
  try {
    header = JSON.parse(b64url(partes[0]).toString('utf8'));
    claims = JSON.parse(b64url(partes[1]).toString('utf8'));
  } catch {
    return { erro: 'token_invalido' };
  }

  if (header.alg !== 'RS256') return { erro: 'algoritmo_invalido' };
  if (String(claims.iss || '') !== EMISSOR) return { erro: 'emissor_invalido' };
  if (String(claims.aud || '') !== String(clientId)) return { erro: 'token_de_outro_app' };
  if (Number(claims.exp || 0) * 1000 < Date.now() - 60 * 1000) return { erro: 'expirado' };

  const chaves = await chavesDaApple();
  const jwk = chaves.find((k) => k.kid === header.kid);
  if (!jwk) return { erro: 'chave_desconhecida' };

  let confere = false;
  try {
    const publica = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    confere = crypto.verify(
      'RSA-SHA256',
      Buffer.from(`${partes[0]}.${partes[1]}`),
      publica,
      b64url(partes[2])
    );
  } catch {
    return { erro: 'assinatura_invalida' };
  }
  if (!confere) return { erro: 'assinatura_invalida' };

  const email = String(claims.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { erro: 'sem_email' };

  const nome = claims.name
    ? [claims.name.firstName, claims.name.lastName].filter(Boolean).join(' ').trim()
    : '';

  return {
    email,
    nome: String(nome || '').slice(0, 80) || email.split('@')[0],
    sub: String(claims.sub || '')
  };
}
