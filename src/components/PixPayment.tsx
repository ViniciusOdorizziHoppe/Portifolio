// ═══════════════════════════════════════════════════════════════
// @brazuca/ui — PixPayment component
// Drop-in: jogue em qualquer SaaS e aceite PIX em 1 minuto
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react'
import { generatePix } from '../lib/brazuca/billing'
import type { PixStaticData } from '../lib/brazuca/billing'

interface PixPaymentProps {
  /** Chave PIX do recebedor */
  pixKey: string
  /** Tipo da chave */
  keyType: PixStaticData['keyType']
  /** Nome do recebedor */
  merchantName: string
  /** Cidade do recebedor */
  merchantCity: string
  /** Valor em reais */
  amount: number
  /** Descrição do pagamento (aparece no app do banco) */
  description?: string
  /** Callback quando o usuário clica "Já paguei" */
  onPaid?: (txid: string) => void
  /** Override do TXID */
  txid?: string
  /** Tema: 'dark' | 'light' */
  theme?: 'dark' | 'light'
}

/**
 * Componente de pagamento PIX — copia e cola + QR code.
 *
 * Drop-in: `<PixPayment pixKey="..." amount={99.90} onPaid={...} />`
 */
export function PixPayment({
  pixKey,
  keyType,
  merchantName,
  merchantCity,
  amount,
  description,
  onPaid,
  txid,
  theme = 'dark',
}: PixPaymentProps) {
  const [pix, setPix] = useState<ReturnType<typeof generatePix> | null>(null)
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    setPix(
      generatePix({
        pixKey,
        keyType,
        merchantName,
        merchantCity,
        amount,
        txid,
        description,
      })
    )
  }, [pixKey, keyType, merchantName, merchantCity, amount, txid, description])

  const handleCopy = useCallback(async () => {
    if (!pix) return
    try {
      await navigator.clipboard.writeText(pix.copyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback: seleciona texto
      const el = document.createElement('textarea')
      el.value = pix.copyPaste
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }, [pix])

  const handlePaid = useCallback(() => {
    if (!pix) return
    setChecking(true)
    onPaid?.(pix.txid)
  }, [pix, onPaid])

  if (!pix) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-[--color-accent] border-t-transparent rounded-full" />
      </div>
    )
  }

  const isDark = theme === 'dark'

  return (
    <div
      className={`rounded-2xl p-6 w-full max-w-sm mx-auto ${
        isDark
          ? 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[--color-text]'
          : 'bg-white border border-gray-200 text-gray-900'
      }`}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold">Pagar com PIX</h3>
        <p className={`text-sm ${isDark ? 'text-[--color-text-secondary]' : 'text-gray-500'}`}>
          {description || 'Escaneie o QR Code ou copie o código'}
        </p>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-xl p-3 mb-4 flex items-center justify-center">
        <img
          src={pix.qrCode}
          alt="QR Code PIX"
          className="w-52 h-52"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Amount */}
      <div className="text-center mb-4">
        <span className="text-3xl font-black">
          R$ {amount.toFixed(2).replace('.', ',')}
        </span>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
          copied
            ? 'bg-green-500 text-white'
            : isDark
              ? 'bg-[#F5C518] text-[#09090b] hover:bg-[#e0b010] active:scale-[0.98]'
              : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]'
        }`}
      >
        {copied ? '✅ Copiado!' : '📋 Copiar PIX Copia e Cola'}
      </button>

      {/* I already paid button */}
      {onPaid && (
        <button
          onClick={handlePaid}
          disabled={checking}
          className={`w-full mt-3 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
            checking
              ? 'bg-transparent text-[--color-text-tertiary] cursor-wait'
              : isDark
                ? 'bg-transparent border border-[rgba(255,255,255,0.1)] text-[--color-text-secondary] hover:text-[--color-text] hover:border-[rgba(255,255,255,0.2)]'
                : 'bg-transparent border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
          }`}
        >
          {checking ? 'Verificando pagamento...' : '✅ Já paguei'}
        </button>
      )}

      {/* Info */}
      <p className={`text-center text-[10px] mt-4 ${isDark ? 'text-[--color-text-tertiary]' : 'text-gray-400'}`}>
        {merchantName} · {merchantCity}
      </p>
    </div>
  )
}

/**
 * Versão simplificada: apenas o botão "Pagar com PIX" que abre modal.
 * Ideal para páginas de checkout.
 */
interface PixButtonProps extends PixPaymentProps {
  /** Texto do botão */
  label?: string
}

export function PixButton({ label = 'Pagar com PIX', ...props }: PixButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#F5C518] text-[#09090b] py-3 px-6 rounded-xl font-bold text-sm hover:bg-[#e0b010] active:scale-[0.98] transition-all"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="animate-in zoom-in-95 fade-in duration-200">
            <PixPayment
              {...props}
              onPaid={(txid) => {
                props.onPaid?.(txid)
                setOpen(false)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
