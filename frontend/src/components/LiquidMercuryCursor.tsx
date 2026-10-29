import { useEffect, useRef } from 'react'

/**
 * Liquid mercury cursor (v5) - silver glass-mercury drop
 *
 * Reference behaviour:
 *  - Move fast  : fat teardrop head, short thin ribbon, leaf tip, glass droplets,
 *                 long curving smoke wisp behind.
 *  - Change dir : the whole body (ribbon, droplets, wisp) follows the travelled
 *                 path, so it bends into S / U shapes.
 *  - Settle     : tail is reabsorbed, head rings, rests as a glossy sphere.
 *
 * Props:
 *  scale - overall size multiplier (1 = 20px radius drop)
 */

interface Pt {
  x: number
  y: number
}

const NUM = 24

const VS_SOURCE = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FS_SOURCE = `
precision highp float;

#define NUM ${NUM}

uniform vec2  u_res;
uniform float u_dpr;
uniform vec2  u_spine[NUM];
uniform float u_radii[NUM];
uniform float u_tan[NUM];     // radius tangents (smooth cubic taper)
uniform vec3  u_sat[2];        // xy = position, z = radius (device px)
uniform vec2  u_wisp[5];       // polyline of the smoke wisp
uniform float u_wisp_a;
uniform float u_wob;
uniform float u_wob_ang;
uniform float u_alpha;

// Fluid distance field. x = signed distance, y = local radius (dome shading)
vec2 mapSDF(vec2 p) {
  vec2 acc = vec2(1e5, u_radii[0]);
  float k = 2.2 * u_dpr;

  for (int i = 0; i < NUM - 1; i++) {
    vec2 a = u_spine[i];
    vec2 b = u_spine[i + 1];
    float r1 = u_radii[i];
    float r2 = u_radii[i + 1];
    float m1 = u_tan[i];
    float m2 = u_tan[i + 1];

    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / (dot(ba, ba) + 1e-4), 0.0, 1.0);
    float h2 = h * h;
    float h3 = h2 * h;
    // cubic Hermite taper: no per-segment tilt steps => no ridges on the ribbon
    float r = (2.0 * h3 - 3.0 * h2 + 1.0) * r1 + (h3 - 2.0 * h2 + h) * m1
            + (-2.0 * h3 + 3.0 * h2) * r2 + (h3 - h2) * m2;
    float d = length(pa - ba * h) - r;

    float m = clamp(0.5 + 0.5 * (d - acc.x) / k, 0.0, 1.0);
    acc.x = mix(d, acc.x, m) - k * m * (1.0 - m);
    acc.y = mix(r, acc.y, m);
  }

  for (int i = 0; i < 2; i++) {
    vec3 s = u_sat[i];
    if (s.z > 0.05) {
      float d = length(p - s.xy) - s.z;
      float ks = 0.9 * u_dpr;
      float m = clamp(0.5 + 0.5 * (d - acc.x) / ks, 0.0, 1.0);
      acc.x = mix(d, acc.x, m) - ks * m * (1.0 - m);
      acc.y = mix(s.z, acc.y, m);
    }
  }

  if (abs(u_wob) > 0.001) {
    vec2 dp = p - u_spine[0];
    float theta = atan(dp.y, dp.x + 1e-5);
    float w = u_wob * cos(2.0 * (theta - u_wob_ang)) * u_radii[0] * 0.30;
    float headW = clamp(1.0 - length(dp) / (u_radii[0] * 2.4), 0.0, 1.0);
    acc.x -= w * headW;
  }

  return acc;
}

// Bright neutral studio so the drop reads as silver mercury, not black:
// grey dome, big soft top-left box, silver left fill, one dark reflection
// patch and a bright streak low on the body. relR = local radius / head radius.
vec3 envMap(vec3 r, float relR) {
  float up = clamp(-r.y * 0.5 + 0.5, 0.0, 1.0);
  float base = 0.09 + 0.30 * up * up + 0.12 * up;
  vec3 c = vec3(base * 0.97, base, base * 1.03);

  c += vec3(0.62, 0.63, 0.66) * pow(max(dot(r, normalize(vec3(-0.95, 0.12, 0.35))), 0.0), 2.0) * 0.55;

  vec3 D = normalize(vec3(-0.30, -0.55, 0.78));
  vec3 U = normalize(vec3(0.88, -0.32, 0.34));
  vec3 V = cross(D, U);
  float al = dot(r, D);
  if (al > 0.0) {
    float du = max(abs(dot(r, U)) - 0.30, 0.0);
    float dv = max(abs(dot(r, V)) - 0.18, 0.0);
    c += vec3(1.0) * exp(-(du * du * 16.0 + dv * dv * 22.0)) * smoothstep(0.0, 0.25, al) * 2.6;
  }

  float big = smoothstep(0.35, 0.75, relR);

  // dark reflection patch (head only; the ribbon stays bright)
  float tp = (r.y - 0.16) / 0.17;
  float darkPatch = exp(-tp * tp) * smoothstep(-0.6, 0.2, r.z) * smoothstep(-0.8, 0.0, r.x) * big;
  c *= 1.0 - 0.9 * darkPatch;

  // bright streak
  float ts = (r.y - 0.50) / 0.10;
  float st = exp(-ts * ts) * 1.25 * smoothstep(-0.2, 0.5, r.z) * smoothstep(-0.97, -0.15, r.x)
           * (0.35 + 0.65 * big);
  c += vec3(0.97, 0.98, 1.0) * st;

  c += vec3(1.0) * pow(max(al, 0.0), 160.0) * 2.5;
  return c;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  float px = u_dpr;

  vec2 m = mapSDF(p);
  float d = m.x;
  float rL = max(m.y, 1.4 * px);

  vec4 col = vec4(0.0);

  // tight contact shadow + faint cool halo
  if (d > 0.0) {
    float dd = d / px;
    float sh = smoothstep(4.0, 0.0, dd) * 0.14;
    float ha = exp(-dd / 5.0) * 0.05;
    col.a = (sh + ha) * u_alpha;
    col.rgb = vec3(0.78, 0.84, 0.95) * (ha / (sh + ha + 1e-4));
  }

  // curving smoke wisp (polyline)
  if (u_wisp_a > 0.01) {
    float best = 1e5;
    float bt = 0.0;
    for (int i = 0; i < 4; i++) {
      vec2 a = u_wisp[i];
      vec2 b = u_wisp[i + 1];
      vec2 pa = p - a;
      vec2 ba = b - a;
      float h = clamp(dot(pa, ba) / (dot(ba, ba) + 1e-4), 0.0, 1.0);
      float dd = length(pa - ba * h);
      if (dd < best) {
        best = dd;
        bt = (float(i) + h) / 4.0;
      }
    }
    float sig = (0.55 + 0.9 * (1.0 - bt)) * px;
    float core = exp(-best * best / (2.0 * sig * sig));
    float hz = 3.5 * px;
    float haze = exp(-best * best / (2.0 * hz * hz)) * 0.22;
    float fade = pow(1.0 - bt, 1.6) * smoothstep(0.0, 0.12, bt);
    float wv = u_wisp_a * fade * (core + haze) * 0.5 * u_alpha;
    col.rgb = mix(col.rgb, vec3(0.88, 0.91, 0.97), wv / (wv + col.a + 1e-4));
    col.a = col.a + wv * (1.0 - col.a);
  }

  if (d <= 1.0 * px) {
    float eps = 1.2;
    float dx = mapSDF(p + vec2(eps, 0.0)).x - mapSDF(p - vec2(eps, 0.0)).x;
    float dy = mapSDF(p + vec2(0.0, eps)).x - mapSDF(p - vec2(0.0, eps)).x;
    vec2 g = normalize(vec2(dx, dy) + vec2(1e-5));

    float s = clamp(1.0 + d / rL, 0.0, 1.0);
    float z = sqrt(max(0.0, 1.0 - s * s));
    vec3 n = normalize(vec3(g * s, z));

    float relR = rL / max(u_radii[0], 1.0);
    vec3 refl = reflect(vec3(0.0, 0.0, -1.0), n);
    vec3 body = envMap(refl, relR);

    // silver gradient toward the silhouette
    float edgeF = pow(1.0 - max(0.0, n.z), 2.0);
    body += vec3(0.33, 0.34, 0.37) * edgeF * 0.6;

    // thin ribbon catches more light
    float thin = 1.0 - smoothstep(0.08, 0.25, relR);
    body += vec3(0.22, 0.23, 0.25) * thin * 0.8;

    // filmic curve
    body = 1.0 - exp(-body * 1.6);

    // crisp bright rim, strongest on the lit (top-left) side
    float depth = -d / px;
    float rimLine = exp(-depth * depth / (2.0 * 0.85 * 0.85));
    float lit = clamp(dot(g, normalize(vec2(-0.6, -0.8))) * 0.5 + 0.5, 0.0, 1.0);
    float rimAmt = rimLine * (0.5 + 0.5 * lit);
    body = mix(body, vec3(0.90, 0.92, 0.95), rimAmt * 0.85);

    // slightly translucent on thin parts (droplets, ribbon)
    float glass = mix(0.78, 0.98, smoothstep(3.0, 9.0, rL / px));
    float bodyA = max(glass, rimAmt);

    float a = smoothstep(0.8 * px, -0.8 * px, d) * u_alpha * bodyA;
    col.rgb = mix(col.rgb, body, a);
    col.a = max(col.a, a);
  }

  gl_FragColor = col;
}
`

