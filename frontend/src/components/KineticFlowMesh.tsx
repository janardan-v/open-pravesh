import { useEffect, useRef, useState, type CSSProperties } from 'react'

export interface MeshStep {
  id: number
  num?: string
  title: string
  endpoint: string
  desc?: string
  description?: string
}

export interface KineticFlowMeshProps {
  className?: string
  activeStage?: number
  onStageSelect?: (stageIndex: number) => void
  steps?: MeshStep[]
}

const COMPACT_BELOW = 860 // wrapper width in px (below this, cards stack cleanly below canvas)
const SHOW_NUMBERS = true // step number in a dark glass window on each node

const DEFAULT_STEPS: MeshStep[] = [
  {
    id: 1,
    num: '01',
    title: 'Client Redirect',
    endpoint: 'GET /login/:clientId',
    desc: 'Client initiates authentication by routing the browser to OpenPravesh with its registered client ID and CSRF state nonce.',
  },
  {
    id: 2,
    num: '02',
    title: 'User Authentication & Consent',
    endpoint: 'POST /login/:clientId',
    desc: 'User verifies credentials directly at OpenPravesh. Client applications never see or store the user password.',
  },
  {
    id: 3,
    num: '03',
    title: 'Authorization Code via Redirect',
    endpoint: '302 → /callback?code=...',
    desc: 'OpenPravesh issues a cryptographic shortCode with a 60-second TTL and redirects the browser back to the registered callback URI.',
  },
  {
    id: 4,
    num: '04',
    title: 'Back-channel Token Exchange',
    endpoint: 'POST /v1/token',
    desc: 'Client backend exchanges the single-use authorization code and confidential client secret directly with OpenPravesh.',
  },
  {
    id: 5,
    num: '05',
    title: 'Signed JWT & JWKS Verification',
    endpoint: 'GET /v1/certs',
    desc: 'Client validates the asymmetric RS256 ID Token and Access Token signature statelessly against cached public keys.',
  },
]

const TAU = Math.PI * 2
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// Gold / Amber accent matching site branding (#FBBF24)
const AMBER_RGB = '251, 191, 36'

interface Layout {
  compact: boolean
  nodeR: number // CSS px
  nodeOff: number // node distance above/below center line
  spread: number // strand wave amplitude
  cardEdge: number // center line -> card edge (CSS px)
  cardW: number
  totalH: number // container height (desktop) or canvas height (compact)
}

function makeLayout(w: number): Layout {
  if (w < COMPACT_BELOW) {
    const isMobile = w <= 480
    return {
      compact: true,
      nodeR: clamp(w * 0.038, 14, 20),
      nodeOff: 20,
      spread: 16,
      cardEdge: 0,
      cardW: w,
      totalH: isMobile ? 120 : 140,
    }
  }

  const colW = w / 5
  const nodeR = clamp(w * 0.021, 22, 27)
  const nodeOff = 34
  const stem = 36
  const cardW = clamp(colW * 0.94, 205, 252)
  const cardEdge = nodeOff + nodeR + stem // e.g. 34 + 24 + 36 = 94px
  const reserve = 175 // vertical headroom for tallest card (~155px + padding)
  return {
    compact: false,
    nodeR,
    nodeOff,
    spread: 28,
    cardEdge,
    cardW,
    totalH: 2 * (cardEdge + reserve), // ~538px
  }
}

interface StageNode {
  id: number
  x: number
  y: number
  r: number
  dir: number // -1 = up, +1 = down
}

interface Bead {
  x: number
  y: number
  r: number
  big: boolean
}

interface StrandPoint {
  x: number
  y: number
  w: number
}

