import { useEffect, useRef, useState } from 'react'

/**
 * Site-scroll scrub: o scroll da página avança o vídeo frame a frame.
 *
 * 600vh de altura total → 466 frames (15,5s a 30fps) → ~1,3vh de scroll por
 * frame. O seek é suavizado por lerp (0.2) dentro do rAF, então o dedo não
 * precisa sincronizar com o vídeo: o vídeo alcança o scroll.
 */
const SCROLL_HEIGHT = '600vh'
const LERP = 0.2

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef(0) // 0..1 — alvo vindo do scroll
  const rafRef = useRef(0)
  const [hint, setHint] = useState(true)
  const [pct, setPct] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onMq = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onMq)

    const video = videoRef.current
    if (!video) return

    let lastPct = -1

    // Loop de suavização: persegue o alvo do scroll com lerp
    const loop = () => {
      if (!reduced && video.readyState >= 2 && video.duration > 0) {
        const target = progressRef.current * video.duration
        const delta = target - video.currentTime
        if (Math.abs(delta) > 0.001) {
          video.currentTime += delta * LERP
        } else {
          video.currentTime = target
        }
      }
      const p = Math.round(progressRef.current * 100)
      if (p !== lastPct) {
        lastPct = p
        setPct(p)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      progressRef.current =
        max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      setHint(window.scrollY < 60)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      mq.removeEventListener('change', onMq)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [reduced])

  return (
    <div
      className="scrub"
      style={{ height: reduced ? '100vh' : SCROLL_HEIGHT }}
    >
      <video
        ref={videoRef}
        className="scrub-video"
        src="/scrub.mp4"
        poster="/poster.jpg"
        preload="auto"
        muted
        playsInline
        aria-label="Animação controlada pelo scroll"
      />

      {/* Overlay fixo: marca + progresso. pointer-events-none para não
          atrapalhar o scroll. */}
      <header className="overlay" aria-hidden>
        <span className="brand">
          Vinícius <em>Odorizzi</em>
        </span>
        <span className="counter">{String(pct).padStart(3, '0')}%</span>
      </header>

      {!reduced && (
        <div className={`hint ${hint ? 'show' : 'hide'}`} aria-hidden>
          <span>Role para explorar</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      )}
    </div>
  )
}
