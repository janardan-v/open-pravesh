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

const TRANSITION_SECONDS = 3.6 // one shared progress value drives the whole mercury <-> vapor transition
const FILL_SECONDS = 7.5 // time for the falling stream to fill the chamber
const MERCURY_SRC = '/cloche_mercury.jpg'
const VAPOR_SRC = '/cloche_vapor.jpg'

// Where the static mercury blob sits inside the jar (fractions of the stage height).
// The pool forms on `base` and swells up to `top`.
const BLOB = { top: 0.19, base: 0.83 }

// Measured top silhouette of the mercury artwork inside the jar, as fractions of
// the stage height, sampled evenly from JAR.left to JAR.right. The fill surface
// morphs into this profile so the finished pool keeps the reference artwork's
// exact wavy top edge instead of a generic horizontal waterline.
const ART_TOP = [
  0.3067, 0.22, 0.2617, 0.2517, 0.2442, 0.2233, 0.2033, 0.1708,
  0.19, 0.19, 0.1733, 0.1725, 0.1842, 0.1883, 0.1883, 0.175,
  0.1742, 0.1917, 0.2092, 0.2183, 0.23, 0.2375, 0.2758, 0.2767,
  0.2592, 0.2508, 0.2483, 0.2458, 0.2458, 0.2467, 0.2375, 0.2817,
]

// The chamber starts with a shallow puddle so the falling stream has a surface
// to strike immediately (reference stage 1).
const INITIAL_FILL = 0.045

const CSS = `
.cloche-section {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  padding: 4.5rem 1.5rem 7rem;
  background: #000000;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow-x: clip;
  overflow-y: visible;
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
  white-space: nowrap;
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

/* Kept for compatibility with the section layering; vapor is drawn dynamically on canvas. */
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
  background: radial-gradient(ellipse 72% 64% at 46% 52%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%);
  filter: blur(10px);
}
.cloche-content.dev .cloche-title,
.cloche-content.dev .cloche-item {
  text-shadow: 0 0 3px rgba(0,0,0,1), 0 1px 8px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.9);
}
.cloche-content.dev .cloche-item { font-weight: 500; }

@media (prefers-reduced-motion: reduce) {
  .cloche-content { animation: none; }
  .cloche-toggle-btn { transition: none; }
}

@media (max-width: 600px) {
  .cloche-section { padding: 3rem 1rem 5rem; }
  .cloche-toggle-btn { padding: 0.5rem 1rem; font-size: 0.85rem; gap: 0.45rem; white-space: nowrap; }
  .cloche-stage { max-width: 440px; }
  .cloche-content { padding: 15% 11% 20%; }
  .cloche-title { font-size: 1.3rem; margin-bottom: 0.9rem; }
  .cloche-item { font-size: 0.78rem; gap: 0.6rem; }
  .cloche-list { gap: 0.8rem; }
  .cloche-icon-wrap, .cloche-icon-wrap svg { width: 18px; height: 18px; }
}
`

