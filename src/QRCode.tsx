import { useEffect, useRef, useState } from 'react'
import QRCodeLib from 'qrcode'

interface Props {
  size?: number
}

export default function QRCode({ size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [url, setUrl] = useState('')

  useEffect(() => {
    // Pega o IP da rede (network URL) se disponível, senão usa localhost
    const host = window.location.hostname
    const port = window.location.port
    const networkUrl = `http://${host}${port ? ':' + port : ''}/`
    setUrl(networkUrl)

    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, networkUrl, {
        width: size,
        margin: 1,
        color: { dark: '#F5C518', light: '#09090b' },
      })
    }
  }, [size])

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded-xl" />
      <span className="font-mono text-[10px] text-[--color-text-tertiary]">
        {url || 'carregando...'}
      </span>
    </div>
  )
}
