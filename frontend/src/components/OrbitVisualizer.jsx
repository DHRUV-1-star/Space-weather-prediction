import React, { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Orbit as OrbitIcon } from 'lucide-react'

// Canvas logical size (we render at 2x for a crisp retina-like display).
const SIZE = 560
const CX = SIZE / 2
const CY = SIZE / 2
const EARTH_R = 46

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

// Non-linear altitude -> pixel orbit radius so LEO / MEO / GEO all fit nicely.
function altToPx(altKm) {
  return 40 + 210 * (altKm / (altKm + 9000))
}

// Cosmetically map in inclination to a 2D ellipse flattening.
function flattenForInclination(incDeg) {
  return 0.32 + 0.68 * Math.cos((incDeg * Math.PI) / 180)
}

function randStars(count, rng) {
  return Array.from({ length: count }, () => ({
    x: rng() * SIZE,
    y: rng() * SIZE,
    r: 0.4 + rng() * 1.2,
    tw: rng() * Math.PI * 2,
  }))
}

function randParticles(maxP) {
  return Array.from({ length: maxP }, (_, i) => ({
    key: Math.random(),
    band: Math.random() < 0.6 ? 'inner' : 'outer',
    orbitR: 0, // set below from belts
    base: Math.random() * Math.PI * 2,
    speed: (0.4 + Math.random() * 0.8) * (Math.random() < 0.5 ? -1 : 1),
    flatten: 0.45 + Math.random() * 0.2,
  })).sort((a, b) => a.key - b.key)
}

