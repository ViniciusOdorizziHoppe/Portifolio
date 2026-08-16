// ═══════════════════════════════════════════════════════════════
// @brazuca/sdk — Brazuca SDK barrel
// Módulos brasileiros para desenvolvimento SaaS
// ═══════════════════════════════════════════════════════════════

// Auth
export {
  validateCPF,
  validateCNPJ,
  validateDocument,
  formatCPF,
  formatCNPJ,
  maskDocument,
  generateValidCPF,
  generateValidCNPJ,
} from './auth'
export type { DocumentValidation } from './auth'

// Billing
export {
  generatePix,
  generatePixString,
  generatePixAsync,
  validatePixKey,
  detectKeyType,
} from './billing'
export type { PixKeyType, PixStaticData, PixResponse } from './billing'
