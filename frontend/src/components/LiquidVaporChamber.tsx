
import { useEffect, useRef, useState } from 'react'

type Mode = 'user' | 'developer'

/* -------------------------------------------------------------------------- */
/* TUNING: the glass interior as a fraction of the stage (0..1).               */
/* Everything inside this rounded rect is "mercury space": it is empty until   */
/* filled, and it is where the mercury vaporises. The glass walls outside it   */
/* always stay visible. If mercury is cut off or glass gets covered, nudge     */
/* these numbers.                                                              */
/* -------------------------------------------------------------------------- */
const JAR = { left: 0.125, right: 0.875, top: 0.17, bottom: 0.845, radius: 0.14 }

const FILL_SECONDS = 9 // slow, steady pour until the mercury reaches its shape
const SHOW_STREAM = true // thin mercury stream that feeds the pool while filling
const VAPORISE_SECONDS = 3.2 // full -> mercury lifts off as vapor and flies upward

const MERCURY_SRC = '/cloche_mercury.jpg'
const VAPOR_SRC = '/cloche_vapor.jpg'

// Where the static mercury blob sits inside the jar (fractions of the stage height).
// The pool forms on `base` and swells up to `top`.
const BLOB = { top: 0.19, base: 0.83 }

const CSS = `
.cloche-section {
  position: relative;
  width: 100%;
  padding: 4.5rem 1.5rem 7rem;
  background: #000000;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.cloche-container {
  position: relative;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cloche-toggle-wrap {
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border-radius: 9999px;
  background: rgba(18, 22, 28, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  margin-bottom: 2.4rem;
  user-select: none;
  z-index: 10;
}

.cloche-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.62rem 1.55rem;
  border-radius: 9999px;
  border: 1px solid transparent;
  background: transparent;
  color: #94a3b8;
  font-size: 0.96rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.cloche-toggle-btn:hover { color: #ffffff; }

.cloche-toggle-btn.active {
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
  color: #08090b;
  font-weight: 600;
  border-color: #ffffff;
  box-shadow: 0 4px 18px rgba(255, 255, 255, 0.28), inset 0 1px 0 #ffffff;
}

.cloche-toggle-btn svg {
  width: 17px;
  height: 17px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.cloche-stage {
  position: relative;
  width: 100%;
  max-width: 620px;
  aspect-ratio: 896 / 1200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cloche-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

/* Vapor photo sits under the canvas; its opacity is driven from the animation loop */
.cloche-layer.vapor {
  z-index: 2;
  opacity: 0;
  filter: contrast(1.04) brightness(1.02);
}

/* Canvas draws the glass shell + the live mercury + smoke */
.cloche-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

.cloche-content {
  position: absolute;
  inset: 0;
  z-index: 4;
  padding: 20% 15% 15%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  animation: cloche-fade-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  pointer-events: auto;
}

@keyframes cloche-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.cloche-title {
  margin: 0 0 1.9rem 0;
  font-size: clamp(1.6rem, 3vw, 2.15rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9), 0 0 24px rgba(0, 0, 0, 0.6);
}

.cloche-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  width: 100%;
}

.cloche-item {
  display: flex;
  align-items: center;
  gap: 1.05rem;
  color: #f1f5f9;
  font-size: 1.05rem;
  font-weight: 400;
  line-height: 1.4;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.95), 0 0 14px rgba(0, 0, 0, 0.7);
}

.cloche-icon-wrap {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.9));
}

.cloche-icon-wrap svg {
  width: 22px;
  height: 22px;
  stroke: currentColor;
  stroke-width: 1.8;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Developer mode: dark soft scrim behind the copy so white text stays readable over the white clouds */
.cloche-content.dev::before {
  content: '';
  position: absolute;
  inset: 10% 4% 6%;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(ellipse 72% 64% at 46% 52%, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%);
  filter: blur(10px);
}
.cloche-content.dev .cloche-title,
.cloche-content.dev .cloche-item {
  text-shadow: 0 0 3px rgba(0,0,0,1), 0 1px 8px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.9);
}
.cloche-content.dev .cloche-item { font-weight: 500; }

@media (max-width: 600px) {
  .cloche-stage { max-width: 440px; }
  .cloche-content { padding: 18% 13% 13%; }
  .cloche-title { font-size: 1.5rem; margin-bottom: 1.3rem; }
  .cloche-item { font-size: 0.9rem; gap: 0.8rem; }
  .cloche-list { gap: 1rem; }
}
`

type Puff = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number }

