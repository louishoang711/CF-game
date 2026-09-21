import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { eventConfig, type Reward } from './eventConfig'

type Screen = 'stamp' | 'stamped' | 'reward'

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

interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotSpeed: number
  opacity: number
}

function BrandLogo() {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return <div className="brand-logo-fallback">CFL</div>
  }

  return (
    <img
      className="brand-logo"
      src={eventConfig.brand.logo}
      alt={eventConfig.brand.name}
      onError={() => setHasError(true)}
    />
  )
}

function PortraitArtwork({ src, label, isStamp = false }: { src: string; label: string; isStamp?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [src])

  return imageFailed ? (
    <div className="portrait-placeholder" role="img" aria-label={label}>
      <span className="placeholder-label">{label}</span>
      <span className="placeholder-sub">CrossFire Legend</span>
    </div>
  ) : (
    <img
      className={`portrait-image${isStamp ? ' stamp-impact-img' : ''}`}
      src={src}
      alt={label}
      onError={() => setImageFailed(true)}
      loading="eager"
    />
  )
}

function ScratchCard({
  reward,
  onComplete,
}: {
  reward: Reward
  onComplete: () => void
}) {
  const scratchRef = useRef<HTMLCanvasElement>(null)
  const particleRef = useRef<HTMLCanvasElement>(null)
  const [scratched, setScratched] = useState(false)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const flakes = useRef<Flake[]>([])
  const rafRef = useRef<number>(0)
  const finished = useRef(false)
  const completeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const checkedAt = useRef(0)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    drawing.current = false
    setScratched(true)
    completeTimer.current = setTimeout(onComplete, 700)
  }

  useEffect(() => () => clearTimeout(completeTimer.current), [])

  useEffect(() => {
    const canvas = scratchRef.current
    if (!canvas) return

    const rect = { width: 360, height: 480 }
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.scale(ratio, ratio)

    // Foil gradient with CrossFire Legend palette
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

    // Fine foil grain texture
    for (let i = 0; i < 14000; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.12)' : 'rgba(70,10,0,.08)'
      ctx.fillRect(Math.random() * 360, Math.random() * 480, 0.75, 0.75)
    }

    // Concentric metallic decorative rings
    ctx.lineWidth = 0.6
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = 'rgba(255,235,220,.14)'
      ctx.beginPath()
      ctx.ellipse(180, 240, 90 + i * 12, 120 + i * 16, -0.35, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Border inner frame
    ctx.strokeStyle = 'rgba(255,255,255,.45)'
    ctx.lineWidth = 1.2
    ctx.strokeRect(14, 14, 332, 452)

    // Stamp text line on scratch foil
    ctx.fillStyle = 'rgba(255,255,255,.35)'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('CROSSFIRE LEGEND • SPECIAL EVENT', 180, 44)

    // Process and draw the Watermark Logo
    const logo = new Image()
    logo.src = eventConfig.brand.scratchLogo
    logo.onload = () => {
      const offscreen = document.createElement('canvas')
      offscreen.width = logo.naturalWidth
      offscreen.height = logo.naturalHeight
      const logoContext = offscreen.getContext('2d')!
      logoContext.drawImage(logo, 0, 0)
      const logoPixels = logoContext.getImageData(0, 0, offscreen.width, offscreen.height)

      // Turn logo into translucent white watermark
      for (let i = 0; i < logoPixels.data.length; i += 4) {
        const red = logoPixels.data[i]
        const green = logoPixels.data[i + 1]
        const blue = logoPixels.data[i + 2]
        const sourceAlpha = logoPixels.data[i + 3] / 255
        const ink = (255 - Math.min(red, green, blue)) / 255
        logoPixels.data[i] = 255
        logoPixels.data[i + 1] = 255
        logoPixels.data[i + 2] = 255
        logoPixels.data[i + 3] = Math.round(Math.pow(ink, 1.35) * 65 * sourceAlpha)
      }

      logoContext.putImageData(logoPixels, 0, 0)
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 0.82
      ctx.drawImage(offscreen, 65, 155, 230, 170)
      ctx.restore()
      ctx.globalCompositeOperation = 'destination-out'
    }

    ctx.globalCompositeOperation = 'destination-out'
  }, [])

  useEffect(() => {
    const canvas = particleRef.current
    if (!canvas) return
    let w = 0
    let h = 0
    const ratio = Math.min(window.devicePixelRatio || 1, 2)

    const setup = () => {
      const r = { width: 360, height: 480 }
      canvas.width = r.width * ratio
      canvas.height = r.height * ratio
      w = r.width
      h = r.height
      canvas.getContext('2d')!.scale(ratio, ratio)
    }
    setup()

    const loop = () => {
      const ctx = canvas.getContext('2d')!
      if (w > 0) {
        ctx.clearRect(0, 0, w, h)
        flakes.current = flakes.current.filter(f => f.opacity > 0.02 && f.y < h + 24)
        for (const f of flakes.current) {
          f.vy += 0.16
          f.vx *= 0.985
          f.x += f.vx
          f.y += f.vy
          f.rotation += f.rotSpeed
          f.opacity -= 0.022
          ctx.save()
          ctx.globalAlpha = Math.max(0, f.opacity)
          ctx.translate(f.x, f.y)
          ctx.rotate(f.rotation)
          ctx.fillStyle = f.w > 5 ? eventConfig.theme.scratchHighlight : '#ffffff'
          ctx.beginPath()
          ctx.moveTo(-f.w / 2, -f.h / 2)
          ctx.lineTo(f.w / 2, -f.h / 3)
          ctx.lineTo(f.w / 3, f.h / 2)
          ctx.lineTo(-f.w / 2, f.h / 4)
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const spawnFlakes = (x: number, y: number) => {
    if (flakes.current.length > 120) return
    for (let i = 0; i < 5; i++) {
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

  const pt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * 360) / r.width, y: ((e.clientY - r.top) * 480) / r.height }
  }

  const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || finished.current) return
    const canvas = scratchRef.current!
    const ctx = canvas.getContext('2d')!
    const p = pt(e)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 60
    ctx.shadowColor = 'rgba(0,0,0,.65)'
    ctx.shadowBlur = 4
    ctx.beginPath()
    ctx.moveTo(last.current?.x ?? p.x, last.current?.y ?? p.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(p.x, p.y, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    last.current = p
    spawnFlakes(p.x, p.y)

    if (performance.now() - checkedAt.current < 100) return
    checkedAt.current = performance.now()
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let clear = 0
    for (let i = 3; i < pixels.length; i += 40) {
      if (pixels[i] < 40) clear++
    }
    if (clear / (pixels.length / 40) > 0.5) finish()
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
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            finish()
          }
        }}
        onPointerDown={e => {
          drawing.current = true
          last.current = pt(e)
          e.currentTarget.setPointerCapture(e.pointerId)
          scratch(e)
        }}
        onPointerMove={scratch}
        onPointerUp={() => {
          drawing.current = false
          last.current = null
        }}
        onPointerCancel={() => {
          drawing.current = false
          last.current = null
        }}
        onLostPointerCapture={() => {
          drawing.current = false
          last.current = null
        }}
      />
      <canvas ref={particleRef} className="particle-canvas" aria-hidden="true" />
      <div className="scratch-hint-overlay" aria-hidden="true">
        <span>✨ {eventConfig.copy.scratchInstruction}</span>
      </div>
      {scratched && <div className="reveal-glow" aria-hidden="true" />}
    </div>
  )
}

function CelebrationEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = 360
    const height = 480
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * ratio
    canvas.height = height * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)

    const colors = ['#ff4d15', '#ffd15c', '#ffffff', '#ff7a45', '#ff9f43', '#ffeaa7']
    const particles: ConfettiParticle[] = []

    for (let i = 0; i < 75; i += 1) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 80,
        y: height / 2 + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 9,
        vy: Math.random() * -7 - 2.5,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        opacity: 1,
      })
    }

    let animId = 0
    const render = () => {
      ctx.clearRect(0, 0, width, height)
      let activeCount = 0

      for (const p of particles) {
        if (p.opacity <= 0.01) continue
        activeCount += 1
        p.vy += 0.18
        p.vx *= 0.985
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotSpeed
        p.opacity -= 0.009

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }

      if (activeCount > 0) {
        animId = requestAnimationFrame(render)
      }
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [])

  return <canvas ref={canvasRef} className="celebration-canvas" aria-hidden="true" />
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('stamp')
  const [reward, setReward] = useState<Reward | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Trigger stamping: show dongdau.jpg, then proceed to Bước 3 (cào thẻ nhận quà)
  const handleStamp = () => {
    if (screen !== 'stamp' || isProcessing) return
    setIsProcessing(true)
    setScreen('stamped')

    // Randomize 1 of the 4 rewards
    const randomIndex = Math.floor(Math.random() * eventConfig.rewards.length)
    const selectedReward = eventConfig.rewards[randomIndex]
    setReward(selectedReward)
    setIsRevealed(false)

    // After stamp impact display (~1150ms), transition to Bước 3 (cào thẻ)
    timerRef.current = setTimeout(() => {
      setScreen('reward')
      setIsProcessing(false)
    }, 1150)
  }

  const handleScratchComplete = () => {
    setIsRevealed(true)
  }

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsProcessing(false)
    setReward(null)
    setIsRevealed(false)
    setScreen('stamp')
  }

  return (
    <main
      className="app-shell"
      style={{
        '--primary': eventConfig.theme.primary,
        '--primary-dark': eventConfig.theme.primaryDark,
        '--ink': eventConfig.theme.ink,
        '--background': eventConfig.theme.background,
      } as CSSProperties}
    >
      {/* ── BƯỚC 2: CHƯA ĐÓNG DẤU (valid.jpg) ── */}
      {screen === 'stamp' && (
        <section className="screen stamp-screen" aria-label="Màn hình đóng dấu">
          <header className="screen-header">
            <BrandLogo />
            <div className="header-badge">{eventConfig.copy.step2Badge}</div>
          </header>

          <button
            className="stamp-card is-interactive"
            onClick={handleStamp}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleStamp()
              }
            }}
            aria-label={eventConfig.copy.stampInstruction}
            title={eventConfig.copy.stampInstruction}
          >
            <PortraitArtwork src={eventConfig.stamp.image} label={eventConfig.copy.stampPrompt} />
            <div className="tap-hint-pill" aria-hidden="true">
              <span className="tap-icon">👆</span>
              <span>{eventConfig.copy.stampInstruction}</span>
            </div>
            <div className="card-shine" aria-hidden="true" />
          </button>

          <p className="screen-instruction">{eventConfig.copy.stampInstruction}</p>
        </section>
      )}

      {/* ── BƯỚC 2 (XÁC NHẬN): ĐÃ ĐÓNG DẤU (dongdau.jpg) ── */}
      {screen === 'stamped' && (
        <section className="screen stamp-screen confirmation-screen" aria-live="assertive">
          <header className="screen-header">
            <BrandLogo />
            <div className="header-badge badge-active">{eventConfig.copy.step2Badge}</div>
          </header>

          <div className="stamp-card confirmation-card">
            <PortraitArtwork
              src={eventConfig.stamp.confirmationImage}
              label={eventConfig.copy.stampedStatus}
              isStamp={true}
            />
            <div className="stamp-flash" aria-hidden="true" />
          </div>

          <div className="status-container">
            <p className="screen-instruction status-text">{eventConfig.copy.stampedStatus}</p>
            <p className="status-sub">Đang chuyển sang bước cào thẻ nhận quà...</p>
          </div>
        </section>
      )}

      {/* ── BƯỚC 3: CÀO THẺ NHẬN QUÀ (Watermark Scratch Card + Random 1 trong 4 quà) ── */}
      {screen === 'reward' && reward && (
        <section className="screen reward-screen" aria-live="polite">
          <header className="screen-header reward-header">
            <BrandLogo />
            <div className="header-badge badge-reward">{eventConfig.copy.step3Badge}</div>
            <button
              className="home-button"
              onClick={restart}
              aria-label={eventConfig.copy.restartAriaLabel}
              title={eventConfig.copy.restartAriaLabel}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </header>

          <div className="reward-congratulation-box">
            {isRevealed ? (
              <>
                <span className="celebration-tag">🎉 PHẦN QUÀ MAY MẮN</span>
                <h1 className="reward-heading">{reward.congratulation}</h1>
              </>
            ) : (
              <>
                <span className="celebration-tag">🎁 THẺ CÀO MAY MẮN</span>
                <h1 className="reward-heading">Cào lớp bạc để mở quà</h1>
              </>
            )}
          </div>

          <div className="scratch-center">
            <ScratchCard reward={reward} onComplete={handleScratchComplete} />
            {isRevealed && <CelebrationEffect />}
          </div>

          <div className="reward-info">
            {isRevealed ? (
              <span className="reward-name-pill">{reward.name}</span>
            ) : (
              <span className="reward-hint-pill">✨ Dùng ngón tay hoặc chuột cào thẻ</span>
            )}
          </div>

          {isRevealed && (
            <button className="restart-button" onClick={restart}>
              <span>{eventConfig.copy.restart}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="btn-icon">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          )}
        </section>
      )}
    </main>
  )
}
