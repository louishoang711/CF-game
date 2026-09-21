import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { eventConfig, pickWeightedReward, type Reward } from './eventConfig'

type Screen = 'booth' | 'reward'

function PortraitArtwork({ src, label }: { src: string; label: string }) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => setImageFailed(false), [src])

  return src && !imageFailed ? (
    <img className="portrait-image" src={src} alt={label} onError={() => setImageFailed(true)} />
  ) : (
    <div className="portrait-placeholder">
      <span className="artwork-corner">{eventConfig.brand.name.toUpperCase()} · {eventConfig.brand.year}</span>
      <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <circle cx="9" cy="8" r="2" />
        <path d="m4 18 5-5 3 3 4-6 4 6" />
      </svg>
      <span className="artwork-ratio">{eventConfig.copy.artworkRatio}</span>
      <span className="artwork-label">{label}</span>
    </div>
  )
}

function BrandLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <img src={eventConfig.brand.logo} className={`brand-logo brand-logo--${size}`} alt={eventConfig.brand.name} />
}

interface Flake {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  rotation: number
  rotSpeed: number
  opacity: number
}

function ScratchCard({ reward, onComplete }: { reward: Reward; onComplete: () => void }) {
  const scratchRef = useRef<HTMLCanvasElement>(null)
  const particleRef = useRef<HTMLCanvasElement>(null)
  const [scratched, setScratched] = useState(false)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const flakes = useRef<Flake[]>([])
  const rafRef = useRef(0)
  const finished = useRef(false)
  const completeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const checkedAt = useRef(0)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    drawing.current = false
    setScratched(true)
    completeTimer.current = setTimeout(onComplete, eventConfig.timing.scratchRevealMs)
  }

  useEffect(() => () => clearTimeout(completeTimer.current), [])

  useEffect(() => {
    const canvas = scratchRef.current
    if (!canvas) return

    const rect = { width: 360, height: 480 }
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.scale(ratio, ratio)

    const gradient = ctx.createLinearGradient(0, 0, 360, 480)
    gradient.addColorStop(0, eventConfig.theme.primaryDark)
    gradient.addColorStop(0.24, eventConfig.theme.primary)
    gradient.addColorStop(0.46, eventConfig.theme.primary)
    gradient.addColorStop(0.52, eventConfig.theme.scratchHighlight)
    gradient.addColorStop(0.6, eventConfig.theme.primary)
    gradient.addColorStop(0.82, eventConfig.theme.primaryDark)
    gradient.addColorStop(1, eventConfig.theme.primaryDark)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, rect.width, rect.height)

    for (let i = 0; i < 15000; i += 1) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.10)' : 'rgba(65,0,14,.06)'
      ctx.fillRect(Math.random() * 360, Math.random() * 480, 0.7, 0.7)
    }

    ctx.lineWidth = 0.6
    for (let i = 0; i < 12; i += 1) {
      ctx.strokeStyle = 'rgba(255,235,239,.13)'
      ctx.beginPath()
      ctx.ellipse(180, 240, 90 + i * 12, 120 + i * 16, -0.35, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(255,255,255,.5)'
    ctx.strokeRect(14, 14, 332, 452)
    ctx.globalCompositeOperation = 'destination-out'

    const logo = new Image()
    logo.src = eventConfig.brand.scratchLogo
    logo.onload = () => {
      const offscreen = document.createElement('canvas')
      offscreen.width = logo.naturalWidth
      offscreen.height = logo.naturalHeight
      const logoContext = offscreen.getContext('2d')
      if (!logoContext) return
      logoContext.drawImage(logo, 0, 0)
      const logoPixels = logoContext.getImageData(0, 0, offscreen.width, offscreen.height)

      for (let i = 0; i < logoPixels.data.length; i += 4) {
        const red = logoPixels.data[i]
        const green = logoPixels.data[i + 1]
        const blue = logoPixels.data[i + 2]
        const sourceAlpha = logoPixels.data[i + 3] / 255
        const ink = (255 - Math.min(red, green, blue)) / 255
        logoPixels.data[i] = 255
        logoPixels.data[i + 1] = 255
        logoPixels.data[i + 2] = 255
        logoPixels.data[i + 3] = Math.round(Math.pow(ink, 1.35) * 58 * sourceAlpha)
      }

      logoContext.putImageData(logoPixels, 0, 0)
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 0.7
      ctx.filter = 'blur(1px)'
      ctx.drawImage(offscreen, 65, 160, 230, 175)
      ctx.restore()
      ctx.globalCompositeOperation = 'destination-out'
    }
  }, [])

  useEffect(() => {
    const canvas = particleRef.current
    if (!canvas) return
    const width = 360
    const height = 480
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * ratio
    canvas.height = height * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)

    const loop = () => {
      ctx.clearRect(0, 0, width, height)
      flakes.current = flakes.current.filter(flake => flake.opacity > 0.02 && flake.y < height + 24)
      for (const flake of flakes.current) {
        flake.vy += 0.16
        flake.vx *= 0.985
        flake.x += flake.vx
        flake.y += flake.vy
        flake.rotation += flake.rotSpeed
        flake.opacity -= 0.022
        ctx.save()
        ctx.globalAlpha = Math.max(0, flake.opacity)
        ctx.translate(flake.x, flake.y)
        ctx.rotate(flake.rotation)
        ctx.fillStyle = flake.w > 5 ? eventConfig.theme.scratchHighlight : '#ffe0b6'
        ctx.beginPath()
        ctx.moveTo(-flake.w / 2, -flake.h / 2)
        ctx.lineTo(flake.w / 2, -flake.h / 3)
        ctx.lineTo(flake.w / 3, flake.h / 2)
        ctx.lineTo(-flake.w / 2, flake.h / 4)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    loop()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const spawnFlakes = (x: number, y: number) => {
    if (flakes.current.length > 100) return
    for (let i = 0; i < 5; i += 1) {
      flakes.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * -3.5 - 1,
        w: Math.random() * 7 + 2,
        h: Math.random() * 3 + 1,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.18,
        opacity: 0.88 + Math.random() * 0.12,
      })
    }
  }

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) * 360) / rect.width,
      y: ((event.clientY - rect.top) * 480) / rect.height,
    }
  }

  const scratch = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || finished.current) return
    const canvas = scratchRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const current = point(event)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = eventConfig.scratch.brushSize
    ctx.shadowColor = 'rgba(0,0,0,.65)'
    ctx.shadowBlur = 4
    ctx.beginPath()
    ctx.moveTo(last.current?.x ?? current.x, last.current?.y ?? current.y)
    ctx.lineTo(current.x, current.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(current.x, current.y, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    last.current = current
    spawnFlakes(current.x, current.y)

    if (performance.now() - checkedAt.current < 100) return
    checkedAt.current = performance.now()
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let clear = 0
    for (let i = 3; i < pixels.length; i += 40) {
      if (pixels[i] < 40) clear += 1
    }
    if ((clear / (pixels.length / 40)) * 100 > eventConfig.scratch.completionPercent) finish()
  }

  const stopDrawing = () => {
    drawing.current = false
    last.current = null
  }

  return (
    <div className={`scratch-card ${scratched ? 'is-scratched' : ''}`}>
      <PortraitArtwork src={reward.image} label={reward.name} />
      <canvas
        ref={scratchRef}
        className="scratch-canvas"
        role="button"
        tabIndex={0}
        aria-label={eventConfig.copy.scratchAriaLabel}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            finish()
          }
        }}
        onPointerDown={event => {
          drawing.current = true
          last.current = point(event)
          event.currentTarget.setPointerCapture(event.pointerId)
          scratch(event)
        }}
        onPointerMove={scratch}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
        onLostPointerCapture={stopDrawing}
      />
      <canvas ref={particleRef} className="particle-canvas" aria-hidden="true" />
      {scratched && <div className="reveal-glow" aria-hidden="true" />}
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('booth')
  const [reward, setReward] = useState<Reward | null>(null)
  const [isStamping, setIsStamping] = useState(false)
  const [isRewarded, setIsRewarded] = useState(false)
  const stampTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(stampTimer.current), [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [screen, isRewarded])

  const handleStamp = () => {
    if (isStamping) return
    setReward(pickWeightedReward())
    setIsRewarded(false)
    setIsStamping(true)
    stampTimer.current = setTimeout(() => {
      setIsStamping(false)
      setScreen('reward')
    }, eventConfig.timing.stampTransitionMs)
  }

  const goHome = () => {
    clearTimeout(stampTimer.current)
    setScreen('booth')
    setReward(null)
    setIsRewarded(false)
    setIsStamping(false)
  }

  return (
    <main
      className="app-shell"
      style={{
        '--red': eventConfig.theme.primary,
        '--seal': eventConfig.theme.seal,
        '--ink': eventConfig.theme.ink,
        '--white': eventConfig.theme.background,
        '--muted': eventConfig.theme.muted,
        '--border': eventConfig.theme.border,
      } as CSSProperties}
    >
      {screen === 'booth' && (
        <section className="screen booth-screen">
          <div className="screen-header with-back">
            <button className="btn-back" type="button" onClick={goHome} aria-label={eventConfig.copy.backHome}>←</button>
            <BrandLogo size="md" />
          </div>
          <p className="section-kicker">{eventConfig.copy.boothName} · {eventConfig.copy.boothKicker}</p>
          <div
            className={`stamp-card-zone${isStamping ? ' is-stamping' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={eventConfig.copy.boothKicker}
            onClick={handleStamp}
            onKeyDown={event => {
              if ((event.key === 'Enter' || event.key === ' ') && !isStamping) {
                event.preventDefault()
                handleStamp()
              }
            }}
          >
            <PortraitArtwork src={eventConfig.stamp.image} label={eventConfig.copy.boothName} />
            {isStamping && (
              <div className="seal-overlay" aria-hidden="true">
                <div className="seal-impact" />
                <div className="seal-drop">
                  <div className="seal-rect">
                    <span>{eventConfig.copy.stampEventLine}</span>
                    <img src={eventConfig.brand.logo} className="seal-logo" alt="" />
                    <strong>{eventConfig.copy.stampBooth}</strong>
                    <span className="seal-bottom">{eventConfig.copy.stampValidated}</span>
                  </div>
                  <div className="seal-pulse" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {screen === 'reward' && reward && (
        <section className="screen reward-screen">
          <div className="screen-header with-back">
            <button className="btn-back" type="button" onClick={goHome} aria-label={eventConfig.copy.backHome}>←</button>
          </div>

          {isRewarded ? (
            <div className="reward-revealed">
              <div className="reward-pill-header">{eventConfig.copy.yourReward}</div>
              <h2 className="revealed-name-top">{reward.name}</h2>
              <div className="revealed-card">
                <PortraitArtwork src={reward.image} label={reward.name} />
              </div>
              <button className="primary-btn pill home-btn-big" type="button" onClick={goHome}>
                {eventConfig.copy.backHome} <span>→</span>
              </button>
            </div>
          ) : (
            <>
              <div className="reward-pill-header">{eventConfig.copy.openReward}</div>
              <div className="scratch-center">
                <ScratchCard key={reward.id} reward={reward} onComplete={() => setIsRewarded(true)} />
              </div>
            </>
          )}
        </section>
      )}
    </main>
  )
}