const smooth = (x: number) => {
  const c = Math.max(0, Math.min(1, x))
  return c * c * (3 - 2 * c)
}

function rrSubpath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

type LayerOpts = { f: number; vap: number; ampX: number; ampY: number; spd: number; wave: number }

export function LiquidVaporChamber() {
  const [mode, setMode] = useState<Mode>('user')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Shared with the animation loop so switching modes never restarts it
  const modeRef = useRef<Mode>('user')
  const fillRef = useRef(0) // 0 = nothing, 1 = mercury has fully taken its shape
  const vapRef = useRef(0) // 0 = solid mercury, 1 = fully turned to vapor
  const vaporOpRef = useRef(0)
  const timeRef = useRef(0)
  const puffsRef = useRef<Puff[]>([])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const merc = new Image()
    merc.src = MERCURY_SRC
    const vaporImg = new Image()
    vaporImg.src = VAPOR_SRC

    // Scratch buffer for the two-pass (rows, then columns) liquid warp
    const buf = document.createElement('canvas')
    const bctx = buf.getContext('2d')!

    let W = 0
    let H = 0
    let raf = 0
    let last = performance.now()
    let emitCarry = 0
    let wispCarry = 0
    const SEED = { a: Math.random() * 6.28, b: Math.random() * 6.28, c: Math.random() * 6.28 }

    const glints = Array.from({ length: 22 }, () => ({
      x: 0.2 + Math.random() * 0.6,
      y: 0.25 + Math.random() * 0.55,
      speed: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
    }))

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = Math.floor(rect.width * dpr)
      H = Math.floor(rect.height * dpr)
      canvas.width = W
      canvas.height = H
    }
    resize()
    window.addEventListener('resize', resize)

    const ok = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0

    const render = (now: number) => {
      raf = requestAnimationFrame(render)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      timeRef.current += dt
      const t = timeRef.current
      if (W === 0 || H === 0) return

      const isUser = modeRef.current === 'user'

      /* ----------------------- state machine ----------------------- */
      let fill = fillRef.current
      let vap = vapRef.current
      if (isUser) {
        if (vap > 0) {
          vap = Math.max(0, vap - dt / 0.8) // mid-vaporisation: condense back quickly
        } else {
          fill = Math.min(1, fill + dt / FILL_SECONDS)
        }
      } else if (fill > 0) {
        vap = Math.min(1, vap + dt / VAPORISE_SECONDS)
        if (vap >= 1) {
          fill = 0 // all of it has flown away
          vap = 0
        }
      }
      fillRef.current = fill
      vapRef.current = vap

      // How much the vapor clouds show: inverse of how much mercury is left
      const presence = fill * (1 - vap)
      const voTarget = isUser ? 0 : 1 - smooth(presence * 1.4)
      const voRate = isUser ? 3.5 : 1.8
      vaporOpRef.current += (voTarget - vaporOpRef.current) * Math.min(1, dt * voRate)
      const vo = vaporOpRef.current

      ctx.clearRect(0, 0, W, H)

      const s = W / 440 // scale for pixel-ish constants

      // Jar interior in canvas pixels
      const jx = W * JAR.left
      const jy = H * JAR.top
      const jw = W * (JAR.right - JAR.left)
      const jh = H * (JAR.bottom - JAR.top)
      const jr = W * JAR.radius
      const bottomY = jy + jh

      const clipInterior = () => {
        ctx.beginPath()
        rrSubpath(ctx, jx, jy, jw, jh, jr)
        ctx.clip()
      }

      /**
       * Draws a photo inside the jar as living liquid.
       *  - f < 1: a slow pour. The photo is squashed into a small pool on the base and
       *    grows into its real shape, with the top surface sloshing unevenly (each
       *    column rises at its own, constantly changing height, like real liquid)
       *  - after f = 1 the same slosh keeps going at low amplitude, so it never freezes
       *  - vap > 0: rows turn to vapor from the bottom up, lifting and fading
       */
      const drawLayer = (img: HTMLImageElement, alpha: number, o: LayerOpts) => {
        const nw = img.naturalWidth
        const nh = img.naturalHeight
        const bw = Math.ceil(jw + 12)
        const bh = Math.ceil(jh)
        if (buf.width !== bw || buf.height !== bh) {
          buf.width = bw
          buf.height = bh
        }
        bctx.clearRect(0, 0, bw, bh)

        const tt = t * o.spd
        const stripH = Math.max(3, Math.round(5 * s))
        // near-linear (steady pour), soft at both ends
        const eased = 0.65 * o.f + 0.35 * smooth(o.f)
        const scaleX = 0.4 + 0.6 * smooth(Math.min(1, eased * 1.15))
        const anchor = H * BLOB.base - jy // where the mercury sits on the base
        const topSrc = H * BLOB.top - jy

        // Pass 1: rows shift sideways (flow), narrow into a dome while forming, lift when vaporising
        for (let y = 0; y < bh; y += stripH) {
          const yc = y + stripH / 2
          const k = 1 - y / jh // 0 bottom .. 1 top
          const d = o.vap > 0 ? smooth((o.vap * 1.7 - k * 0.7) / 0.35) : 0
          if (d >= 1) continue
          const u = Math.max(0, Math.min(1, (anchor - yc) / Math.max(1, anchor - topSrc)))
          const sxRow = scaleX * (1 - (1 - eased) * 0.5 * Math.pow(u, 1.4))
          const wob =
            Math.sin(yc * 0.011 + tt * 0.9 + Math.sin(tt * 0.37) * 2 + SEED.a) +
            0.6 * Math.sin(yc * 0.027 - tt * 1.3 + 1.7) +
            0.4 * Math.sin(yc * 0.05 + tt * 2.1 + SEED.b)
          const dx = wob * o.ampX + Math.sin(u * 9 + tt * 2) * d * 16 * s
          const wDest = bw * sxRow
          bctx.globalAlpha = Math.pow(1 - d, 1.3)
          bctx.drawImage(
            img,
            ((jx - 6) / W) * nw,
            ((jy + y) / H) * nh,
            (bw / W) * nw,
            (stripH / H) * nh,
            (bw - wDest) / 2 + dx,
            yc - d * 90 * s - stripH / 2,
            wDest,
            stripH + 1,
          )
        }
        bctx.globalAlpha = 1

        // Pass 2: every column has its own liquid height, then composite into the jar
        ctx.save()
        clipInterior()
        ctx.globalAlpha = alpha
        const cw = Math.max(3, Math.round(6 * s))
        const wA = o.wave * (0.26 * Math.pow(1 - eased, 0.8) + 0.022)
        for (let x = 0; x < bw; x += cw) {
          const xn = x / bw
          const wave =
            0.5 * Math.sin(xn * 5.5 + tt * 1.7 + Math.sin(tt * 0.5) * 1.5 + SEED.a) +
            0.3 * Math.sin(xn * 11 - tt * 2.6 + SEED.b) +
            0.6 * Math.sin(xn * 2.3 + tt * 0.9 + SEED.c)
          const mound = 1 + (1 - eased) * 0.3 * Math.cos((xn - 0.5) * Math.PI)
          const cs = Math.max(0.015, eased * mound * (1 + wA * wave))
          const dyc =
            (Math.sin(x * 0.013 + tt * 1.1 + Math.sin(tt * 0.41) * 1.8) + 0.6 * Math.sin(x * 0.031 - tt * 1.7)) * o.ampY
          ctx.drawImage(buf, x, 0, cw, bh, jx - 6 + x, jy + anchor - anchor * cs + dyc, cw + 1, bh * cs)
        }
        ctx.restore()
      }

      /* ------------- glass shell (everything outside the jar interior) ------------- */
      if (ok(merc)) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, W, H)
        rrSubpath(ctx, jx, jy, jw, jh, jr)
        ctx.clip('evenodd')
        ctx.drawImage(merc, 0, 0, W, H)
        ctx.restore()
      }

      /* ------------- vapor clouds: alive, swirling, never a still photo ------------- */
      if (ok(vaporImg) && vo > 0.01) {
        drawLayer(vaporImg, vo * 0.9, { f: 1, vap: 0, ampX: 9 * s, ampY: 7 * s, spd: 0.8, wave: 0 })
      }

      /* ------------- mercury: the original photo, flowing into its shape ------------- */
      if (ok(merc) && fill > 0.002 && vap < 0.999) {
        const settled = fill >= 0.999
        const ramp = smooth((fill - 0.75) / 0.25) // idle motion fades in as the shape completes
        const jelly = (1 - fill) * smooth(fill * 6) // extra rippling while forming
        drawLayer(merc, smooth(fill * 10), {
          f: fill,
          vap,
          ampX: (6 * ramp + 8 * jelly) * s,
          ampY: (4.2 * ramp + 5 * jelly) * s,
          spd: 1,
          wave: 1,
        })

        // living glints on the settled mercury
        if (settled && vap === 0 && isUser) {
          ctx.save()
          clipInterior()
          for (const g of glints) {
            const intensity = 0.5 + 0.5 * Math.sin(t * g.speed + g.phase)
            if (intensity > 0.45) {
              const gx = g.x * W + Math.sin(t * 0.8 + g.phase) * 6 * s
              const gy = g.y * H + Math.cos(t * 0.7 + g.phase) * 6 * s
              const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, 14 * s)
              gr.addColorStop(0, `rgba(255,255,255,${0.35 * (intensity - 0.45)})`)
              gr.addColorStop(1, 'rgba(255,255,255,0)')
              ctx.fillStyle = gr
              ctx.beginPath()
              ctx.arc(gx, gy, 14 * s, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          ctx.restore()
        }
      }

      /* ---------- thin mercury stream feeding the pool while it fills ---------- */
      if (SHOW_STREAM && isUser && vap === 0 && fill < 0.95 && ok(merc)) {
        const eased = 0.65 * fill + 0.35 * smooth(fill)
        const poolTop = H * BLOB.base - H * (BLOB.base - BLOB.top) * eased
        const sw = s * (2.2 + 4 * smooth(fill * 4)) * (1 - smooth((fill - 0.8) / 0.14))
        if (sw > 0.2 && poolTop > jy + 10) {
          const cx = jx + jw * 0.5 + Math.sin(t * 0.9) * 8 * s + Math.sin(t * 2.3) * 3 * s
          ctx.save()
          clipInterior()
          const grad = ctx.createLinearGradient(cx - sw * 1.2, 0, cx + sw * 1.2, 0)
          grad.addColorStop(0, '#2a2f36')
          grad.addColorStop(0.35, '#aeb7c2')
          grad.addColorStop(0.5, '#ffffff')
          grad.addColorStop(0.7, '#8e98a5')
          grad.addColorStop(1, '#20242a')
          const N = 28
          ctx.beginPath()
          for (let i = 0; i <= N; i++) {
            const y = jy + ((poolTop - jy) * i) / N
            const prog = i / N
            const hw = sw * 0.5 * (1.25 - 0.5 * prog) * (1 + 0.15 * Math.sin(y * 0.08 - t * 9))
            const x = cx + Math.sin(y * 0.02 - t * 6) * 1.5 * s - hw
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          for (let i = N; i >= 0; i--) {
            const y = jy + ((poolTop - jy) * i) / N
            const prog = i / N
            const hw = sw * 0.5 * (1.25 - 0.5 * prog) * (1 + 0.15 * Math.sin(y * 0.08 - t * 9))
            ctx.lineTo(cx + Math.sin(y * 0.02 - t * 6) * 1.5 * s + hw, y)
          }
          ctx.closePath()
          ctx.fillStyle = grad
          ctx.fill()
          // glow where the stream lands
          const sp = ctx.createRadialGradient(cx, poolTop, 0, cx, poolTop, 24 * s)
          sp.addColorStop(0, 'rgba(255,255,255,0.4)')
          sp.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = sp
          ctx.beginPath()
          ctx.arc(cx, poolTop, 24 * s, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }

      /* -------- smoke born where the mercury dissolves (flies upward) -------- */
      if (vap > 0 && !isUser) {
        emitCarry += dt * 260
        let guard = 0
        while (emitCarry >= 1 && guard++ < 40) {
          emitCarry -= 1
          const yn = Math.random()
          const k = 1 - yn
          const d = smooth((vap * 1.7 - k * 0.7) / 0.35)
          if (d > 0.06 && d < 0.94) {
            puffsRef.current.push({
              x: jx + jw * (0.05 + Math.random() * 0.9),
              y: jy + jh * yn - d * 90 * s,
              vx: (Math.random() - 0.5) * 30,
              vy: -(60 + Math.random() * 120) * s,
              life: 0,
              max: 1.6 + Math.random() * 1.8,
              size: 18 + Math.random() * 34,
            })
          }
        }
      }

      // Once the mercury is gone, the clouds keep breathing out slow rising wisps
      if (!isUser && vo > 0.5) {
        wispCarry += dt * 20
        while (wispCarry >= 1) {
          wispCarry -= 1
          puffsRef.current.push({
            x: jx + jw * (0.15 + Math.random() * 0.7),
            y: jy + jh * (0.7 + Math.random() * 0.2),
            vx: (Math.random() - 0.5) * 18,
            vy: -(35 + Math.random() * 60) * s,
            life: 0,
            max: 2.6 + Math.random() * 2,
            size: 26 + Math.random() * 30,
          })
        }
      }

      const puffs = puffsRef.current
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]
        p.life += dt
        if (p.life >= p.max || p.y < jy - 40 * s) {
          puffs.splice(i, 1)
          continue
        }
        p.x += (p.vx + Math.sin(t * 1.6 + p.y * 0.02) * 16) * dt
        p.y += p.vy * dt
        const k = p.life / p.max
        const r = (p.size + k * 50) * s
        const a = Math.sin(Math.PI * k) * 0.26
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        g.addColorStop(0, `rgba(225,234,245,${a})`)
        g.addColorStop(1, 'rgba(225,234,245,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    raf = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section className="cloche-section" id="journeys">
      <style>{CSS}</style>

      <div className="cloche-container">
        <div className="cloche-toggle-wrap">
          <button
            type="button"
            className={`cloche-toggle-btn ${mode === 'user' ? 'active' : ''}`}
            onClick={() => setMode('user')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>For End Users</span>
          </button>

          <button
            type="button"
            className={`cloche-toggle-btn ${mode === 'developer' ? 'active' : ''}`}
            onClick={() => setMode('developer')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>For Developers</span>
          </button>
        </div>

        <div className="cloche-stage">
          {/* Glass shell + liquid mercury (the original photo, flowing into shape) + living vapor clouds + smoke */}
          <canvas
            ref={canvasRef}
            className="cloche-canvas"
            role="img"
            aria-label="Glass cloche filled with liquid mercury"
          />

          <div className={`cloche-content ${mode === 'developer' ? 'dev' : ''}`} key={mode}>
            {mode === 'user' ? (
              <>
                <h3 className="cloche-title">For End Users</h3>
                <ul className="cloche-list">
                  <li className="cloche-item">
                    <span className="cloche-icon-wrap" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                    <span>Single, trusted sign-in</span>
                  </li>

                  <li className="cloche-item">
                    <span className="cloche-icon-wrap" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                    </span>
                    <span>Access multiple applications</span>
                  </li>

                  <li className="cloche-item">
                    <span className="cloche-icon-wrap" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 11c0 2-1 3-2 4m4-4c0 3-1.5 5-3 6m-5-8a6 6 0 0 1 12 0c0 3.5-1.5 6-3.5 8M9 9a3 3 0 0 1 6 0c0 1.5-.5 3-1.5 4" />
                      </svg>
                    </span>
                    <span>Privacy &amp; data control</span>
                  </li>

                  <li className="cloche-item">
                    <span className="cloche-icon-wrap" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </span>
                    <span>Secure and seamless experience</span>
                  </li>
                </ul>
              </>
            ) : (
              <>
                <h3 className="cloche-title">For Developers</h3>
                <ul className="cloche-list">
                  <li className="cloche-item">
                    <span className="cloche-icon-wrap" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    </span>
                    <span>Standards-compliant OIDC (RFC 6749)</span>
                  </li>

                  <li className="cloche-item">
                    <span className="cloche-icon-wrap" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </span>
                    <span>Quick integration with any app</span>
                  </li>

                  <li className="cloche-item">
                    <span className="cloche-icon-wrap" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <circle cx="7.5" cy="15.5" r="4.5" />
                        <path d="m21 3-9.5 9.5" />
                        <path d="m15.5 8.5 2 2" />
                        <path d="m18 6 2 2" />
                      </svg>
                    </span>
                    <span>JWT (RS256) &amp; JWKS support</span>
                  </li>

                  <li className="cloche-item">
                    <span className="cloche-icon-wrap" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <line x1="4" y1="21" x2="4" y2="14" />
                        <line x1="4" y1="10" x2="4" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12" y2="3" />
                        <line x1="20" y1="21" x2="20" y2="16" />
                        <line x1="20" y1="12" x2="20" y2="3" />
                        <line x1="1" y1="14" x2="7" y2="14" />
                        <line x1="9" y1="8" x2="15" y2="8" />
                        <line x1="17" y1="16" x2="23" y2="16" />
                      </svg>
                    </span>
                    <span>Custom clients, scopes &amp; policies</span>
                  </li>

                  <li className="cloche-item">
                    <span className="cloche-icon-wrap" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M10 2v7.31L4.47 19.34A2 2 0 0 0 6.19 22h11.62a2 2 0 0 0 1.72-2.66L14 9.31V2" />
                        <line x1="8.5" y1="2" x2="15.5" y2="2" />
                        <line x1="7" y1="16" x2="17" y2="16" />
                      </svg>
                    </span>
                    <span>Test with a built-in OIDC simulator</span>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}