export function KineticFlowMesh({
  className,
  activeStage = 1,
  onStageSelect,
  steps = DEFAULT_STEPS,
}: KineticFlowMeshProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [wrapW, setWrapW] = useState(1200)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const layout = makeLayout(wrapW)

  const layoutRef = useRef(layout)
  const idsRef = useRef<number[]>(steps.map((s) => s.id))
  const activeRef = useRef(activeStage)
  const selectRef = useRef(onStageSelect)
  const hoveredRef = useRef<number | null>(hoveredId)

  layoutRef.current = layout
  idsRef.current = steps.map((s) => s.id)
  activeRef.current = activeStage
  selectRef.current = onStageSelect
  hoveredRef.current = hoveredId

  // Track wrapper element width
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setWrapW(Math.round(entry.contentRect.width))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Canvas animation and rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.floor(rect.width * dpr)
      height = Math.floor(rect.height * dpr)
      if (width === 0 || height === 0) return
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }

    handleResize()
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(canvas)

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let prefersReducedMotion = motionQuery.matches
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches
    }
    motionQuery.addEventListener('change', handleMotionChange)

    let isVisible = true
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    })
    intersectionObserver.observe(canvas)

    let animationFrameId = 0
    const startTime = performance.now()

    const getElapsedTime = () => {
      if (prefersReducedMotion) return 1.0
      return (performance.now() - startTime) / 1000
    }

    /* ---------------------------- geometry ---------------------------- */

    const getGeometry = (t: number) => {
      const L = layoutRef.current
      const ids = idsRef.current
      const count = ids.length
      const m = prefersReducedMotion ? 0 : 1

      const cy = height * 0.5
      const baseR = L.nodeR * dpr
      const nodeOff = L.nodeOff * dpr
      const spreadAmp = L.spread * dpr
      const tubeW = clamp(width * 0.0105, 6 * dpr, 14 * dpr)

      // Nodes sit at the exact horizontal centers of each equal column
      const nodeX = ids.map((_, i) => (width * (i + 0.5)) / count)
      const nodeY = nodeX.map(
        (_, i) =>
          cy + (i % 2 === 0 ? -1 : 1) * nodeOff + Math.sin(t * 1.1 + i * 1.6) * (2.2 * dpr) * m
      )

      const stageNodes: StageNode[] = ids.map((id, i) => ({
        id,
        dir: i % 2 === 0 ? -1 : 1,
        x: nodeX[i],
        y: nodeY[i],
        r: baseR,
      }))

      const xs = [0, ...nodeX, width]
      const ys = [cy, ...nodeY, cy]

      const segmentAt = (x: number) => {
        let k = 0
        while (k < xs.length - 2 && x > xs[k + 1]) k++
        const span = Math.max(1, xs[k + 1] - xs[k])
        return { k, u: clamp((x - xs[k]) / span, 0, 1) }
      }

      // Spine passes smoothly through every node
      const spine = (x: number) => {
        const { k, u } = segmentAt(x)
        const s = u * u * (3 - 2 * u)
        return ys[k] + (ys[k + 1] - ys[k]) * s
      }

      // Strands split between nodes and wave with subtle organic caustics
      const spread = (x: number) => {
        const { k, u } = segmentAt(x)
        const isEdge = k === 0 || k === xs.length - 2
        const amp = spreadAmp * (isEdge ? 0.6 : 1.0) * (1 + 0.18 * Math.sin(t * 1.2 + k * 1.5) * m)
        return (k % 2 === 0 ? 1 : -1) * amp * Math.sin(u * Math.PI)
      }

      const strandA = (x: number) => spine(x) + spread(x)
      const strandB = (x: number) => spine(x) - spread(x)

      // Tube width swells organically as it joins each node
      const widthAt = (x: number) => {
        let swell = 0
        for (const nx of nodeX) {
          const d = (x - nx) / (baseR * 1.3)
          swell += Math.exp(-d * d)
        }
        return tubeW * (1 + 0.75 * Math.min(swell, 1))
      }

      // Decorative liquid beads floating on strands
      const beads: Bead[] = []
      for (let k = 1; k < count; k++) {
        const span = xs[k + 1] - xs[k]
        const uA = 0.5 + 0.07 * Math.sin(t * 0.8 + k * 1.9) * m
        const uB = 0.5 + 0.07 * Math.sin(t * 0.7 + k * 2.6 + 1) * m
        const xa = xs[k] + span * uA
        const xb = xs[k] + span * uB
        beads.push({ x: xa, y: strandA(xa), r: baseR * 0.25, big: false })
        beads.push({ x: xb, y: strandB(xb), r: baseR * 0.42, big: true })
      }

      return { cy, tubeW, stageNodes, beads, strandA, strandB, widthAt }
    }

    /* ---------------------------- interaction --------------------------- */

    const findHitNode = (clientX: number, clientY: number, hitFactor: number) => {
      const rect = canvas.getBoundingClientRect()
      const px = (clientX - rect.left) * dpr
      const py = (clientY - rect.top) * dpr
      const { stageNodes } = getGeometry(getElapsedTime())
      for (const n of stageNodes) {
        if (Math.hypot(px - n.x, py - n.y) <= Math.max(n.r * hitFactor, 24 * dpr)) return n
      }
      return null
    }

    const handlePointerMove = (e: PointerEvent) => {
      const hit = findHitNode(e.clientX, e.clientY, 1.4)
      const id = hit ? hit.id : null
      canvas.style.cursor = hit ? 'pointer' : 'default'
      if (id !== hoveredRef.current) setHoveredId(id)
    }

    const handlePointerDown = (e: PointerEvent) => {
      const hit = findHitNode(e.clientX, e.clientY, 1.8)
      if (hit) selectRef.current?.(hit.id)
    }

    const handlePointerLeave = () => {
      canvas.style.cursor = 'default'
      if (hoveredRef.current !== null) setHoveredId(null)
    }

    canvas.addEventListener('pointermove', handlePointerMove, { passive: true })
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointerleave', handlePointerLeave)

    /* ------------------------------ drawing ----------------------------- */

    const sampleStrand = (fn: (x: number) => number, wFn: (x: number) => number) => {
      const pts: StrandPoint[] = []
      const step = Math.max(6 * dpr, width / 120)
      for (let x = 0; ; x += step) {
        const xx = Math.min(x, width)
        pts.push({ x: xx, y: fn(xx), w: wFn(xx) })
        if (xx >= width) break
      }
      return pts
    }

    // Glassy liquid-chrome tube with variable thickness layers
    const TUBE_LAYERS = [
      { k: 1.3, off: 0, color: '#05080F' }, // dark outer rim
      { k: 1.04, off: 0, color: '#2E3848' }, // steel body
      { k: 0.78, off: 0, color: '#AEBBCC' }, // liquid silver
      { k: 0.5, off: -0.1, color: '#EAF0F8' }, // bright specular highlight
      { k: 0.2, off: -0.22, color: '#FFFFFF' }, // razor specular core
      { k: 0.12, off: 0.3, color: '#64748B' }, // bounce light underneath
    ]

    const drawTube = (pts: StrandPoint[], scale = 1) => {
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const bloom = new Path2D()
      bloom.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) bloom.lineTo(pts[i].x, pts[i].y)
      ctx.strokeStyle = 'rgba(190, 210, 240, 0.06)'
      ctx.lineWidth = pts[0].w * scale * 2.8
      ctx.stroke(bloom)

      for (const layer of TUBE_LAYERS) {
        ctx.strokeStyle = layer.color
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i]
          const b = pts[i + 1]
          ctx.lineWidth = ((a.w + b.w) / 2) * scale * layer.k
          ctx.beginPath()
          ctx.moveTo(a.x, a.y + layer.off * a.w * scale)
          ctx.lineTo(b.x, b.y + layer.off * b.w * scale)
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    interface SphereOpts {
      seed: number
      t: number
      tint?: string
      rim?: string
      rimW?: number
    }

    // Glossy liquid chrome sphere
    const drawSphere = (x: number, y: number, r: number, o: SphereOpts) => {
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      ctx.clip()

      const h = 0.52 + Math.sin(o.t * 0.7 + o.seed) * 0.03
      const env = ctx.createLinearGradient(0, y - r, 0, y + r)
      env.addColorStop(0, '#FFFFFF')
      env.addColorStop(0.2, '#E3EAF3')
      env.addColorStop(0.38, '#8E9BAE')
      env.addColorStop(h - 0.05, '#2A3342')
      env.addColorStop(h, '#06080F')
      env.addColorStop(h + 0.07, '#5E6D84')
      env.addColorStop(0.82, '#D9E1EC')
      env.addColorStop(1, '#8FA0B5')
      ctx.fillStyle = env
      ctx.fillRect(x - r, y - r, r * 2, r * 2)

      const vig = ctx.createRadialGradient(x, y, r * 0.55, x, y, r)
      vig.addColorStop(0, 'rgba(2, 6, 15, 0)')
      vig.addColorStop(1, 'rgba(2, 6, 15, 0.55)')
      ctx.fillStyle = vig
      ctx.fillRect(x - r, y - r, r * 2, r * 2)

      if (o.tint) {
        const core = ctx.createRadialGradient(x, y, 0, x, y, r * 0.95)
        core.addColorStop(0, o.tint)
        core.addColorStop(1, 'rgba(251, 191, 36, 0)')
        ctx.fillStyle = core
        ctx.fillRect(x - r, y - r, r * 2, r * 2)
      }
      ctx.restore()

      // Specular highlights and bounce-light arc
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.beginPath()
      ctx.ellipse(x - r * 0.3, y - r * 0.42, r * 0.34, r * 0.16, -0.5, 0, TAU)
      ctx.fill()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.beginPath()
      ctx.arc(x + r * 0.42, y + r * 0.5, r * 0.07, 0, TAU)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, r * 0.86, Math.PI * 0.62, Math.PI * 0.95)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)'
      ctx.lineWidth = Math.max(1, r * 0.06)
      ctx.lineCap = 'round'
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(x, y, r, 0, TAU)
      ctx.strokeStyle = o.rim ?? 'rgba(226, 232, 240, 0.6)'
      ctx.lineWidth = (o.rimW ?? 1.2) * dpr
      ctx.stroke()
    }

    const drawBead = (b: Bead, t: number, idx: number) => {
      if (b.big) {
        const glow = ctx.createRadialGradient(b.x, b.y, b.r * 0.4, b.x, b.y, b.r * 3)
        glow.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
        glow.addColorStop(0.5, `rgba(${AMBER_RGB}, 0.15)`)
        glow.addColorStop(1, `rgba(${AMBER_RGB}, 0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r * 3, 0, TAU)
        ctx.fill()
      }
      drawSphere(b.x, b.y, b.r, { seed: 10 + idx, t, rimW: 0.8 })
    }

    // Chrome stem joining a node vertically to the edge of its attached card
    const drawVerticalStem = (n: StageNode, t: number, cardEdgeY: number, stemW: number) => {
      const active = activeRef.current === n.id
      const hot = hoveredRef.current === n.id
      const startY = n.y + n.dir * n.r * 0.88
      const y1 = Math.min(startY, cardEdgeY)
      const y2 = Math.max(startY, cardEdgeY)
      const x = n.x

      // Glow behind stem when active or hovered
      if (active || hot) {
        ctx.save()
        ctx.lineCap = 'round'
        ctx.strokeStyle = active ? `rgba(${AMBER_RGB}, 0.5)` : 'rgba(255, 255, 255, 0.28)'
        ctx.lineWidth = stemW * 2.4
        ctx.beginPath()
        ctx.moveTo(x, y1)
        ctx.lineTo(x, y2)
        ctx.stroke()
        ctx.restore()
      }

      // Chrome cylinder shaded across X axis
      ctx.save()
      ctx.lineCap = 'round'
      for (const layer of TUBE_LAYERS) {
        ctx.strokeStyle = active && layer.color === '#AEBBCC' ? `rgba(${AMBER_RGB}, 0.85)` : layer.color
        ctx.lineWidth = stemW * layer.k * 0.8
        ctx.beginPath()
        const xOff = layer.off * stemW
        ctx.moveTo(x + xOff, y1)
        ctx.lineTo(x + xOff, y2)
        ctx.stroke()
      }
      ctx.restore()

      // Metallic spherical joint pin mounting to the card edge
      drawSphere(x, cardEdgeY, 4.8 * dpr, {
        seed: n.id * 3.1,
        t,
        tint: active ? `rgba(${AMBER_RGB}, 0.7)` : undefined,
        rim: active ? '#FBBF24' : '#FFFFFF',
        rimW: active ? 1.6 : 0.9,
      })

      // Expanding halo around joint pin when active
      if (active) {
        const pinGlow = ctx.createRadialGradient(x, cardEdgeY, 0, x, cardEdgeY, 14 * dpr)
        pinGlow.addColorStop(0, `rgba(${AMBER_RGB}, 0.55)`)
        pinGlow.addColorStop(0.5, `rgba(${AMBER_RGB}, 0.2)`)
        pinGlow.addColorStop(1, `rgba(${AMBER_RGB}, 0)`)
        ctx.fillStyle = pinGlow
        ctx.beginPath()
        ctx.arc(x, cardEdgeY, 14 * dpr, 0, TAU)
        ctx.fill()
      }
    }

    const drawStageNode = (node: StageNode, t: number) => {
      const isActive = activeRef.current === node.id
      const isHovered = hoveredRef.current === node.id
      const scale = isActive ? 1.15 : isHovered ? 1.08 : 1.0
      const r = node.r * scale
      const { x, y } = node

      // Contact shadow underneath
      const shadow = ctx.createRadialGradient(x, y + 4 * dpr, r * 0.5, x, y + 6 * dpr, r * 1.35)
      shadow.addColorStop(0, 'rgba(0, 0, 0, 0.65)')
      shadow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = shadow
      ctx.beginPath()
      ctx.arc(x, y + 5 * dpr, r * 1.35, 0, TAU)
      ctx.fill()

      // Ambient chrome bloom
      const bloom = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 2.2)
      bloom.addColorStop(0, 'rgba(210, 225, 245, 0.16)')
      bloom.addColorStop(1, 'rgba(210, 225, 245, 0)')
      ctx.fillStyle = bloom
      ctx.beginPath()
      ctx.arc(x, y, r * 2.2, 0, TAU)
      ctx.fill()

      if (isActive) {
        // Expanding gold ripple pulse
        const pulse = (t * 1.5) % 1.0
        ctx.beginPath()
        ctx.arc(x, y, r * (1.15 + 0.45 * pulse), 0, TAU)
        ctx.strokeStyle = `rgba(${AMBER_RGB}, ${0.6 * (1 - pulse)})`
        ctx.lineWidth = 2 * dpr
        ctx.stroke()

        const aura = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.5)
        aura.addColorStop(0, `rgba(${AMBER_RGB}, 0.38)`)
        aura.addColorStop(0.5, `rgba(${AMBER_RGB}, 0.14)`)
        aura.addColorStop(1, `rgba(${AMBER_RGB}, 0)`)
        ctx.fillStyle = aura
        ctx.beginPath()
        ctx.arc(x, y, r * 2.5, 0, TAU)
        ctx.fill()
      } else if (isHovered) {
        const hoverAura = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 2.0)
        hoverAura.addColorStop(0, 'rgba(255, 255, 255, 0.28)')
        hoverAura.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = hoverAura
        ctx.beginPath()
        ctx.arc(x, y, r * 2.0, 0, TAU)
        ctx.fill()
      }

      drawSphere(x, y, r, {
        seed: node.id * 1.7,
        t,
        tint: isActive ? `rgba(${AMBER_RGB}, 0.5)` : undefined,
        rim: isActive ? '#FBBF24' : isHovered ? '#FFFFFF' : '#CBD5E1',
        rimW: isActive ? 2.2 : 1.2,
      })

      if (SHOW_NUMBERS) {
        const wr = r * 0.52
        const win = ctx.createRadialGradient(x, y - wr * 0.3, 0, x, y, wr)
        win.addColorStop(0, isActive ? 'rgba(30, 24, 10, 0.95)' : 'rgba(30, 38, 52, 0.92)')
        win.addColorStop(1, isActive ? 'rgba(12, 10, 4, 0.98)' : 'rgba(5, 8, 14, 0.96)')
        ctx.fillStyle = win
        ctx.beginPath()
        ctx.arc(x, y, wr, 0, TAU)
        ctx.fill()
        ctx.strokeStyle = isActive ? '#FBBF24' : 'rgba(226, 232, 240, 0.4)'
        ctx.lineWidth = (isActive ? 1.4 : 1) * dpr
        ctx.stroke()

        const fontSize = clamp(wr * 0.95, 8 * dpr, 13 * dpr)
        ctx.font = `700 ${fontSize}px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = isActive ? '#FBBF24' : '#E2E8F0'
        ctx.fillText(String(node.id).padStart(2, '0'), x, y + 0.5 * dpr)
      }
    }

    const drawPacket = (x: number, y: number) => {
      const pr = 10 * dpr
      const g = ctx.createRadialGradient(x, y, 0, x, y, pr)
      g.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
      g.addColorStop(0.35, `rgba(${AMBER_RGB}, 0.5)`)
      g.addColorStop(1, `rgba(${AMBER_RGB}, 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, pr, 0, TAU)
      ctx.fill()
    }

    /* ---------------------------- render loop --------------------------- */

    const render = () => {
      if (!isVisible || width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(render)
        return
      }

      ctx.clearRect(0, 0, width, height)

      const t = getElapsedTime()
      const L = layoutRef.current
      const geom = getGeometry(t)

      // 1. Engineering grid with soft radial vignette
      ctx.save()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 1 * dpr
      const gs = 38 * dpr
      ctx.beginPath()
      for (let gx = 0; gx <= width; gx += gs) {
        ctx.moveTo(gx, 0)
        ctx.lineTo(gx, height)
      }
      for (let gy = 0; gy <= height; gy += gs) {
        ctx.moveTo(0, gy)
        ctx.lineTo(width, gy)
      }
      ctx.stroke()

      ctx.globalCompositeOperation = 'destination-in'
      const mask = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width * 0.55
      )
      mask.addColorStop(0, 'rgba(0, 0, 0, 1)')
      mask.addColorStop(0.65, 'rgba(0, 0, 0, 0.75)')
      mask.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = mask
      ctx.fillRect(0, 0, width, height)
      ctx.restore()

      // 2. Stems tying each node to its card (desktop only)
      if (!L.compact) {
        const edge = L.cardEdge * dpr
        geom.stageNodes.forEach((n) =>
          drawVerticalStem(n, t, geom.cy + n.dir * edge, geom.tubeW * 0.45)
        )
      }

      // 3. The braided liquid-chrome strands
      drawTube(sampleStrand(geom.strandB, geom.widthAt), 0.9)
      drawTube(sampleStrand(geom.strandA, geom.widthAt), 1)

      // 4. Decorative beads on the strands
      geom.beads.forEach((b, i) => drawBead(b, t, i))

      // 5. Light packets
      if (!prefersReducedMotion) {
        for (let p = 0; p < 3; p++) {
          const xa = ((t * 0.075 + p / 3) % 1) * width
          drawPacket(xa, geom.strandA(xa))
          const xb = (1 - ((t * 0.065 + p / 3 + 0.16) % 1)) * width
          drawPacket(xb, geom.strandB(xb))
        }
      }

      // 6. The five stage nodes
      geom.stageNodes.forEach((n) => drawStageNode(n, t))

      // 7. Left/right horizon fade
      ctx.save()
      ctx.globalCompositeOperation = 'destination-in'
      const fade = ctx.createLinearGradient(0, 0, width, 0)
      fade.addColorStop(0, 'rgba(0, 0, 0, 0)')
      fade.addColorStop(0.04, 'rgba(0, 0, 0, 1)')
      fade.addColorStop(0.96, 'rgba(0, 0, 0, 1)')
      fade.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = fade
      ctx.fillRect(0, 0, width, height)
      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      motionQuery.removeEventListener('change', handleMotionChange)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [])

  /* ------------------------------- cards ------------------------------ */

  const renderCard = (step: MeshStep, index: number, wrapperStyle?: CSSProperties) => {
    const active = activeStage === step.id
    const hot = hoveredId === step.id
    const numStr = step.num || String(index + 1).padStart(2, '0')
    const desc = step.desc || step.description || ''

    return (
      <div
        key={step.id}
        style={wrapperStyle}
        onMouseEnter={() => setHoveredId(step.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <button
          type="button"
          aria-pressed={active}
          onClick={() => onStageSelect?.(step.id)}
          className={`merc-node-card ${active ? 'active' : ''} ${hot ? 'hot' : ''}`}
        >
          <div className="merc-node-card-head">
            <span className="merc-node-card-num">{numStr}</span>
            <span className="merc-node-card-arrow" aria-hidden="true">→</span>
          </div>
          <div className="merc-node-card-title">{step.title}</div>
          <code className="merc-node-card-endpoint">{step.endpoint}</code>
          <p className="merc-node-card-desc">{desc}</p>
        </button>
      </div>
    )
  }

  const canvasStyle: CSSProperties = layout.compact
    ? {
        position: 'relative',
        display: 'block',
        width: '100%',
        height: layout.totalH,
        touchAction: 'pan-y',
      }
    : {
        position: 'absolute',
        inset: 0,
        display: 'block',
        width: '100%',
        height: '100%',
        touchAction: 'pan-y',
      }

  return (
    <div
      ref={rootRef}
      className={`merc-flow-mesh-root ${className || ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: layout.compact ? undefined : layout.totalH,
      }}
    >
      <canvas
        ref={canvasRef}
        style={canvasStyle}
        aria-label="Interactive OpenID Connect Flow Mesh"
        role="region"
      />

      {layout.compact ? (
        <div className="merc-node-card-stack">
          {steps.map((s, i) => renderCard(s, i))}
        </div>
      ) : (
        steps.map((s, i) => {
          const up = i % 2 === 0
          const centerX = (wrapW * (i + 0.5)) / steps.length
          const left = clamp(centerX - layout.cardW / 2, 4, wrapW - layout.cardW - 4)
          return renderCard(s, i, {
            position: 'absolute',
            zIndex: activeStage === s.id ? 10 : 2,
            left,
            width: layout.cardW,
            ...(up
              ? { bottom: `calc(50% + ${layout.cardEdge}px)` }
              : { top: `calc(50% + ${layout.cardEdge}px)` }),
          })
        })
      )}
    </div>
  )
}