export default function OrbitVisualizer({
  name,
  orbitType,
  altitudeKm,
  inclinationDeg,
  kp,
  f107,
  protonIntensity,
}) {
  const canvasRef = useRef(null)
  const stateRef = useRef({ kp, altitudeKm, inclinationDeg, protonIntensity })
  const starsRef = useRef([])
  const partsRef = useRef([])
  const [fatal, setFatal] = useState(null)

  useEffect(() => {
    stateRef.current = { kp, altitudeKm, inclinationDeg, protonIntensity }
  }, [kp, altitudeKm, inclinationDeg, protonIntensity])

  useEffect(() => {
    starsRef.current = randStars(160, Math.random)
    partsRef.current = randParticles(60)

    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    const dpr = 2
    cv.width = SIZE * dpr
    cv.height = SIZE * dpr
    ctx.scale(dpr, dpr)

    let raf = 0
    const draw = (time) => {
      try {
        const t = time / 1000
        const s = stateRef.current
        ctx.clearRect(0, 0, SIZE, SIZE)
        drawBackground(ctx, s)
        drawStars(ctx, t, starsRef.current)
        drawAtmosphere(ctx, t, s)
        drawEarth(ctx, s)
        drawVanAlls(ctx, t, s, partsRef.current)
        drawOrbit(ctx, t, s)
        drawStormVignette(ctx, s)
        drawHud(ctx, s)
      } catch (err) {
        cancelAnimationFrame(raf)
        console.error('[OrbitVisualizer] draw error:', err)
        setFatal(err && err.message ? err.message : String(err))
        return
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-xl border border-mission-line bg-[radial-gradient(circle_at_50%_45%,#0d1730,black_75%)]">
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      {fatal && (
        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-lg border border-mission-red/60 bg-black/85 px-4 py-3 text-[12px] text-mission-red">
          <AlertTriangle className="h-4 w-4" /> Visualizer error: {fatal}
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-md border border-mission-line bg-black/40 px-2 py-1 text-[10px] text-mission-muted">
        <OrbitIcon className="h-3 w-3 text-mission-cyan" /> <span className="uppercase tracking-wider">Orbital Visualizer</span>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1 rounded-lg border border-mission-line bg-black/50 px-3 py-2 text-[10px] leading-tight backdrop-blur-sm">
        <div className="text-mission-muted">SATELLITE / ORBIT</div>
        <div className="text-mission-cyan">{orbitType} · {Math.round(altitudeKm).toLocaleString()} km</div>
        <div className="flex items-center gap-3">
          <span className="text-mission-muted">Kp <b className="text-mission-text">{kp.toFixed(1)}</b></span>
          <span className="text-mission-muted">Intensity <b className="text-mission-amber">{Math.round(protonIntensity)}%</b></span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-mission-muted">
          <span><span className="inline-block h-2 w-2 rounded-full bg-mission-amber" /> Atmosphere</span>
          <span><span className="inline-block h-2 w-2 rounded-full bg-mission-cyan" /> Van Allen belts</span>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg border border-mission-line bg-black/50 px-3 py-2 text-center">
        <div className="text-[10px] uppercase tracking-widest text-mission-muted">Degradation</div>
        <div className={`text-lg font-bold ${kp >= 7 ? 'text-mission-red' : kp >= 5 ? 'text-mission-amber' : 'text-mission-green'}`}>
          {Math.round(clamp((kp - 4) / 5, 0, 1) * 100)}%
        </div>
      </div>
    </div>
  )
}

// --------------------------------------------------------------- draw utils

function drawBackground(ctx) {
  const g = ctx.createRadialGradient(CX, CY - 20, 30, CX, CY, SIZE * 0.62)
  g.addColorStop(0, '#0e1830')
  g.addColorStop(1, 'rgba(4,8,16,1)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SIZE, SIZE)
}

function drawStars(ctx, t, stars) {
  for (const star of stars) {
    const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * star.tw))
    ctx.globalAlpha = tw
    ctx.fillStyle = '#dbe7ff'
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.r_ || (star.r / 2), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawEarth(ctx, s) {
  const g = ctx.createRadialGradient(CX - 14, CY - 16, 4, CX, CY, EARTH_R)
  g.addColorStop(0, '#7bd7e8')
  g.addColorStop(0.5, '#1f5e8a')
  g.addColorStop(1, '#0a2a52')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(CX, CY, EARTH_R, 0, Math.PI * 2)
  ctx.fill()
  // limb rim
  ctx.strokeStyle = 'rgba(180,220,255,0.5)'
  ctx.lineWidth = 1.2
  ctx.stroke()
}

function drawAtmosphere(ctx, t, s) {
  const kpFrac = s.kp / 9
  const red = clamp((s.kp - 3.5) / 5.5, 0, 1)
  const pulse = 0.5 + 0.5 * Math.sin(t * (1 + kpFrac * 7))
  const atmR = EARTH_R + 26 + kpFrac * 58 + pulse * 5

  // Colour smoothly from calm teal toward storm red as Kp climbs.
  const c1 = [34, 211, 238]
  const c2 = [248, 113, 113]
  const mix = (a, b, f) => a + (b - a) * f
  const R = Math.round(mix(c1[0], c2[0], red))
  const G = Math.round(mix(c1[1], c2[1], red))
  const B = Math.round(mix(c1[2], c2[2], red))

  // Layered glow rings
  for (let i = 3; i >= 1; i--) {
    const radius = atmR * (1 - 0.05 * i)
    const alpha = ((0.12 + kpFrac * 0.18) * i) / 3
    const g = ctx.createRadialGradient(CX, CY, EARTH_R * 0.3, CX, CY, radius)
    g.addColorStop(0, `rgba(${R},${G},${B},0)`)
    g.addColorStop(0.6, `rgba(${R},${G},${B},${alpha})`)
    g.addColorStop(1, `rgba(${R},${G},${B},0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(CX, CY, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  // Super-explicit boundary ring (pulses faster & brighter under storm)
  ctx.setLineDash([6, 6])
  ctx.strokeStyle = `rgba(${R},${G},${B},${0.35 + kpFrac * 0.55})`
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.arc(CX, CY, atmR, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawVanAlls(ctx, t, s, parts) {
  const intensity = clamp(s.protonIntensity / 100, 0, 1)
  const innerR = 110
  const outerR = 175
  const innerBand = 30
  const outerBand = 42
  // Belt wireframes
  ctx.globalAlpha = 0.28
  ctx.strokeStyle = '#22d3ee'
  ctx.lineWidth = 1
  for (const [r, band] of [[innerR, innerBand], [outerR, outerBand]]) {
    ctx.beginPath()
    ctx.ellipse(CX, CY, r, r * 0.7, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(CX, CY, r + band, (r + band) * 0.72, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Particles
  const visible = Math.floor(parts.length * (0.08 + 0.92 * intensity))
  for (let i = 0; i < visible; i++) {
    const p = parts[i]
    const rBand = p.orbitR || (p.orbitR = p.band === 'inner' ? innerR + 6 + Math.random() * (innerBand - 6) : outerR + 6 + Math.random() * (outerBand - 6))
    const ang = p.base + t * p.speed * 0.4
    const px = CX + rBand * Math.cos(ang)
    const py = CY + rBand * p.flatten * Math.sin(ang)
    const heat = intensity
    ctx.globalAlpha = 0.5 + 0.5 * heat
    ctx.fillStyle = heat > 0.55 ? '#fb923c' : '#7dd3fc'
    ctx.beginPath()
    ctx.arc(px, py, 1.2 + heat * 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawOrbit(ctx, t, s) {
  const orbitR = EARTH_R + altToPx(s.altitudeKm)
  const decayFx = s.kp >= 3 ? clamp((s.kp - 3) / 6, 0, 1) * 0.45 : 0
  const rr = orbitR * (1 - decayFx)
  const fl = flattenForInclination(s.inclinationDeg)
  const rot = Math.PI / 12

  // nominal reference orbit (ghost)
  ctx.setLineDash([2, 7])
  ctx.strokeStyle = 'rgba(34,211,238,0.28)'
  ctx.beginPath()
  ctx.ellipse(CX, CY, orbitR, orbitR * fl, rot, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Storm halo around the active orbit when Kp is high
  if (s.kp >= 5) {
    const haloPulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 6))
    ctx.strokeStyle = `rgba(248,113,113,${0.16 * haloPulse})`
    ctx.lineWidth = 9
    ctx.beginPath()
    ctx.ellipse(CX, CY, rr, rr * fl, rot, 0, Math.PI * 2)
    ctx.stroke()
  }

  // decaying active orbit
  ctx.setLineDash([8, 6])
  const decayColor = s.kp >= 7 ? '248,113,113' : s.kp >= 5 ? '251,191,36' : '34,211,238'
  ctx.strokeStyle = `rgba(${decayColor},0.9)`
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.ellipse(CX, CY, rr, rr * fl, rot, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // satellite
  const ang = t * 0.5
  const sx = CX + rr * Math.cos(ang) * Math.cos(rot) - rr * fl * Math.sin(ang) * Math.sin(rot)
  const sy = CY + rr * Math.cos(ang) * Math.sin(rot) + rr * fl * Math.sin(ang) * Math.cos(rot)
  drawSatellite(ctx, sx, sy, s)
}

function drawSatellite(ctx, x, y, s) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 9)
  glow.addColorStop(0, 'rgba(120,220,255,0.9)')
  glow.addColorStop(1, 'rgba(120,220,255,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = s.kp >= 7 ? '#f87171' : '#e6f6ff'
  ctx.beginPath()
  ctx.arc(x, y, 2.4, 0, Math.PI * 2)
  ctx.fill()
}

function drawStormVignette(ctx, s) {
  const storm = clamp((s.kp - 5) / 4, 0, 1)
  if (storm <= 0) return
  const g = ctx.createRadialGradient(CX, CY, EARTH_R, CX, CY, SIZE / 2)
  g.addColorStop(0, 'rgba(239,68,68,0)')
  g.addColorStop(1, `rgba(239,68,68,${0.18 * storm})`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SIZE, SIZE)
}

function drawHud(ctx, s) {
  const decay = s.kp >= 3 ? Math.round(clamp((s.kp - 3) / 6, 0, 1) * 45) : 0
  ctx.fillStyle = 'rgba(190,215,255,0.9)'
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText(
    `KP ${s.kp.toFixed(1)}  DECAY ${decay}%  BELTS ${Math.round(s.protonIntensity || 0)}%`,
    12, SIZE - 12,
  )
}