export function LiquidMercuryCursor({ scale = 1 }: { scale?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    const canHover = window.matchMedia('(hover: hover)').matches
    if (prefersReducedMotion || !isFinePointer || !canHover) return

    const canvas = canvasRef.current
    if (!canvas) return

    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      powerPreference: 'low-power',
    })
    if (!gl) return

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)
      if (!s) return null
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Cursor shader error:', gl.getShaderInfoLog(s))
        gl.deleteShader(s)
        return null
      }
      return s
    }

    const vs = createShader(gl.VERTEX_SHADER, VS_SOURCE)
    const fs = createShader(gl.FRAGMENT_SHADER, FS_SOURCE)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    if (!prog) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Cursor program error:', gl.getProgramInfoLog(prog))
      return
    }
    gl.useProgram(prog)

    const quadBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )
    const posLoc = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uDpr = gl.getUniformLocation(prog, 'u_dpr')
    const uSpine = gl.getUniformLocation(prog, 'u_spine')
    const uRadii = gl.getUniformLocation(prog, 'u_radii')
    const uTan = gl.getUniformLocation(prog, 'u_tan')
    const uSat = gl.getUniformLocation(prog, 'u_sat')
    const uWisp = gl.getUniformLocation(prog, 'u_wisp')
    const uWispA = gl.getUniformLocation(prog, 'u_wisp_a')
    const uWob = gl.getUniformLocation(prog, 'u_wob')
    const uWobAng = gl.getUniformLocation(prog, 'u_wob_ang')
    const uAlpha = gl.getUniformLocation(prog, 'u_alpha')

    const spineBuf = new Float32Array(NUM * 2)
    const radiiBuf = new Float32Array(NUM)
    const tanBuf = new Float32Array(NUM)
    const satBuf = new Float32Array(6)
    const wispBuf = new Float32Array(10)

    // ---- tunables (all proportions are in head-radius units, like the reference) ----
    const R = 14 * scale // resting sphere radius (css px)
    const MAX_TAIL = 5.6 * R // head centre -> leaf tip
    const RIBBON_R = 0.19 * R // neck half-thickness
    const MAX_ARC = 14 * R // pointer path kept for the body, droplets and wisp

    let hasMoved = false
    let isInsideWindow = true
    let globalAlpha = 0

    let targetX = 0
    let targetY = 0
    let lastTX = 0
    let lastTY = 0
    const head: Pt = { x: 0, y: 0 }

    const history: Pt[] = []
    const nodes: Pt[] = Array.from({ length: NUM }, () => ({ x: 0, y: 0 }))
    const disp: Pt[] = Array.from({ length: NUM }, () => ({ x: 0, y: 0 }))
    const uParam: number[] = Array.from({ length: NUM }, (_, i) => Math.pow(i / (NUM - 1), 1.5))
    const wisp: Pt[] = Array.from({ length: 5 }, () => ({ x: 0, y: 0 }))

    let tailLen = 0
    let speed = 0
    let moveAng = 0
    let dirX = 1
    let dirY = 0
    let offX = 0
    let offY = 0

    const sats = [
      { x: 0, y: 0, vx: 0, vy: 0, r: 0.33 * R },
      { x: 0, y: 0, vx: 0, vy: 0, r: 0.17 * R },
    ]
    let satScale = 0

    let wob = 0
    let wobV = 0

    let prevBox: { x0: number; y0: number; x1: number; y1: number } | null = null

    let lastTime = performance.now()
    let raf = 0
    let running = false
    let stillFrames = 0

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      prevBox = null
    }

    const pushPoint = (x: number, y: number) => {
      const h0 = history[0]
      if (h0 && Math.hypot(x - h0.x, y - h0.y) < 1.2) return
      history.unshift({ x, y })
      let acc = 0
      for (let i = 1; i < history.length; i++) {
        acc += Math.hypot(history[i].x - history[i - 1].x, history[i].y - history[i - 1].y)
        if (acc > MAX_ARC) {
          history.length = i + 1
          break
        }
      }
    }

    // point at arc length `dist` along [head, ...history]
    const sampleAt = (dist: number, out: Pt) => {
      if (dist <= 0 || history.length === 0) {
        out.x = head.x
        out.y = head.y
        return
      }
      let prevX = head.x
      let prevY = head.y
      let acc = 0
      for (let j = 0; j < history.length; j++) {
        const hx = history[j].x
        const hy = history[j].y
        const seg = Math.hypot(hx - prevX, hy - prevY)
        if (acc + seg >= dist) {
          const f = seg > 0 ? (dist - acc) / seg : 0
          out.x = prevX + (hx - prevX) * f
          out.y = prevY + (hy - prevY) * f
          return
        }
        acc += seg
        prevX = hx
        prevY = hy
      }
      out.x = prevX
      out.y = prevY
    }

    const wake = () => {
      stillFrames = 0
      if (!running) {
        running = true
        lastTime = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.clientX === 0 && e.clientY === 0 && !hasMoved) return
      const evs = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : []
      const list = evs.length ? evs : [e]

      if (!hasMoved) {
        hasMoved = true
        targetX = e.clientX
        targetY = e.clientY
        head.x = lastTX = targetX
        head.y = lastTY = targetY
        history.length = 0
        history.push({ x: targetX, y: targetY })
        for (const n of nodes) {
          n.x = targetX
          n.y = targetY
        }
        for (const s of sats) {
          s.x = targetX
          s.y = targetY
          s.vx = s.vy = 0
        }
        globalAlpha = 1
      }

      for (const ev of list) pushPoint(ev.clientX, ev.clientY)
      targetX = e.clientX
      targetY = e.clientY
      isInsideWindow = true
      wake()
    }

    const onLeave = () => {
      isInsideWindow = false
      wake()
    }
    const onEnter = () => {
      isInsideWindow = true
      if (hasMoved) wake()
    }

    const tmp: Pt = { x: 0, y: 0 }

    const loop = (time: number) => {
      if (!hasMoved) {
        running = false
        return
      }

      const dt = Math.min(Math.max((time - lastTime) / 1000, 0.001), 0.035)
      lastTime = time

      if (!isInsideWindow) {
        globalAlpha = Math.max(0, globalAlpha - dt * 4)
        if (globalAlpha <= 0.001) {
          gl.viewport(0, 0, canvas.width, canvas.height)
          gl.disable(gl.SCISSOR_TEST)
          gl.clearColor(0, 0, 0, 0)
          gl.clear(gl.COLOR_BUFFER_BIT)
          prevBox = null
          running = false
          return
        }
      } else {
        globalAlpha = Math.min(1, globalAlpha + dt * 6)
      }

      // head follows pointer
      const hk = 1 - Math.exp(-dt * 80)
      head.x += (targetX - head.x) * hk
      head.y += (targetY - head.y) * hk

      // speed + direction
      const fx = targetX - lastTX
      const fy = targetY - lastTY
      const fd = Math.hypot(fx, fy)
      lastTX = targetX
      lastTY = targetY
      speed += (fd / dt - speed) * Math.min(1, dt * 14)
      if (fd > 0.6) {
        moveAng = Math.atan2(fy, fx)
        dirX += (fx / fd - dirX) * Math.min(1, dt * 10)
        dirY += (fy / fd - dirY) * Math.min(1, dt * 10)
        const dn = Math.hypot(dirX, dirY) || 1
        dirX /= dn
        dirY /= dn
      }
      const speedN = Math.min(1, speed / 1400)

      // the pointer sits on the drop's leading edge while moving
      const lead = Math.min(1, Math.max(0, (speed - 60) / 300))
      const ok = 1 - Math.exp(-dt * 12)
      offX += (-dirX * R * 0.8 * lead - offX) * ok
      offY += (-dirY * R * 0.8 * lead - offY) * ok

      // tail length: grows with speed, surface tension pulls it back
      const wantTail = speed < 50 ? 0 : Math.min(MAX_TAIL, (speed - 35) * 0.006 * R)
      tailLen += (wantTail - tailLen) * Math.min(1, dt * (wantTail > tailLen ? 20 : 12))
      if (tailLen < 0.05) tailLen = 0

      // spine follows the travelled path; trailing nodes lag more
      nodes[0].x = head.x
      nodes[0].y = head.y
      for (let i = 1; i < NUM; i++) {
        sampleAt(uParam[i] * tailLen, tmp)
        const k = 1 - Math.exp(-dt * (88 - i * 2.8))
        nodes[i].x += (tmp.x - nodes[i].x) * k
        nodes[i].y += (tmp.y - nodes[i].y) * k
      }
      for (let i = 0; i < NUM; i++) {
        disp[i].x = nodes[i].x
        disp[i].y = nodes[i].y
      }
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 1; i < NUM - 1; i++) {
          disp[i].x += ((disp[i - 1].x + disp[i + 1].x) * 0.5 - disp[i].x) * 0.4
          disp[i].y += ((disp[i - 1].y + disp[i + 1].y) * 0.5 - disp[i].y) * 0.4
        }
      }

      // teardrop radius profile: fat bulb -> short thin ribbon -> leaf tip
      const e = Math.min(1, tailLen / (2.5 * R))
      const eS = e * e * (3 - 2 * e)
      const headR = R * (1 - 0.08 * eS)
      const radii: number[] = []
      for (let i = 0; i < NUM; i++) {
        const u = uParam[i]
        const s = u * tailLen
        const bulb = Math.exp(-Math.pow(s / (1.55 * headR), 2))
        let r = RIBBON_R + (headR - RIBBON_R) * bulb
        const sw = (u - 0.82) / 0.09
        r += 0.26 * R * eS * Math.exp(-sw * sw) // leaf swell
        const tip = Math.min(1, Math.max(0, (u - 0.94) / 0.06))
        r *= 1 - tip * tip * 0.85
        radii.push(Math.max(0.8, r))
      }
      radii[0] = headR

      // satellites ride the path beyond the tip (so they flick around curves)
      const fast = speed > 300 && tailLen > 3.2 * R
      satScale += ((fast ? 1 : 0) - satScale) * Math.min(1, dt * (fast ? 6 : 10))
      if (satScale < 0.01) satScale = 0

      const g1 = R * (1.0 + 0.6 * speedN)
      const g2 = g1 + R * 0.9
      const gaps = [g1, g2]
      for (let i = 0; i < 2; i++) {
        const s = sats[i]
        if (satScale > 0.01) {
          sampleAt(tailLen + gaps[i], tmp)
          s.vx += (tmp.x - s.x) * 700 * dt
          s.vy += (tmp.y - s.y) * 700 * dt
          const dmp = Math.exp(-dt * 13)
          s.vx *= dmp
          s.vy *= dmp
          s.x += s.vx * dt
          s.y += s.vy * dt
        } else {
          s.x = disp[NUM - 1].x
          s.y = disp[NUM - 1].y
          s.vx = s.vy = 0
        }
      }

      // smoke wisp: continues along the path past the droplets
      const wispLen = R * (2.4 + 2.8 * speedN)
      wisp[0].x = disp[NUM - 1].x
      wisp[0].y = disp[NUM - 1].y
      for (let k = 1; k < 5; k++) {
        sampleAt(tailLen + R * 0.7 + (k * wispLen) / 4, wisp[k])
      }
      for (let k = 1; k < 4; k++) {
        wisp[k].x += ((wisp[k - 1].x + wisp[k + 1].x) * 0.5 - wisp[k].x) * 0.5
        wisp[k].y += ((wisp[k - 1].y + wisp[k + 1].y) * 0.5 - wisp[k].y) * 0.5
      }

      // head ringing
      const eq = Math.min(0.36, speed * 0.00022)
      const w = 44
      const sub = dt / 2
      for (let i = 0; i < 2; i++) {
        wobV += (-w * w * (wob - eq) - 2 * 0.14 * w * wobV) * sub
        wob += wobV * sub
      }

      // ---- bounds ----
      let x0 = head.x + offX - R * 2
      let x1 = head.x + offX + R * 2
      let y0 = head.y + offY - R * 2
      let y1 = head.y + offY + R * 2
      for (let i = 0; i < NUM; i++) {
        const r = radii[i] + 14
        x0 = Math.min(x0, disp[i].x + offX - r)
        x1 = Math.max(x1, disp[i].x + offX + r)
        y0 = Math.min(y0, disp[i].y + offY - r)
        y1 = Math.max(y1, disp[i].y + offY + r)
      }
      if (satScale > 0.01) {
        for (const s of sats) {
          x0 = Math.min(x0, s.x + offX - R)
          x1 = Math.max(x1, s.x + offX + R)
          y0 = Math.min(y0, s.y + offY - R)
          y1 = Math.max(y1, s.y + offY + R)
        }
        for (const q of wisp) {
          x0 = Math.min(x0, q.x + offX - 12)
          x1 = Math.max(x1, q.x + offX + 12)
          y0 = Math.min(y0, q.y + offY - 12)
          y1 = Math.max(y1, q.y + offY + 12)
        }
      }
      const box = { x0, y0, x1, y1 }
      const u = prevBox
        ? {
            x0: Math.min(box.x0, prevBox.x0),
            y0: Math.min(box.y0, prevBox.y0),
            x1: Math.max(box.x1, prevBox.x1),
            y1: Math.max(box.y1, prevBox.y1),
          }
        : box
      prevBox = box

      const sx = Math.max(0, Math.floor(u.x0 * dpr))
      const sw = Math.min(canvas.width - sx, Math.ceil((u.x1 - u.x0) * dpr))
      const sy = Math.max(0, Math.floor((window.innerHeight - u.y1) * dpr))
      const sh = Math.min(canvas.height - sy, Math.ceil((u.y1 - u.y0) * dpr))

      if (sw > 0 && sh > 0) {
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.enable(gl.SCISSOR_TEST)
        gl.scissor(sx, sy, sw, sh)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        for (let i = 0; i < NUM; i++) {
          spineBuf[i * 2] = (disp[i].x + offX) * dpr
          spineBuf[i * 2 + 1] = (disp[i].y + offY) * dpr
          radiiBuf[i] = radii[i] * dpr
          const rp = radii[Math.max(i - 1, 0)]
          const rn = radii[Math.min(i + 1, NUM - 1)]
          tanBuf[i] =
            (i === 0 ? radii[1] - radii[0] : i === NUM - 1 ? radii[i] - radii[i - 1] : 0.5 * (rn - rp)) * dpr
        }
        for (let i = 0; i < 2; i++) {
          satBuf[i * 3] = (sats[i].x + offX) * dpr
          satBuf[i * 3 + 1] = (sats[i].y + offY) * dpr
          satBuf[i * 3 + 2] = sats[i].r * satScale * dpr
        }
        for (let k = 0; k < 5; k++) {
          wispBuf[k * 2] = (wisp[k].x + offX) * dpr
          wispBuf[k * 2 + 1] = (wisp[k].y + offY) * dpr
        }

        gl.uniform2f(uRes, canvas.width, canvas.height)
        gl.uniform1f(uDpr, dpr)
        gl.uniform2fv(uSpine, spineBuf)
        gl.uniform1fv(uRadii, radiiBuf)
        gl.uniform1fv(uTan, tanBuf)
        gl.uniform3fv(uSat, satBuf)
        gl.uniform2fv(uWisp, wispBuf)
        gl.uniform1f(uWispA, isInsideWindow ? satScale : 0)
        gl.uniform1f(uWob, wob)
        gl.uniform1f(uWobAng, moveAng)
        gl.uniform1f(uAlpha, globalAlpha)

        gl.drawArrays(gl.TRIANGLES, 0, 6)
        gl.disable(gl.SCISSOR_TEST)
      }

      // ---- idle sleep ----
      let maxNode = 0
      for (let i = 1; i < NUM; i++) {
        maxNode = Math.max(maxNode, Math.hypot(nodes[i].x - head.x, nodes[i].y - head.y))
      }
      const settled =
        Math.hypot(targetX - head.x, targetY - head.y) < 0.2 &&
        tailLen < 0.4 &&
        maxNode < 0.6 &&
        Math.hypot(offX, offY) < 0.3 &&
        satScale === 0 &&
        Math.abs(wob) < 0.002 &&
        Math.abs(wobV) < 0.05 &&
        speed < 5

      if (settled && isInsideWindow) {
        if (++stillFrames > 10) {
          running = false
          return
        }
      } else {
        stillFrames = 0
      }

      raf = requestAnimationFrame(loop)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(quadBuf)
    }
  }, [scale])

  return (
    <canvas
      ref={canvasRef}
      className="merc-cursor-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        userSelect: 'none',
      }}
    />
  )
}