const smooth = (x: number) => {
  const c = Math.max(0, Math.min(1, x))
  return c * c * (3 - 2 * c)
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

function rrSubpath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function LiquidVaporChamber() {
  const [mode, setMode] = useState<Mode>('user')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Animation state lives in refs: no React re-render per frame.
  // fillRef (liquid volume) and progressRef (liquid -> vapor conversion) are
  // deliberately independent so switching modes never resets or drops the pool.
  const modeRef = useRef<Mode>('user')
  const progressRef = useRef(0) // 0 = mercury visible, 1 = empty chamber with rising vapor
  const fillRef = useRef(INITIAL_FILL) // 0 = empty, 1 = fully filled
  const timeRef = useRef(0)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const mercury = new Image()
    const vapor = new Image()
    const isLoaded = (image: HTMLImageElement) =>
      image.complete && image.naturalWidth > 0

    let W = 0
    let H = 0
    let raf = 0
    let last = performance.now()
    let lastFrameKey = ''
    let disposed = false
    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let emissionCarry = 0

    // Offscreen layer for the liquid body: the artwork is drawn once, then the
    // space above the animated liquid front is erased with a soft, blurred edge.
    // This gives an organic dissolve without horizontal image-strip seams.
    const liquidLayer = document.createElement('canvas')
    const lctx = liquidLayer.getContext('2d')

    type VaporParticle = {
      x: number
      y: number
      vx: number
      vy: number
      age: number
      life: number
      size: number
      phase: number
      curl: number
    }

    const particles: VaporParticle[] = []
    // Tiny ballistic droplets thrown out where the stream strikes the pool
    // (target stage 1: "small ripples and splashes where it hits the surface").
    const droplets: { x: number; y: number; vx: number; vy: number; age: number; life: number }[] = []
    let splashCarry = 0
    const seed = {
      a: Math.random() * Math.PI * 2,
      b: Math.random() * Math.PI * 2,
      c: Math.random() * Math.PI * 2,
    }

    // --- Silhouette profiles ------------------------------------------------
    // ART_TOP_SAFE never sits below the measured profile (one-sided smoothing),
    // so the erase front can never bite into the reference artwork.
    const artSafe = ART_TOP.slice()
    for (let pass = 0; pass < 3; pass++) {
      const prev = artSafe.slice()
      for (let i = 1; i < prev.length - 1; i++) {
        artSafe[i] = Math.min(prev[i], (prev[i - 1] + prev[i + 1]) / 2)
      }
    }
    const profileAt = (profile: number[], nx: number) => {
      const pos = clamp01(nx) * (profile.length - 1)
      const i = Math.min(profile.length - 2, Math.floor(pos))
      return profile[i] + (profile[i + 1] - profile[i]) * (pos - i)
    }

    const invalidate = () => {
      if (disposed) return
      lastFrameKey = ''
    }

    mercury.onload = invalidate
    vapor.onload = invalidate
    mercury.onerror = () => {
      if (!disposed) console.error(`Unable to load ${MERCURY_SRC}`)
    }
    vapor.onerror = () => {
      if (!disposed) console.error(`Unable to load ${VAPOR_SRC}`)
    }
    mercury.src = MERCURY_SRC
    vapor.src = VAPOR_SRC

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.round(rect.width * dpr)
      const height = Math.round(rect.height * dpr)

      if (width !== W || height !== H) {
        W = width
        H = height
        canvas.width = W
        canvas.height = H
        liquidLayer.width = W
        liquidLayer.height = H
        lastFrameKey = ''
      }
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionChange = () => {
      reducedMotion = motionQuery.matches
      lastFrameKey = ''
    }
    motionQuery.addEventListener('change', onMotionChange)

    const render = (now: number) => {
      raf = requestAnimationFrame(render)
      if (!W || !H) return

      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now

      const target = modeRef.current === 'developer' ? 1 : 0
      let p = progressRef.current

      if (reducedMotion) {
        p = target
      } else {
        const step = dt / TRANSITION_SECONDS
        p += Math.max(-step, Math.min(step, target - p))
      }
      progressRef.current = p

      // Initial user-mode fill is independent from the reversible mode change:
      // it freezes mid-way if the user switches modes and resumes where it was.
      let fill = fillRef.current
      if (reducedMotion) {
        if (target === 0) fill = 1
      } else if (target === 0 && p < 0.02) {
        fill = Math.min(1, fill + dt / FILL_SECONDS)
      }
      fillRef.current = fill

      const frameKey = `${W}x${H}:${target}:${isLoaded(mercury)}:${isLoaded(vapor)}`
      if (reducedMotion) {
        if (frameKey === lastFrameKey) return
        lastFrameKey = frameKey
        timeRef.current = 2.4
      } else {
        timeRef.current += dt
      }

      const t = timeRef.current
      const sp = smooth(p)
      const transitionMotion = Math.sin(Math.PI * sp)
      const s = W / 440

      const jx = W * JAR.left
      const jy = H * JAR.top
      const jw = W * (JAR.right - JAR.left)
      const jh = H * (JAR.bottom - JAR.top)
      const jr = W * JAR.radius
      const jarBottomY = H * JAR.bottom
      const baseY = H * Math.min(BLOB.base, JAR.bottom - 0.006)

      const clipInterior = () => {
        ctx.beginPath()
        rrSubpath(ctx, jx, jy, jw, jh, jr)
        ctx.clip()
      }

      // --- Progress drivers (all independent, all time based) ---------------
      const depthT = Math.pow(clamp01(fill), 0.8) // how deep the pool is
      const widen = smooth((fill - 0.06) / 0.36) // how far the pool reaches the walls
      const bumpSigma = 0.13 + 0.22 * smooth(fill / 0.5)
      // Evaporation: liquid stays mostly in place early, then is consumed.
      const consumeT = smooth((p - 0.14) / 0.8)
      // Shell crossfade to the vapor artwork (keeps the glass pixel aligned).
      const ringT = smooth((p - 0.08) / 0.72)
      // Vapor artwork accumulates gradually - never a sudden fog.
      const vaporRamp = smooth(p / 0.86)

      const streamX =
        jx + jw * 0.5 +
        Math.sin(t * 0.72) * 2.1 * s +
        Math.sin(t * 1.65) * 0.8 * s
      const streamOpacity =
        (1 - smooth(p / 0.3)) *
        (1 - smooth((fill - 0.92) / 0.08))

      // --- The single liquid front: fill surface + evaporation tear ----------
      // Returns the y of the liquid boundary for a jar-normalised x (0..1).
      const frontAt = (nx: number, noiseScale: number) => {
        const c = clamp01(nx)
        const floorY = baseY + (jarBottomY - baseY) * (1 - widen)
        const artDepth = floorY - H * profileAt(artSafe, c)
        const bump = Math.exp(-(((c - 0.5) / bumpSigma) ** 2))
        const spread = bump + (1 - bump) * widen
        let y = floorY - artDepth * depthT * spread

        // Curved capillary meniscus where the liquid meets the glass walls.
        y -= (smooth((0.07 - c) / 0.07) + smooth((c - 0.93) / 0.07)) * 6 * s * widen

        // Broad, continuous surface waves tapered at the walls. The baseline is
        // kept high so a completely filled pool never freezes: it keeps a slow,
        // heavy rolling swell like real liquid.
        const taper = Math.pow(Math.max(0, Math.sin(Math.PI * c)), 0.5)
        const waveAmp = (3.0 + 3.4 * (1 - depthT) + 2.6 * streamOpacity) * s
        const wave =
          0.55 * Math.sin(c * 6.1 + t * 0.85 + seed.a) +
          0.3 * Math.sin(c * 11.7 - t * 1.35 + seed.b) +
          0.17 * Math.sin(c * 19.3 + t * 1.05 + seed.c) +
          0.5 * depthT * Math.sin(c * 3.4 - t * 0.55 + seed.c)
        y += taper * waveAmp * wave

        // Impact depression + ripples radiating from the stream's landing point.
        if (streamOpacity > 0.01) {
          const d = Math.abs(c - 0.5)
          const dip = Math.exp(-(((c - 0.5) / 0.085) ** 2)) * Math.sin(t * 6.2) * 2.4 * s
          const ripple = Math.sin(d * 30 - t * 8) * Math.exp(-d * 5.5) * 3 * s
          y += taper * streamOpacity * (dip + ripple)
        }

        // Evaporation: the front descends and tears into organic lobes, so the
        // liquid is consumed in place instead of a clean waterline dropping.
        if (consumeT > 0.0001) {
          const travel = jarBottomY + 40 * s - y
          y += consumeT * travel
          const tearAmp =
            (4 + 58 * smooth(p)) * s * noiseScale * smooth((1 - consumeT) * 2.2)
          y += tearAmp * (
            0.55 * Math.sin(c * 7.3 + t * 0.55 + seed.b) +
            0.3 * Math.sin(c * 15.1 - t * 0.85 + seed.c) +
            0.18 * Math.sin(c * 26 + t * 1.25 + seed.a)
          )
        }
        return y
      }

      // Bright meniscus highlight: rides the ACTUAL liquid front only. It must
      // never reference the finished artwork silhouette, otherwise the final
      // shape would be visible as a ghost line before the pour even starts.
      const sheenAt = (nx: number) => {
        const f = frontAt(nx, 0.45)
        const c = clamp01(nx)
        const taper = Math.pow(Math.max(0, Math.sin(Math.PI * c)), 0.5)
        const wobble = taper * 2.2 * s * Math.sin(c * 7.7 + t * 1.1 + seed.a)
        return f + wobble
      }

      // Sample the front once per frame for bounds checks.
      const SAMPLES = 48
      let frontMin = Infinity
      let frontMax = -Infinity
      for (let i = 0; i <= SAMPLES; i++) {
        const yv = frontAt(i / SAMPLES, 1)
        if (yv < frontMin) frontMin = yv
        if (yv > frontMax) frontMax = yv
      }
      const liquidVisible = frontMin < jarBottomY + 4 * s

      const traceFront = (c: CanvasRenderingContext2D, from: number, to: number) => {
        c.beginPath()
        const steps = 72
        for (let i = 0; i <= steps; i++) {
          const nx = from + ((to - from) * i) / steps
          const x = jx + jw * nx
          const y = frontAt(nx, 1)
          if (i === 0) c.moveTo(x, y)
          else c.lineTo(x, y)
        }
      }

      ctx.clearRect(0, 0, W, H)

      // ---- 1. GLASS SHELL (outside the jar) --------------------------------
      // Always drawn from the reference artwork so the glass never moves. As
      // vaporisation completes it crossfades to the vapor artwork, removing the
      // last mercury ribbons while keeping the rims pixel aligned.
      if (isLoaded(mercury)) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, W, H)
        rrSubpath(ctx, jx, jy, jw, jh, jr)
        ctx.clip('evenodd')
        ctx.drawImage(mercury, 0, 0, W, H)
        ctx.restore()
      }
      if (isLoaded(vapor) && ringT > 0.004) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, W, H)
        rrSubpath(ctx, jx, jy, jw, jh, jr)
        ctx.clip('evenodd')
        ctx.globalAlpha = ringT
        ctx.drawImage(vapor, 0, 0, W, H)
        ctx.restore()
      }

      // ---- 2. EMPTY UPPER GLASS --------------------------------------------
      // Deliberately nothing: the empty chamber is plain black (like the
      // reference). Drawing any artwork down to the final silhouette here
      // would outline the finished liquid shape before filling begins.

      // ---- 3. VAPOR ARTWORK behind the liquid (slow, gradual build-up) ------
      if (isLoaded(vapor) && vaporRamp > 0.004) {
        ctx.save()
        clipInterior()
        ctx.globalAlpha = vaporRamp
        ctx.drawImage(vapor, 0, 0, W, H)
        ctx.restore()
      }

      // ---- 4. LIQUID BODY ---------------------------------------------------
      // The mercury artwork is clipped to the jar and the region above the
      // animated front is erased with a blurred edge: one image, one frame,
      // no shifted horizontal strips, no box or trapezoid overlay.
      if (isLoaded(mercury) && lctx && liquidVisible) {
        const blurPx = (0.6 + 24 * smooth(consumeT)) * s
        lctx.setTransform(1, 0, 0, 1, 0, 0)
        lctx.globalCompositeOperation = 'source-over'
        lctx.globalAlpha = 1
        lctx.clearRect(0, 0, W, H)
        lctx.save()
        lctx.beginPath()
        rrSubpath(lctx, jx, jy, jw, jh, jr)
        lctx.clip()

        // The photo itself is redrawn every frame in tightly tiled horizontal
        // rows, each row drifting sideways on its own slow phase - this is what
        // makes the mercury body flow like real liquid instead of sitting still
        // as a frozen photo. The offsets vary so smoothly between adjacent rows
        // (sub-pixel per strip) that no seams can appear, and it is still the
        // same photo clipped to the jar: no box, no trapezoid, no stretching.
        const stripH = Math.max(3, Math.round(5 * s))
        const flowAmp = (4.0 + 2.5 * (1 - depthT)) * s
        const nW = mercury.naturalWidth
        const nH = mercury.naturalHeight
        for (let y = 0; y < H; y += stripH) {
          const yc = y + stripH / 2
          const dx = flowAmp * (
            0.55 * Math.sin(yc * 0.011 + t * 0.9 + seed.a) +
            0.6 * Math.sin(yc * 0.027 - t * 1.3 + seed.b) +
            0.4 * Math.sin(yc * 0.052 - t * 2.1 + seed.c)
          )
          lctx.drawImage(
            mercury,
            0, (y / H) * nH, nW, ((stripH + 1) / H) * nH,
            dx, y, W, stripH + 1,
          )
        }
        lctx.globalCompositeOperation = 'destination-out'
        lctx.filter = `blur(${blurPx.toFixed(2)}px)`
        lctx.fillStyle = '#000'
        lctx.beginPath()
        const over = 0.06
        lctx.moveTo(jx - jw * over, jy - 90 * s)
        lctx.lineTo(jx + jw * (1 + over), jy - 90 * s)
        for (let i = SAMPLES; i >= 0; i--) {
          const nx = -over + ((1 + 2 * over) * i) / SAMPLES
          lctx.lineTo(jx + jw * nx, frontAt(nx, 1))
        }
        lctx.closePath()
        lctx.fill()
        lctx.filter = 'none'
        lctx.restore()

        // Living liquid: the whole body drifts and shears sideways a few pixels
        // (a slow slosh), so after the fill finishes the mercury keeps flowing
        // instead of freezing into a still photo. The clip stays in stage space;
        // a slight over-zoom about the jar centre guarantees no gap can open at
        // the glass walls. Disabled while evaporating (the body is being eaten
        // away in place) and under reduced motion.
        const sway = (1 - smooth(consumeT)) * (reducedMotion ? 0 : 1)
        if (sway > 0.01) {
          const cx = jx + jw * 0.5
          const cy = jy + jh * 0.5
          const swayX = Math.sin(t * 0.5 + seed.a) * 1.4 * s * sway
          const shearV = Math.sin(t * 0.42 + seed.c) * 1.4 * s * sway
          const zoomX = 1 + (3.6 * s) / Math.max(1, jw * 0.5)
          const shear = shearV / Math.max(1, jh * 0.5)
          ctx.save()
          clipInterior()
          ctx.transform(
            zoomX, 0,
            shear, 1,
            cx - zoomX * cx - shear * cy + swayX,
            0,
          )
          ctx.drawImage(liquidLayer, 0, 0)
          ctx.restore()
        } else {
          ctx.drawImage(liquidLayer, 0, 0)
        }
      }

      // ---- 5. DISSOLVE EDGE (the vaporising front itself glows) -------------
      // Where the liquid is being consumed the boundary boils into light before
      // the wisps tear away from it - this is what sells "evaporating" rather
      // than "lowering waterline".
      const edgeA = Math.sin(Math.PI * clamp01(consumeT)) * 0.55
      if (edgeA > 0.02 && liquidVisible) {
        ctx.save()
        clipInterior()
        ctx.globalCompositeOperation = 'screen'
        ctx.beginPath()
        for (let i = 0; i <= 72; i++) {
          const nx = i / 72
          const x = jx + jw * nx
          const y = frontAt(nx, 1)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(232,242,255,${(0.4 * edgeA).toFixed(3)})`
        ctx.lineWidth = 3.4 * s
        ctx.shadowColor = 'rgba(226,238,255,0.85)'
        ctx.shadowBlur = 12 * s
        ctx.stroke()
        ctx.strokeStyle = `rgba(255,255,255,${(0.55 * edgeA).toFixed(3)})`
        ctx.lineWidth = 1.1 * s
        ctx.shadowBlur = 5 * s
        ctx.stroke()
        ctx.restore()
      }

      // ---- 6. MENISCUS / SURFACE REFLECTION ---------------------------------
      const sheenAlpha =
        0.5 * streamOpacity +
        0.15 * (1 - streamOpacity) * smooth((fill - 0.7) / 0.3) * (1 - smooth(p / 0.5)) +
        0.34 * transitionMotion

      if (sheenAlpha > 0.012 && liquidVisible && frontMax > jy) {
        ctx.save()
        clipInterior()
        ctx.beginPath()
        for (let i = 0; i <= 64; i++) {
          const nx = i / 64
          const x = jx + jw * nx
          const y = sheenAt(nx)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        // The highlight sweeps slowly across the surface: flowing chrome
        // reflections on a surface that keeps moving after the fill finishes.
        const sweep = 0.15 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.55 + seed.a))
        const sheen = ctx.createLinearGradient(jx, 0, jx + jw, 0)
        sheen.addColorStop(0, 'rgba(255,255,255,0)')
        sheen.addColorStop(Math.max(0.02, sweep - 0.2), `rgba(232,242,252,${(0.55 * sheenAlpha).toFixed(3)})`)
        sheen.addColorStop(clamp01(sweep), `rgba(255,255,255,${(0.95 * sheenAlpha).toFixed(3)})`)
        sheen.addColorStop(Math.min(0.98, sweep + 0.22), `rgba(225,237,249,${(0.5 * sheenAlpha).toFixed(3)})`)
        sheen.addColorStop(1, 'rgba(255,255,255,0)')

        ctx.strokeStyle = sheen
        ctx.lineWidth = 1.25 * s
        ctx.shadowColor = 'rgba(230,240,252,0.3)'
        ctx.shadowBlur = 3.2 * s
        ctx.stroke()
        ctx.restore()
      }

      // ---- 7. FALLING STREAM ending exactly at the current surface ----------
      const streamNx = (streamX - jx) / jw
      const impactY = frontAt(streamNx, 1)

      if (streamOpacity > 0.01 && liquidVisible) {
        const streamStartY = jy + Math.max(4 * s, jh * 0.025)
        const streamEndY = impactY - 1.5 * s

        if (streamEndY > streamStartY + 3 * s) {
          ctx.save()
          clipInterior()
          ctx.globalAlpha = streamOpacity
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          const traceStream = () => {
            ctx.beginPath()
            ctx.moveTo(streamX + Math.sin(t * 1.2) * 0.65 * s, streamStartY)
            ctx.bezierCurveTo(
              streamX - 2.0 * s + Math.sin(t * 1.3) * 0.9 * s,
              streamStartY + (streamEndY - streamStartY) * 0.34,
              streamX + 2.1 * s + Math.sin(t * 1.7) * 1.1 * s,
              streamStartY + (streamEndY - streamStartY) * 0.7,
              streamX,
              streamEndY,
            )
          }

          traceStream()
          ctx.strokeStyle = 'rgba(0,0,0,0.88)'
          ctx.lineWidth = 6.2 * s
          ctx.shadowColor = 'rgba(225,236,249,0.5)'
          ctx.shadowBlur = 4 * s
          ctx.stroke()

          const streamGradient = ctx.createLinearGradient(
            streamX - 3 * s, 0, streamX + 3 * s, 0,
          )
          streamGradient.addColorStop(0, '#2a3038')
          streamGradient.addColorStop(0.22, '#9ca8b5')
          streamGradient.addColorStop(0.46, '#ffffff')
          streamGradient.addColorStop(0.61, '#c0cad6')
          streamGradient.addColorStop(0.8, '#4e5864')
          streamGradient.addColorStop(1, '#181d23')

          traceStream()
          ctx.shadowBlur = 0
          ctx.strokeStyle = streamGradient
          ctx.lineWidth = 3.9 * s
          ctx.stroke()

          traceStream()
          ctx.strokeStyle = 'rgba(255,255,255,0.9)'
          ctx.lineWidth = 0.65 * s
          ctx.stroke()

          // Contact ripple spreading outward from the landing point.
          const ripplePhase = (t * 1.25) % 1
          ctx.globalAlpha = streamOpacity * (1 - ripplePhase) * 0.75
          ctx.beginPath()
          ctx.ellipse(
            streamX,
            impactY + 1.5 * s,
            (5 + ripplePhase * 15) * s,
            (1.5 + ripplePhase * 1.2) * s,
            0, 0, Math.PI * 2,
          )
          ctx.strokeStyle = 'rgba(242,248,255,0.95)'
          ctx.lineWidth = 1.1 * s
          ctx.stroke()
          ctx.restore()
        }
      }

      // ---- 8. SPLASH DROPLETS at the stream's impact point ------------------
      if (streamOpacity > 0.05 && liquidVisible && !reducedMotion) {
        splashCarry += dt * 26
        if (splashCarry > 2) splashCarry = 2
        while (splashCarry >= 1 && droplets.length < 30) {
          splashCarry -= 1
          droplets.push({
            x: streamX + (Math.random() - 0.5) * 7 * s,
            y: impactY - 2 * s,
            vx: (Math.random() - 0.5) * 95 * s,
            vy: -(35 + Math.random() * 85) * s,
            age: 0,
            life: 0.45 + Math.random() * 0.7,
          })
        }
      }

      if (droplets.length) {
        ctx.save()
        clipInterior()
        for (let i = droplets.length - 1; i >= 0; i--) {
          const d = droplets[i]
          d.age += dt
          d.vy += 330 * s * dt // gravity
          d.x += d.vx * dt
          d.y += d.vy * dt

          const surfY = frontAt(clamp01((d.x - jx) / jw), 1)
          if (d.age >= d.life || d.y > surfY + 2 * s || d.x < jx || d.x > jx + jw) {
            droplets.splice(i, 1)
            continue
          }

          const fade = 1 - d.age / d.life
          const r = (0.7 + 1.1 * fade) * s
          ctx.fillStyle = `rgba(255,255,255,${(0.85 * fade * Math.min(1, streamOpacity * 1.4)).toFixed(3)})`
          ctx.beginPath()
          ctx.ellipse(d.x, d.y, r * 0.8, r, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // ---- 9. FLOWING CHROME CURRENTS inside the liquid ---------------------
      const glowPresence = smooth((fill - 0.1) / 0.25) * (1 - smooth((p - 0.9) / 0.1))
      if (isLoaded(mercury) && glowPresence > 0.01 && liquidVisible && !reducedMotion) {
        ctx.save()
        clipInterior()
        // Clip to the liquid body so highlights never spill above the surface.
        traceFront(ctx, 0, 1)
        ctx.lineTo(jx + jw, jarBottomY + 24 * s)
        ctx.lineTo(jx, jarBottomY + 24 * s)
        ctx.closePath()
        ctx.clip()
        ctx.globalCompositeOperation = 'screen'
        for (let k = 0; k < 3; k++) {
          const ph = seed.a + k * 2.1
          const gx = jx + jw * (0.26 + 0.48 * (0.5 + 0.5 * Math.sin(t * (0.21 + 0.09 * k) + ph)))
          const gy = frontAt((gx - jx) / jw, 1) + (55 + 45 * Math.sin(t * (0.31 + 0.07 * k) + ph * 1.7)) * s
          const radius = (105 + 42 * Math.sin(t * 0.27 + ph)) * s
          const alpha = (0.075 + 0.03 * k * 0.4) * glowPresence
          const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius)
          glow.addColorStop(0, `rgba(255,255,255,${alpha.toFixed(3)})`)
          glow.addColorStop(0.45, `rgba(205,222,240,${(alpha * 0.45).toFixed(3)})`)
          glow.addColorStop(1, 'rgba(170,190,215,0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.ellipse(gx, gy, radius, radius * 0.72, 0, 0, Math.PI * 2)
          ctx.fill()
        }

        // Long, slow currents sweeping across the body: wavy specular streaks
        // that stream sideways and undulate, so the settled mercury visibly
        // flows like liquid rather than sitting still.
        for (let k = 0; k < 3; k++) {
          const ph = seed.b + k * 2.3
          const depth = 60 + k * 52
          const yBase =
            frontAt(0.5, 1) + (depth + 16 * Math.sin(t * (0.24 + 0.06 * k) + ph)) * s
          const grad = ctx.createLinearGradient(jx, 0, jx + jw, 0)
          const sweep = 0.5 + 0.5 * Math.sin(t * (0.16 + 0.05 * k) + ph)
          const a = 0.16 * glowPresence
          grad.addColorStop(0, 'rgba(255,255,255,0)')
          grad.addColorStop(clamp01(sweep - 0.28), `rgba(216,231,247,${(a * 0.5).toFixed(3)})`)
          grad.addColorStop(clamp01(sweep), `rgba(255,255,255,${a.toFixed(3)})`)
          grad.addColorStop(clamp01(sweep + 0.3), `rgba(216,231,247,${(a * 0.5).toFixed(3)})`)
          grad.addColorStop(1, 'rgba(255,255,255,0)')

          ctx.beginPath()
          for (let i = 0; i <= 40; i++) {
            const nx = i / 40
            const y =
              yBase +
              9 * s * Math.sin(nx * 7.3 + t * 0.8 + ph) +
              4.5 * s * Math.sin(nx * 14.1 - t * 1.25 + ph * 1.6)
            const x = jx + jw * nx
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.strokeStyle = grad
          ctx.lineWidth = (1.6 + 0.9 * k) * s
          ctx.lineCap = 'round'
          ctx.stroke()
        }
        ctx.restore()
      }

      // ---- 10. LIVING VAPOR: wisps born on the liquid's own surface ---------
      if (!reducedMotion && target === 1 && p > 0.02) {
        emissionCarry += dt * (30 + 120 * smooth(p))
        // Never bank more than two pending wisps: if the particle cap is hit
        // the carry must not accumulate into a later spawn burst.
        if (emissionCarry > 2) emissionCarry = 2
        while (emissionCarry >= 1 && particles.length < 170) {
          emissionCarry -= 1

          // Wisps emerge from the current liquid front (or from the lower
          // chamber once the liquid is gone) - never from arbitrary spots.
          const nx = Math.random()
          const liquidGone = !liquidVisible
          const rawY = liquidGone
            ? jarBottomY - 8 * s - Math.pow(Math.random(), 0.7) * jh * 0.3
            : frontAt(nx, 1) - Math.pow(Math.random(), 1.6) * 70 * s
          const py = Math.min(Math.max(rawY, jy + 14 * s), jarBottomY - 6 * s)
          particles.push({
            x: jx + jw * nx,
            y: py,
            vx: (Math.random() - 0.5) * 26 * s,
            vy: -(55 + Math.random() * 135) * s,
            age: 0,
            life: 2.4 + Math.random() * 2.4,
            size: (16 + Math.random() * 34) * s,
            phase: Math.random() * Math.PI * 2,
            curl: 0.5 + Math.random() * 1.1,
          })
        }
      }

      if (particles.length && p > 0.001) {
        ctx.save()
        clipInterior()
        ctx.globalCompositeOperation = 'screen'

        for (let i = particles.length - 1; i >= 0; i--) {
          const particle = particles[i]
          particle.age += dt
          const lifeRatio = particle.age / particle.life

          if (lifeRatio >= 1 || particle.y < jy - 12 * s) {
            particles.splice(i, 1)
            continue
          }

          particle.x += (
            particle.vx + Math.sin(t * 1.25 + particle.phase) * 10 * s * particle.curl
          ) * dt
          particle.y += particle.vy * dt
          // Wisps accelerate as the warm vapor rises and expands.
          particle.vy *= 1 + Math.min(1, dt * 0.3)
          particle.vx *= 1 - Math.min(1, dt * 0.18)

          const envelope = Math.sin(Math.PI * lifeRatio)
          const alpha = 0.34 * envelope * smooth(p / 0.2)
          const radius = particle.size * (0.8 + lifeRatio * 1.75)
          const haze = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, radius * 1.8,
          )
          haze.addColorStop(0, `rgba(248,252,255,${alpha.toFixed(3)})`)
          haze.addColorStop(0.22, `rgba(227,237,249,${(alpha * 0.8).toFixed(3)})`)
          haze.addColorStop(0.5, `rgba(190,207,229,${(alpha * 0.42).toFixed(3)})`)
          haze.addColorStop(1, 'rgba(160,180,205,0)')

          ctx.fillStyle = haze
          ctx.beginPath()
          ctx.ellipse(
            particle.x,
            particle.y,
            radius,
            radius * (1.35 + 0.35 * particle.curl),
            particle.phase + Math.sin(t * 0.4 + particle.phase) * 0.35,
            0,
            Math.PI * 2,
          )
          ctx.fill()

          // A defined curling filament through the haze: this is what makes the
          // vapor read as swirling ribbons (target stages 4/5) instead of soft
          // blobs. The arc slowly rotates so every wisp keeps twisting.
          const ang = particle.phase + t * 0.6 * particle.curl
          const len = radius * 1.15
          const bend = 1.55 + 0.4 * Math.sin(t * 0.5 + particle.phase)
          ctx.beginPath()
          ctx.moveTo(
            particle.x - Math.cos(ang) * len * 0.5,
            particle.y - Math.sin(ang) * len * 0.5,
          )
          ctx.quadraticCurveTo(
            particle.x + Math.cos(ang + bend) * len * 0.7,
            particle.y + Math.sin(ang + bend) * len * 0.7,
            particle.x + Math.cos(ang + 0.4) * len * 0.55,
            particle.y + Math.sin(ang + 0.4) * len * 0.55,
          )
          ctx.strokeStyle = `rgba(244,249,255,${(alpha * 0.6).toFixed(3)})`
          ctx.lineWidth = Math.max(1, radius * 0.14)
          ctx.lineCap = 'round'
          ctx.stroke()
        }
        ctx.restore()
      } else if (p <= 0.001) {
        particles.length = 0
        emissionCarry = 0
      }

      // ---- 11. SLOW SHIMMER over the finished vapor state --------------------
      // A barely offset screen copy drifts with time so the final developer
      // state stays alive without moving any glass.
      if (isLoaded(vapor) && p > 0.5 && !reducedMotion) {
        ctx.save()
        clipInterior()
        ctx.globalCompositeOperation = 'screen'
        ctx.globalAlpha = 0.13 * smooth((p - 0.5) / 0.5)
        const shimmerX = Math.sin(t * 0.31 + seed.b) * 3.2 * s
        const shimmerY = Math.sin(t * 0.23 + seed.c) * 2.6 * s
        ctx.drawImage(vapor, shimmerX, shimmerY, W, H)
        ctx.restore()
      }
    }

    const start = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(render)
      }
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start()
      else stop()
    })
    intersectionObserver.observe(canvas)
    start()

    return () => {
      disposed = true
      mercury.onload = null
      vapor.onload = null
      mercury.onerror = null
      vapor.onerror = null
      stop()
      particles.length = 0
      droplets.length = 0
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      motionQuery.removeEventListener('change', onMotionChange)
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
            aria-pressed={mode === 'user'}
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
            aria-pressed={mode === 'developer'}
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
          {/* Glass shell, mercury / pool, and vapor are all drawn here, clipped to the jar interior */}
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
                        <line x1="8.5" y1="16" x2="17" y2="16" />
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

