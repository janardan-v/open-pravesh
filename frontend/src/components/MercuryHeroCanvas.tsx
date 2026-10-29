import { useEffect, useRef } from 'react'

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_motion_reduced;

// Smooth minimum for organic fluid blending
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// 2D Rotation matrix
mat2 rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

// Scene Distance Function: Interconnected Kinetic Liquid Mercury Mesh
// Returns distance to fluid chrome surface
float map(vec3 p) {
  float t = u_time * 0.42;
  if (u_motion_reduced > 0.5) {
    t = 1.0;
  }

  // Smooth mouse parallax rotation
  p.yz *= rot(u_mouse.y * 0.28);
  p.xz *= rot(u_mouse.x * 0.38 + t * 0.10);

  // -------------------------------------------------------------------
  // SCULPTURAL KINETIC MERCURY MESH
  // Interlocking, flowing metallic strands and fluid nexus junctions
  // -------------------------------------------------------------------

  // STRAND 1: Sweeping primary helical conduit weaving across space
  vec3 p1 = p;
  p1.yz *= rot(0.48);
  p1.xz *= rot(-t * 0.28);
  float a1 = atan(p1.z, p1.x);
  float rDist1 = length(p1.xz) - 1.55;
  float yWave1 = p1.y - 0.52 * sin(3.0 * a1 + t * 0.65) - 0.15 * cos(5.0 * a1 - t * 0.40);
  // Organically variable thickness along the path
  float thick1 = 0.115 + 0.040 * cos(2.0 * a1 + t * 0.50);
  float dStrand1 = sqrt(rDist1 * rDist1 + yWave1 * yWave1) - thick1;

  // STRAND 2: Intersecting orthogonal fluid arch weaving through Strand 1
  vec3 p2 = p;
  p2.xy *= rot(0.68);
  p2.yz *= rot(t * 0.22);
  float a2 = atan(p2.z, p2.x);
  float rDist2 = length(p2.xz) - 1.42;
  float yWave2 = p2.y - 0.58 * cos(2.0 * a2 - t * 0.55) - 0.14 * sin(4.0 * a2 + t * 0.35);
  float thick2 = 0.105 + 0.035 * sin(3.0 * a2 - t * 0.45);
  float dStrand2 = sqrt(rDist2 * rDist2 + yWave2 * yWave2) - thick2;

  // STRAND 3: Diagonal weaving conduit bridging the upper and lower loops
  vec3 p3 = p;
  p3.xz *= rot(1.15);
  p3.yz *= rot(-0.62);
  float a3 = atan(p3.y, p3.x);
  float rDist3 = length(p3.xy) - 1.62;
  float zWave3 = p3.z - 0.45 * sin(3.0 * a3 + t * 0.58);
  float thick3 = 0.095 + 0.030 * cos(4.0 * a3 + t * 0.38);
  float dStrand3 = sqrt(rDist3 * rDist3 + zWave3 * zWave3) - thick3;

  // STRAND 4: Core central twisting liquid ribbon connecting the interior
  vec3 p4 = p;
  p4.xz *= rot(t * 0.18);
  p4.yz *= rot(0.35 * sin(t * 0.5));
  float a4 = atan(p4.z, p4.x);
  float rDist4 = length(p4.xz) - 0.85;
  float yWave4 = p4.y - 0.35 * sin(2.0 * a4 + t * 0.8);
  float thick4 = 0.085 + 0.025 * sin(a4 * 3.0);
  float dStrand4 = sqrt(rDist4 * rDist4 + yWave4 * yWave4) - thick4;

  // FLUID NEXUS NODES (Melted molten mercury chambers at structural junctions)
  // Node 1: Left-center fluid nexus
  vec3 node1Pos = vec3(0.65 * cos(t * 0.35), 0.32 * sin(t * 0.55), 0.48 * sin(t * 0.35));
  float dNode1 = length(p - node1Pos) - 0.36;

  // Node 2: Right-center fluid nexus
  vec3 node2Pos = vec3(-0.58 * sin(t * 0.40), -0.28 * cos(t * 0.50), -0.42 * cos(t * 0.40));
  float dNode2 = length(p - node2Pos) - 0.32;

  // Node 3: Top fluid nexus bridge
  vec3 node3Pos = vec3(0.18 * sin(t * 0.58), 0.72 * cos(t * 0.45), -0.22 * sin(t * 0.52));
  float dNode3 = length(p - node3Pos) - 0.28;

  // Node 4: Bottom fluid nexus anchor
  vec3 node4Pos = vec3(-0.25 * cos(t * 0.48), -0.70 * sin(t * 0.42), 0.30 * cos(t * 0.38));
  float dNode4 = length(p - node4Pos) - 0.26;

  // Coalesce strands and nexus nodes with fluid surface tension (smin)
  float dMesh = smin(dStrand1, dStrand2, 0.32);
  dMesh = smin(dMesh, dStrand3, 0.28);
  dMesh = smin(dMesh, dStrand4, 0.26);
  dMesh = smin(dMesh, dNode1, 0.35);
  dMesh = smin(dMesh, dNode2, 0.32);
  dMesh = smin(dMesh, dNode3, 0.28);
  dMesh = smin(dMesh, dNode4, 0.28);

  return dMesh;
}

