import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import QRCodeLib from 'qrcode'
import { generatePixString } from './lib/brazuca/billing'
import './index.css'

function QRCodePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pixString, setPixString] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const pix = generatePixString({
      pixKey: '554797615032',
      keyType: 'phone',
      merchantName: 'Vinícius Odorizzi',
      merchantCity: 'PRESIDENTE GETULIO',
      description: 'Portfolio',
    })

    setPixString(pix)

    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, pix, {
        width: 280,
        margin: 2,
        color: { dark: '#F5C518', light: '#09090b' },
      })
    }
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(pixString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-6">
      {/* Card */}
      <div
        className="flex flex-col items-center gap-6 rounded-2xl p-10"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Title */}
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold tracking-tight text-white">
            Vinícius <span style={{ color: '#F5C518' }}>Odorizzi</span>
          </h1>
          <p className="mt-1 font-mono text-xs text-[rgba(255,255,255,0.35)]">
            escaneie o QR code do PIX
          </p>
        </div>

        {/* PIX logo */}
        <div className="flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.05)] px-4 py-1.5">
          <span className="font-mono text-[10px] font-bold tracking-widest text-[#32BCAD]">
            PIX
          </span>
          <span className="font-mono text-[10px] text-[rgba(255,255,255,0.35)]">
            valor livre
          </span>
        </div>

        {/* QR Code */}
        <canvas
          ref={canvasRef}
          className="rounded-xl"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Copia-Cola */}
        <div className="flex w-full max-w-sm items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-[rgba(255,255,255,0.05)] px-4 py-2.5 font-mono text-[10px] text-[rgba(255,255,255,0.45)]">
            Copia-Cola
          </code>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg px-4 py-2.5 font-mono text-xs font-medium transition-all"
            style={{
              background: copied
                ? 'rgba(34,197,94,0.15)'
                : 'rgba(255,255,255,0.06)',
              color: copied ? '#22c55e' : 'rgba(255,255,255,0.55)',
              border: `1px solid ${
                copied
                  ? 'rgba(34,197,94,0.3)'
                  : 'rgba(255,255,255,0.08)'
              }`,
            }}
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 font-mono text-[10px] text-[rgba(255,255,255,0.18)]">
        PIX · Vinícius Odorizzi · 2026
      </p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<QRCodePage />)
