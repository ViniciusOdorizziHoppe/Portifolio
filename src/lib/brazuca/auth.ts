// ═══════════════════════════════════════════════════════════════
// @brazuca/auth — Validação CPF/CNPJ modo estrito
// Segue arquitetura Brazuca SDK: adapter pattern, strict mode
// ═══════════════════════════════════════════════════════════════

/**
 * Resultado unificado de validação de documento BR.
 * Padronizado como o Brazuca define: um objeto, não um boolean.
 */
export interface DocumentValidation {
  valid: boolean
  type: 'cpf' | 'cnpj'
  formatted: string
  raw: string // apenas dígitos
  error?: string
}

/** CPFs falsos conhecidos que passam no módulo 11 mas são inválidos */
const CPF_BLACKLIST = new Set([
  '00000000000', '11111111111', '22222222222', '33333333333',
  '44444444444', '55555555555', '66666666666', '77777777777',
  '88888888888', '99999999999',
  '12345678909', // muito comum em testes
])

/** CNPJs falsos conhecidos */
const CNPJ_BLACKLIST = new Set([
  '00000000000000', '11111111111111', '22222222222222',
  '33333333333333', '44444444444444', '55555555555555',
  '66666666666666', '77777777777777', '88888888888888',
  '99999999999999',
])

/**
 * Calcula dígito verificador módulo 11.
 * Algoritmo oficial da Receita Federal.
 */
function mod11(digits: number[], factors: number[]): number {
  let sum = 0
  for (let i = 0; i < factors.length; i++) {
    sum += digits[i] * factors[i]
  }
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

/**
 * Valida um CPF no modo estrito:
 * - Remove máscara
 * - Verifica blacklist
 * - Valida dígitos verificadores (módulo 11)
 */
export function validateCPF(cpf: string): DocumentValidation {
  const raw = cpf.replace(/\D/g, '')

  if (raw.length !== 11) {
    return { valid: false, type: 'cpf', formatted: '', raw, error: 'CPF deve ter 11 dígitos' }
  }

  if (CPF_BLACKLIST.has(raw)) {
    return { valid: false, type: 'cpf', formatted: '', raw, error: 'CPF inválido (sequência proibida)' }
  }

  const digits = raw.split('').map(Number)

  // Primeiro dígito verificador
  const dv1 = mod11(digits.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2])
  if (dv1 !== digits[9]) {
    return { valid: false, type: 'cpf', formatted: '', raw, error: 'Dígito verificador 1 inválido' }
  }

  // Segundo dígito verificador
  const dv2 = mod11(digits.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  if (dv2 !== digits[10]) {
    return { valid: false, type: 'cpf', formatted: '', raw, error: 'Dígito verificador 2 inválido' }
  }

  return {
    valid: true,
    type: 'cpf',
    raw,
    formatted: formatCPF(raw),
  }
}

/**
 * Valida um CNPJ no modo estrito.
 */
export function validateCNPJ(cnpj: string): DocumentValidation {
  const raw = cnpj.replace(/\D/g, '')

  if (raw.length !== 14) {
    return { valid: false, type: 'cnpj', formatted: '', raw, error: 'CNPJ deve ter 14 dígitos' }
  }

  if (CNPJ_BLACKLIST.has(raw)) {
    return { valid: false, type: 'cnpj', formatted: '', raw, error: 'CNPJ inválido (sequência proibida)' }
  }

  const digits = raw.split('').map(Number)

  // Primeiro dígito verificador
  const dv1 = mod11(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  if (dv1 !== digits[12]) {
    return { valid: false, type: 'cnpj', formatted: '', raw, error: 'Dígito verificador 1 inválido' }
  }

  // Segundo dígito verificador
  const dv2 = mod11(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  if (dv2 !== digits[13]) {
    return { valid: false, type: 'cnpj', formatted: '', raw, error: 'Dígito verificador 2 inválido' }
  }

  return {
    valid: true,
    type: 'cnpj',
    raw,
    formatted: formatCNPJ(raw),
  }
}

/**
 * Detecta automaticamente se é CPF ou CNPJ e valida.
 */
export function validateDocument(doc: string): DocumentValidation {
  const raw = doc.replace(/\D/g, '')
  if (raw.length === 11) return validateCPF(doc)
  if (raw.length === 14) return validateCNPJ(doc)
  return { valid: false, type: 'cpf', formatted: '', raw, error: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos' }
}

// ── Formatação ──────────────────────────────────────────────

/** Formata CPF: 123.456.789-00 */
export function formatCPF(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length !== 11) return raw
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Formata CNPJ: 12.345.678/0001-90 */
export function formatCNPJ(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length !== 14) return raw
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/** Aplica máscara automática conforme o tamanho */
export function maskDocument(value: string): string {
  const d = value.replace(/\D/g, '')
  if (d.length <= 11) return maskCPF(d)
  return maskCNPJ(d)
}

function maskCPF(d: string): string {
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function maskCNPJ(d: string): string {
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/**
 * Gera um CPF válido aleatório (útil para testes).
 */
export function generateValidCPF(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const dv1 = mod11(base, [10, 9, 8, 7, 6, 5, 4, 3, 2])
  base.push(dv1)
  const dv2 = mod11(base, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  base.push(dv2)
  return base.join('')
}

/**
 * Gera um CNPJ válido aleatório (útil para testes).
 */
export function generateValidCNPJ(): string {
  const base = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10))
  base.push(0, 0, 0, 1) // filial 0001
  const dv1 = mod11(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  base.push(dv1)
  const dv2 = mod11(base, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  base.push(dv2)
  return base.join('')
}
