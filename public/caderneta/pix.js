/* gerador de BR Code PIX (EMV) — sem dependencia externa */
(function (global) {
  'use strict';

  // CRC16/CCITT-FALSE: poly 0x1021, init 0xFFFF, sem reflexao, sem xor final
  function crc16(payload) {
    var crc = 0xFFFF;
    for (var i = 0; i < payload.length; i++) {
      crc ^= (payload.charCodeAt(i) & 0xFF) << 8;
      for (var j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (((crc << 1) ^ 0x1021) & 0xFFFF) : ((crc << 1) & 0xFFFF);
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function semAcento(txt) {
    return String(txt == null ? '' : txt)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function nome(valor, max) {
    return semAcento(valor).toUpperCase().slice(0, max);
  }

  // id + tamanho (2 digitos) + valor
  function campo(id, valor) {
    var v = String(valor == null ? '' : valor);
    if (v.length > 99) v = v.slice(0, 99);
    return id + String(v.length).padStart(2, '0') + v;
  }

  // normaliza a chave conforme o tipo; devolve a chave pronta pro payload
  function normalizaChave(chave) {
    var c = String(chave || '').trim();
    if (!c) return '';
    var soDigitos = c.replace(/\D/g, '');
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(c)) return c.toLowerCase();          // e-mail
    if (c.indexOf('+') === 0 || soDigitos.length >= 12 && soDigitos.length <= 13) {
      return '+' + soDigitos;                                                   // celular
    }
    if (soDigitos.length === 11 || soDigitos.length === 14) return soDigitos;   // CPF/CNPJ
    if (/^[0-9a-f-]{32,36}$/i.test(c)) return c.replace(/-/g, '').toLowerCase(); // chave aleatoria
    return c;
  }

  function valorStr(valor) {
    var n = Number(valor);
    if (!isFinite(n) || n <= 0) return '';
    return n.toFixed(2);
  }

  function txidStr(txid) {
    var t = String(txid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25);
    return t || '***';
  }

  /**
   * Monta o BR Code estatico do PIX.
   * opcoes: { chave, nome, cidade, valor, txid, descricao }
   */
  function brcode(opcoes) {
    var o = opcoes || {};
    var chave = normalizaChave(o.chave);
    if (!chave) throw new Error('Chave PIX obrigatoria');

    var merchant = campo('00', 'br.gov.bcb.pix') + campo('01', chave);

    var payload =
      campo('00', '01') +
      campo('26', merchant) +
      campo('52', '0000') +
      campo('53', '986') +
      (valorStr(o.valor) ? campo('54', valorStr(o.valor)) : '') +
      campo('58', 'BR') +
      campo('59', nome(o.nome || 'RECEBEDOR', 25)) +
      campo('60', nome(o.cidade || 'BRASIL', 15)) +
      campo('62', campo('05', txidStr(o.txid))) +
      '6304';

    return payload + crc16(payload);
  }

  // le de volta o payload (usado nos testes e na validacao da tela de ajustes)
  function ler(payload) {
    var out = {};
    var i = 0;
    while (i < payload.length) {
      var id = payload.substr(i, 2);
      var len = parseInt(payload.substr(i + 2, 2), 10);
      if (isNaN(len)) break;
      out[id] = payload.substr(i + 4, len);
      i += 4 + len;
      if (id === '63') break;
    }
    return out;
  }

  function valido(payload) {
    if (typeof payload !== 'string' || payload.length < 20) return false;
    if (payload.slice(-8, -4) !== '6304') return false;
    var corpo = payload.slice(0, -4);
    return crc16(corpo) === payload.slice(-4).toUpperCase();
  }

  global.Pix = { brcode: brcode, crc16: crc16, ler: ler, valido: valido, normalizaChave: normalizaChave };
})(typeof window !== 'undefined' ? window : globalThis);
