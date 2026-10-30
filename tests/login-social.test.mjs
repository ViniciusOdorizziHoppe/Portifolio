// Teste local dos verificadores de token (sem rede de terceiros quando possivel).
import { verificarTokenFacebook } from '../api/_ez-facebook.js';
import { verificarIdTokenApple } from '../api/_ez-apple.js';
import * as rotas from '../api/_ez-rotas.js';

const linhas = [];
const ok = (nome, cond, extra) => linhas.push((cond ? 'PASS ' : 'FALHA ') + nome + (extra ? ' :: ' + extra : ''));

// --- Facebook
const fbSemApp = await verificarTokenFacebook('abc', '', '');
ok('facebook sem App ID responde app_nao_configurado', fbSemApp.erro === 'app_nao_configurado', JSON.stringify(fbSemApp));

const fbTokenVazio = await verificarTokenFacebook('', '123', 'segredo');
ok('facebook sem token responde token_invalido', fbTokenVazio.erro === 'token_invalido', JSON.stringify(fbTokenVazio));

const fbFake = await verificarTokenFacebook('EAAGtokenFalso123', '123456', 'segredo_falso');
ok('facebook com token falso nao autentica', !!fbFake.erro, JSON.stringify(fbFake));

// --- Apple
const apSemId = await verificarIdTokenApple('a.b.c', '');
ok('apple sem Service ID responde app_nao_configurado', apSemId.erro === 'app_nao_configurado', JSON.stringify(apSemId));

const apLixo = await verificarIdTokenApple('nao-e-um-jwt', 'com.teste.enemzeiro');
ok('apple com lixo responde token_invalido', apLixo.erro === 'token_invalido', JSON.stringify(apLixo));

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwtFalso = b64({ alg: 'none' }) + '.' + b64({ iss: 'https://appleid.apple.com', aud: 'com.teste.enemzeiro', exp: Math.floor(Date.now() / 1000) + 600 }) + '.AAAA';
const apAlg = await verificarIdTokenApple(jwtFalso, 'com.teste.enemzeiro');
ok('apple recusa alg diferente de RS256', apAlg.erro === 'algoritmo_invalido', JSON.stringify(apAlg));

const jwtEmissor = b64({ alg: 'RS256', kid: 'x' }) + '.' + b64({ iss: 'https://falso.com', aud: 'com.teste.enemzeiro', exp: Math.floor(Date.now() / 1000) + 600 }) + '.AAAA';
const apIss = await verificarIdTokenApple(jwtEmissor, 'com.teste.enemzeiro');
ok('apple recusa emissor errado', apIss.erro === 'emissor_invalido', JSON.stringify(apIss));

const jwtAud = b64({ alg: 'RS256', kid: 'x' }) + '.' + b64({ iss: 'https://appleid.apple.com', aud: 'outro.app', exp: Math.floor(Date.now() / 1000) + 600 }) + '.AAAA';
const apAud = await verificarIdTokenApple(jwtAud, 'com.teste.enemzeiro');
ok('apple recusa audience de outro app', apAud.erro === 'token_de_outro_app', JSON.stringify(apAud));

// --- rotas exportadas
ok('rota facebook exportada', typeof rotas.facebook === 'function');
ok('rota apple exportada', typeof rotas.apple === 'function');
ok('rota google continua existindo', typeof rotas.google === 'function');

console.log(linhas.join('\n'));
const falhas = linhas.filter((l) => l.startsWith('FALHA')).length;
console.log('\nresumo:', linhas.length - falhas, 'ok,', falhas, 'falhas');
process.exit(falhas ? 1 : 0);