// Surface normal estimation via gradient
vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

// 5-tap ambient occlusion in crevices and overlapping folds
float calcAO(vec3 p, vec3 n) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.015 + 0.14 * float(i) / 4.0;
    float d = map(p + h * n);
    occ += (h - d) * sca;
    sca *= 0.88;
  }
  return clamp(1.0 - 2.5 * occ, 0.0, 1.0);
}

// Photorealistic Studio Chrome Lighting & Reflection
vec3 getChromeColor(vec3 ro, vec3 rd, vec3 p, vec3 n) {
  vec3 ref = reflect(rd, n);
  vec3 view = -rd;

  // Liquid Mercury Conductor Fresnel (Schlick conductor)
  float F0 = 0.94;
  float fresnel = F0 + (1.0 - F0) * pow(clamp(1.0 - dot(n, view), 0.0, 1.0), 3.8);

  // Studio Lighting Environment:
  // 1. Key Softbox Light (Overhead-left, long curved specular reflection)
  vec3 keySoftboxDir = normalize(vec3(-0.80, 1.25, 0.75));
  float alignKey = max(dot(ref, keySoftboxDir), 0.0);
  float keySoftbox = smoothstep(0.68, 0.98, alignKey);
  float keyHotspot = pow(alignKey, 144.0);

  // 2. Secondary Strip Light (Right-side vertical rim)
  vec3 rimDir = normalize(vec3(0.95, 0.18, -0.65));
  float alignRim = max(dot(ref, rimDir), 0.0);
  float stripLight = smoothstep(0.72, 0.98, alignRim);

  // 3. Front Studio Fill Light (Low intensity, illuminates front contour curves)
  vec3 fillDir = normalize(vec3(0.2, -0.4, 0.9));
  float fillLight = smoothstep(0.50, 0.95, max(dot(ref, fillDir), 0.0)) * 0.35;

  // 4. Studio Horizon & Floor/Sky Contrast
  // Deep obsidian floor (#060709) vs brilliant silver studio ceiling (#E2E8F0)
  float horizon = smoothstep(-0.25, 0.45, ref.y);
  vec3 skyColor = mix(vec3(0.015, 0.018, 0.024), vec3(0.85, 0.90, 0.98), horizon);

  // Assemble full chrome radiance with HDR highlights
  vec3 chrome = skyColor * 0.70;
  chrome += vec3(1.0, 1.0, 1.0) * (keySoftbox * 1.5 + keyHotspot * 2.8);
  chrome += vec3(0.88, 0.94, 1.0) * (stripLight * 1.1);
  chrome += vec3(0.65, 0.70, 0.80) * fillLight;

  // Ambient occlusion darkening overlapping conduits into deep glossy graphite
  float ao = calcAO(p, n);
  chrome *= (0.28 + 0.72 * ao);
  chrome *= fresnel;

  // Dynamic fluid caustics along the liquid strands
  float caustics = pow(max(0.0, sin(ref.x * 5.0 + u_time * 0.7) * cos(ref.z * 5.0 - u_time * 0.5)), 8.0);
  chrome += vec3(0.35, 0.45, 0.55) * caustics * ao;

  return chrome;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);

  // Camera setup
  vec3 ro = vec3(0.0, 0.0, 4.3);
  vec3 rd = normalize(vec3(uv, -1.5));

  // Raymarching loop with bounding sphere optimization
  float t = 0.0;
  float maxDist = 7.0;
  float hitDist = -1.0;

  for (int i = 0; i < 84; i++) {
    vec3 p = ro + rd * t;
    
    // Quick bounding sphere test (r = 3.4)
    if (length(p) > 3.6 && t > 2.0) {
      t += 0.25;
      if (t > maxDist) break;
      continue;
    }

    float h = map(p);
    if (h < 0.0015) {
      hitDist = t;
      break;
    }
    t += h * 0.90;
    if (t > maxDist) break;
  }

  if (hitDist > 0.0) {
    vec3 p = ro + rd * hitDist;
    vec3 n = calcNormal(p);
    vec3 color = getChromeColor(ro, rd, p, n);
    gl_FragColor = vec4(color, 1.0);
  } else {
    // Transparent background allowing container backdrop and telemetry badges to show through
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
}
`

interface MercuryHeroCanvasProps {
  className?: string
}

export function MercuryHeroCanvas({ className }: MercuryHeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    })

    if (!gl) {
      console.warn('WebGL not supported for Mercury Hero Canvas')
      return
    }

    // Compile helper
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)
    if (!vertShader || !fragShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    // Full-screen quad buffer
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )

    const aPositionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPositionLocation)
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0)

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uMotionReduced = gl.getUniformLocation(program, 'u_motion_reduced')

    // Mouse tracking with smooth lerp
    let mouseTargetX = 0
    let mouseTargetY = 0
    let mouseX = 0
    let mouseY = 0

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      // Normalized between -1.0 and 1.0 relative to canvas center
      mouseTargetX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseTargetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Resize handling with high DPR for crisp retina display
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0)
      const displayWidth = Math.round(canvas.clientWidth * dpr)
      const displayHeight = Math.round(canvas.clientHeight * dpr)

      if (displayWidth === 0 || displayHeight === 0) return

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth
        canvas.height = displayHeight
        gl.viewport(0, 0, displayWidth, displayHeight)
      }
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    window.addEventListener('resize', resize)

    // Reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let prefersReducedMotion = motionQuery.matches
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches
    }
    motionQuery.addEventListener('change', handleMotionChange)

    let animationFrameId: number
    const startTime = performance.now()
    let isVisible = true

    // Pause rendering when scrolled out of view to save battery/GPU
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    })
    observer.observe(canvas)

    const render = (now: number) => {
      if (isVisible && canvas.width > 0 && canvas.height > 0) {
        // Smooth mouse lerp
        mouseX += (mouseTargetX - mouseX) * 0.08
        mouseY += (mouseTargetY - mouseY) * 0.08

        const elapsed = (now - startTime) * 0.001

        gl.uniform2f(uResolution, canvas.width, canvas.height)
        gl.uniform1f(uTime, elapsed)
        gl.uniform2f(uMouse, mouseX, mouseY)
        gl.uniform1f(uMotionReduced, prefersReducedMotion ? 1.0 : 0.0)

        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', resize)
      motionQuery.removeEventListener('change', handleMotionChange)
      resizeObserver.disconnect()
      observer.disconnect()
      gl.deleteProgram(program)
      gl.deleteShader(vertShader)
      gl.deleteShader(fragShader)
      gl.deleteBuffer(positionBuffer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label="Interconnected Kinetic Liquid Mercury Mesh Sculpture"
      role="img"
    />
  )
}
