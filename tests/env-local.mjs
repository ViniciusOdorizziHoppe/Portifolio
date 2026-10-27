// Lê .env.local (gravado por `neon deploy`) sem dependência externa.
import { readFileSync, existsSync } from 'node:fs';

export function carregarEnvLocal(caminho = new URL('../.env.local', import.meta.url)) {
  const arquivo = caminho instanceof URL ? caminho : new URL(caminho);
  if (!existsSync(arquivo)) return 0;
  const texto = readFileSync(arquivo, 'utf8');
  let n = 0;
  for (const linha of texto.split(/\r?\n/)) {
    const l = linha.trim();
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i < 1) continue;
    const chave = l.slice(0, i).trim();
    let valor = l.slice(i + 1).trim();
    if (valor.startsWith('"') && valor.endsWith('"')) valor = valor.slice(1, -1);
    if (!process.env[chave]) { process.env[chave] = valor; n++; }
  }
  return n;
}
